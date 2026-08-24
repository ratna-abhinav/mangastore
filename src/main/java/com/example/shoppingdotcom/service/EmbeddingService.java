package com.example.shoppingdotcom.service;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

    private static final String MODEL = "gemini-embedding-001";
    private static final int DIMENSIONS = 768;
    private static final String TASK_DOCUMENT = "RETRIEVAL_DOCUMENT";
    private static final String TASK_QUERY = "RETRIEVAL_QUERY";
    private static final int MAX_TEXT_CHARS = 8000;

    private final String apiKey;
    private final RestClient restClient;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public EmbeddingService(@Value("${gemini.api.key:}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        if (isEnabled()) {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(3000);
            factory.setReadTimeout(5000);
            this.restClient = RestClient.builder()
                    .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                    .requestFactory(factory)
                    .build();
        } else {
            this.restClient = null;
        }
    }

    @PostConstruct
    void logStatus() {
        if (isEnabled()) {
            log.info("EmbeddingService enabled: model={} dims={}", MODEL, DIMENSIONS);
        } else {
            log.warn("EmbeddingService DISABLED: GEMINI_API_KEY not set, semantic search will be skipped");
        }
    }

    public boolean isEnabled() {
        return !apiKey.isEmpty();
    }

    public float[] embedQuery(String text) {
        return doEmbed(text, TASK_QUERY);
    }

    public float[] embedDocument(String text) {
        return doEmbed(text, TASK_DOCUMENT);
    }

    private float[] doEmbed(String text, String taskType) {
        if (!isEnabled() || text == null || text.isBlank()) {
            return null;
        }
        String trimmed = text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text;
        long start = System.nanoTime();
        log.info("Gemini embed START: model={} task={} chars={}", MODEL, taskType, trimmed.length());
        try {
            JsonNode response = restClient.post()
                    .uri("/models/" + MODEL + ":embedContent?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .body(Map.of(
                            "model", "models/" + MODEL,
                            "content", Map.of("parts", List.of(Map.of("text", trimmed))),
                            "taskType", taskType,
                            "outputDimensionality", DIMENSIONS))
                    .retrieve()
                    .body(JsonNode.class);
            JsonNode values = response == null ? null : response.path("embedding").path("values");
            if (values == null || !values.isArray() || values.size() == 0) {
                log.warn("Gemini embed returned no values after {}ms", elapsedMs(start));
                return null;
            }
            float[] out = new float[values.size()];
            for (int i = 0; i < out.length; i++) {
                out[i] = (float) values.get(i).asDouble();
            }
            log.info("Gemini embed OK: dims={} took {}ms", out.length, elapsedMs(start));
            return out;
        } catch (Exception e) {
            log.warn("Gemini embed FAILED after {}ms: {}", elapsedMs(start), e.getMessage());
            return null;
        }
    }

    public String embedQueryAsVectorLiteral(String text) {
        float[] vector = embedQuery(text);
        return vector == null ? null : toVectorLiteral(vector);
    }

    public String embedDocumentAsVectorLiteral(String text) {
        float[] vector = embedDocument(text);
        return vector == null ? null : toVectorLiteral(vector);
    }

    @Async("embeddingExecutor")
    @Transactional
    public void embedProduct(Integer productId, String text) {
        if (!isEnabled()) {
            return;
        }
        try {
            String literal = embedDocumentAsVectorLiteral(text);
            if (literal == null) {
                log.warn("Embedding skipped for productId={}: no vector produced", productId);
                return;
            }
            jdbcTemplate.update("UPDATE product SET embedding = CAST(? AS vector) WHERE id = ?", literal, productId);
            log.info("Stored embedding for productId={}", productId);
        } catch (Exception e) {
            log.warn("Embedding storage failed for productId={}: {}", productId, e.getMessage());
        }
    }

    public String productText(String title, String description, String category) {
        StringBuilder sb = new StringBuilder();
        if (title != null) {
            sb.append(title).append(". ");
        }
        if (description != null) {
            sb.append(description).append(". ");
        }
        if (category != null) {
            sb.append(category);
        }
        return sb.toString().trim();
    }

    private String toVectorLiteralOrWarn(float[] vector, Integer productId) {
        if (vector == null) {
            return null;
        }
        return toVectorLiteral(vector);
    }

    private static String toVectorLiteral(float[] vector) {
        StringBuilder sb = new StringBuilder(vector.length * 10);
        sb.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(vector[i]);
        }
        sb.append(']');
        return sb.toString();
    }

    private static long elapsedMs(long startNanos) {
        return (System.nanoTime() - startNanos) / 1_000_000;
    }
}
