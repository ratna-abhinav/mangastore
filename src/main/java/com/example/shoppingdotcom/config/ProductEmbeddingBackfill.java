package com.example.shoppingdotcom.config;

import com.example.shoppingdotcom.service.EmbeddingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Order(2)
public class ProductEmbeddingBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductEmbeddingBackfill.class);

    private final EmbeddingService embeddingService;
    private final JdbcTemplate jdbcTemplate;

    public ProductEmbeddingBackfill(EmbeddingService embeddingService, JdbcTemplate jdbcTemplate) {
        this.embeddingService = embeddingService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!embeddingService.isEnabled()) {
            log.info("Embedding backfill skipped: EmbeddingService disabled");
            return;
        }
        List<Map<String, Object>> pending = jdbcTemplate.queryForList(
                "SELECT id, title, description, category FROM product WHERE embedding IS NULL ORDER BY id");
        if (pending.isEmpty()) {
            log.info("Embedding backfill: no products pending");
            return;
        }
        log.info("Embedding backfill started: {} products without embeddings", pending.size());
        int embedded = 0;
        for (Map<String, Object> row : pending) {
            Integer id = ((Number) row.get("id")).intValue();
            String text = embeddingService.productText(
                    (String) row.get("title"),
                    (String) row.get("description"),
                    (String) row.get("category"));
            String literal = embeddingService.embedDocumentAsVectorLiteral(text);
            if (literal == null) {
                log.warn("Backfill failed for productId={}", id);
                continue;
            }
            jdbcTemplate.update("UPDATE product SET embedding = CAST(? AS vector) WHERE id = ?", literal, id);
            embedded++;
        }
        log.info("Embedding backfill done: embedded={} of {} pending", embedded, pending.size());
    }
}
