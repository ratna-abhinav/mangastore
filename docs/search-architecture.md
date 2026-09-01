# Search Service Architecture

Hybrid product search combining four matching signals in a single Postgres query,
with semantic understanding powered by Gemini embeddings stored via pgvector.

## Components

```mermaid
flowchart TB
    subgraph Client["Browser SPA"]
        UI["React + react-query<br/>Products.tsx"]
    end

    subgraph App["Render - Docker container - Spring Boot"]
        REST["CatalogRestController / AdminRestController"]
        SVC["ProductServiceImpl.searchHybrid()"]
        EMB["EmbeddingService"]
        ASYNC["embed- thread pool @Async"]
        REPO["ProductRepository native SQL"]
    end

    subgraph Ext["External APIs"]
        GEM["Gemini gemini-embedding-001<br/>taskType RETRIEVAL_QUERY / DOCUMENT<br/>dims 768"]
    end

    subgraph Data["Neon Postgres"]
        TBL[("product<br/>title, category, description,<br/>embedding vector(768)")]
        IDX_FTS["GIN index<br/>to_tsvector(title+category)"]
        IDX_TRG["GIN trgm indexes<br/>lower(title), lower(category)"]
        IDX_HNSW["HNSW index<br/>embedding vector_cosine_ops"]
    end

    UI -->|"GET /api/products?keyword="| REST --> SVC
    SVC -->|"sanitize + prefix tsquery"| SVC
    SVC -->|"embed query ~100ms"| GEM
    GEM -->|"float[768]"| SVC
    SVC -->|"ONE query: tsQuery + keyword + vector"| REPO
    REPO --> TBL
    IDX_FTS --- TBL
    IDX_TRG --- TBL
    IDX_HNSW --- TBL

    AdminFlow["Admin saves product"] --> REPO_SAVE["productRepository.save()"]
    REPO_SAVE --> ASYNC -->|"RETRIEVAL_DOCUMENT"| GEM
    ASYNC -->|"UPDATE embedding"| TBL
```

## Read path - every search

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as CatalogRestController
    participant S as ProductServiceImpl
    participant E as EmbeddingService
    participant G as Gemini API
    participant N as Neon Postgres

    B->>C: GET /api/products?keyword=survival revenge tale
    C->>S: searchProductPagination(pageNo, pageSize, keyword)
    S->>S: sanitizeKeyword() - strips punctuation, lowercases
    S->>S: buildPrefixTsQuery() - "survival:* & revenge:* & tale:*"
    alt sanitized keyword non-empty AND key present
        S->>E: embedQueryAsVectorLiteral(keyword)
        E->>G: POST embedContent (RETRIEVAL_QUERY, dims=768)
        G-->>E: float[768]
        E-->>S: "[0.013,-0.227,...]"
    else empty keyword or no API key
        S->>S: queryVec = null (semantic signal disabled)
    end
    S->>N: single SQL - FTS + trigram + LIKE + cosine WHERE,<br/>blended rank ORDER BY, LIMIT/OFFSET (+ count)
    N-->>S: ranked rows + total
    S-->>C: Page<Product>
    C-->>B: 200 JSON PageDto
```

## Write path - keeping embeddings fresh

```mermaid
flowchart LR
    A["Admin create/update product"] --> B["JPA save"]
    B --> C["@Async embed- worker<br/>request thread not blocked"]
    C --> D["Gemini embedContent<br/>RETRIEVAL_DOCUMENT"]
    D --> E["UPDATE product<br/>SET embedding = CAST(? AS vector)"]

    subgraph Startup["Application startup"]
        direction TB
        S1{"SearchSchemaInitializer<br/>@Order(1)"} --> S2["idempotent DDL:<br/>vector + pg_trgm extensions,<br/>embedding column, HNSW + GIN indexes"]
        S2 --> S3{"ProductEmbeddingBackfill<br/>@Order(2)"}
        S3 -->|"rows WHERE embedding IS NULL"| S4["embed each once"]
        S3 -->|"none pending"| S5["no-op - zero Gemini calls"]
    end
```

## Matching signals

| # | Signal | Backed by | Matches | Example |
|---|--------|-----------|---------|---------|
| 1 | FTS `ts_rank` | GIN `to_tsvector('english', title+category)` | whole words + stems | `saga` |
| 2 | Trigram `%` | GIN `lower(title/category) gin_trgm_ops` | typos | `vinlad` → Vinland Saga |
| 3 | Substring `LIKE` | same trigram GIN indexes | fragments (len >= 2) | `ind` → Wind Breaker |
| 4 | Cosine `<=>` | HNSW on `embedding` (distance < 0.34) | meaning, zero word overlap | survival revenge tale |

Blended ranking: `ts_rank*2 + greatest(trigram similarity) + (1 - cosine distance)`.

## Behavior guarantees

| Scenario | Behavior |
|----------|----------|
| Blank / punctuation-only input | Browse path or guarded empty result - **no Gemini call** |
| Gemini down / key missing | Signal 4 silently dropped; literal signals still return results (`semantic=false` logged) |
| Semantic quota exhausted | `SearchRateLimiter` skips signal 4 for that identity; keyword results still served. Limits (per minute/day): anonymous 5/30, logged-in 10/75, global circuit breaker 200/day; admins exempt |
| Repeat search | Served from react-query cache - zero server hops |
| New product not yet embedded | Found by signals 1-3 immediately; semantic after async embed lands |
| Fresh database | Schema auto-created at boot; backfill embeds existing rows once |
