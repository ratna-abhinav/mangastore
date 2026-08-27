package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.model.Category;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.repository.CategoryRepository;
import com.example.shoppingdotcom.repository.ProductRepository;
import com.example.shoppingdotcom.service.JikanCoverService;
import com.example.shoppingdotcom.util.AppConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/maintenance")
public class MaintenanceController {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceController.class);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final JikanCoverService jikanCoverService;

    public MaintenanceController(ProductRepository productRepository,
                                 CategoryRepository categoryRepository,
                                 JikanCoverService jikanCoverService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.jikanCoverService = jikanCoverService;
    }

    @PostMapping("/backfill-images")
    public ResponseEntity<Map<String, Object>> backfillImages() {
        int productsFixed = 0;
        int productsSkipped = 0;
        int categoriesFixed = 0;
        int categoriesSkipped = 0;

        List<Product> products = productRepository.findAll().stream()
                .filter(p -> isDefaultImage(p.getImage()))
                .toList();
        log.info("Image backfill: {} products with default image", products.size());
        for (Product p : products) {
            Optional<String> cover = jikanCoverService.fetchAndUploadCover(p.getTitle(), "products");
            if (cover.isPresent()) {
                p.setImage(cover.get());
                productRepository.save(p);
                productsFixed++;
            } else {
                productsSkipped++;
            }
        }

        List<Category> categories = categoryRepository.findAll().stream()
                .filter(c -> isDefaultImage(c.getImageName()))
                .toList();
        log.info("Image backfill: {} categories with default image", categories.size());
        for (Category c : categories) {
            Optional<String> cover = jikanCoverService.fetchAndUploadCover(c.getName(), "categories");
            if (cover.isPresent()) {
                c.setImageName(cover.get());
                categoryRepository.save(c);
                categoriesFixed++;
            } else {
                categoriesSkipped++;
            }
        }

        log.info("Image backfill done: productsFixed={} categoriesFixed={} skipped={}",
                productsFixed, categoriesFixed, productsSkipped + categoriesSkipped);
        return ResponseEntity.ok(Map.of(
                "productsFixed", productsFixed,
                "productsSkipped", productsSkipped,
                "categoriesFixed", categoriesFixed,
                "categoriesSkipped", categoriesSkipped
        ));
    }

    private boolean isDefaultImage(String url) {
        if (url == null || url.isBlank()) {
            return true;
        }
        return url.equals(AppConstants.DEFAULT_IMAGE_URL)
                || url.contains("defaults/default-image");
    }
}
