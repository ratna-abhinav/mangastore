package com.example.shoppingdotcom.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1)
public class SearchSchemaInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SearchSchemaInitializer.class);

    private static final String[] STATEMENTS = {
            "CREATE EXTENSION IF NOT EXISTS vector",
            "CREATE EXTENSION IF NOT EXISTS pg_trgm",
            "ALTER TABLE product ADD COLUMN IF NOT EXISTS embedding vector(768)",
            """
            CREATE INDEX IF NOT EXISTS idx_product_fts ON product USING GIN
            (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '')))
            """,
            "CREATE INDEX IF NOT EXISTS idx_product_title_trgm ON product USING GIN (lower(title) gin_trgm_ops)",
            "CREATE INDEX IF NOT EXISTS idx_product_category_trgm ON product USING GIN (lower(category) gin_trgm_ops)",
            "CREATE INDEX IF NOT EXISTS idx_product_embedding ON product USING hnsw (embedding vector_cosine_ops)"
    };

    private final JdbcTemplate jdbcTemplate;

    public SearchSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String statement : STATEMENTS) {
            try {
                jdbcTemplate.execute(statement);
            } catch (Exception e) {
                log.error("Search schema statement failed: {}", e.getMessage());
            }
        }
        log.info("Search schema ready (vector column, HNSW, FTS and trigram indexes)");
    }
}
