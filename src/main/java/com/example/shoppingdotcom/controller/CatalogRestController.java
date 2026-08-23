package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.dto.CategoryDto;
import com.example.shoppingdotcom.dto.PageDto;
import com.example.shoppingdotcom.dto.ProductDto;
import com.example.shoppingdotcom.model.Category;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.service.CategoryService;
import com.example.shoppingdotcom.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class CatalogRestController {

    private static final int HOME_PRODUCT_LIMIT = 8;

    @Autowired
    private CategoryService categoryService;

    @Autowired
    private ProductService productService;

    @GetMapping("/api/categories")
    public ResponseEntity<List<CategoryDto>> categories() {
        return ResponseEntity.ok(categoryService.getAllActiveCategory().stream()
                .map(CategoryDto::from)
                .toList());
    }

    @GetMapping("/api/catalog/home")
    public ResponseEntity<Map<String, Object>> home() {
        List<CategoryDto> categories = categoryService.getAllActiveCategory().stream()
                .sorted(Comparator.comparing(Category::getId))
                .map(CategoryDto::from)
                .toList();
        List<ProductDto> newArrivals = productService.getAllActiveProducts("").stream()
                .sorted(Comparator.comparing(Product::getId).reversed())
                .limit(HOME_PRODUCT_LIMIT)
                .map(ProductDto::from)
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("categories", categories);
        body.put("products", newArrivals);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/api/products")
    public ResponseEntity<PageDto<ProductDto>> products(
            @RequestParam(value = "category", defaultValue = "") String category,
            @RequestParam(name = "pageNo", defaultValue = "0") Integer pageNo,
            @RequestParam(name = "pageSize", defaultValue = "12") Integer pageSize,
            @RequestParam(name = "keyword", defaultValue = "") String keyword) {

        Page<Product> page;
        if (StringUtils.hasText(keyword)) {
            page = productService.searchProductPagination(pageNo, pageSize, keyword);
        } else {
            page = productService.getAllActiveProductPagination(pageNo, pageSize, category);
        }

        List<ProductDto> content = page.getContent().stream().map(ProductDto::from).toList();
        return ResponseEntity.ok(new PageDto<>(content, page.getNumber(), pageSize,
                page.getTotalElements(), page.getTotalPages(), page.isFirst(), page.isLast()));
    }

    @GetMapping("/api/products/{id}")
    public ResponseEntity<ProductDto> productById(@PathVariable int id) {
        Product product = productService.getProductById(id);
        if (product == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(ProductDto.from(product));
    }
}
