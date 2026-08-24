package com.example.shoppingdotcom.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ProductSearchIndexInitializer implements ApplicationRunner {

    private static final String[] STATEMENTS = {
            """
            CREATE EXTENSION IF NOT EXISTS pg_trgm
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_product_fts
            ON product USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '')))
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_product_title_trgm
            ON product USING GIN (lower(title) gin_trgm_ops)
            """,
            """
            CREATE INDEX IF NOT EXISTS idx_product_category_trgm
            ON product USING GIN (lower(category) gin_trgm_ops)
            """
    };

    private final JdbcTemplate jdbcTemplate;

    public ProductSearchIndexInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String statement : STATEMENTS) {
            try {
                jdbcTemplate.execute(statement);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
