package com.example.shoppingdotcom.service.impl;

import com.example.shoppingdotcom.model.Category;
import com.example.shoppingdotcom.model.Product;
import com.example.shoppingdotcom.repository.CategoryRepository;
import com.example.shoppingdotcom.repository.ProductRepository;
import com.example.shoppingdotcom.service.NeonStorageService;
import com.example.shoppingdotcom.service.ProductService;
import com.example.shoppingdotcom.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NeonStorageService neonStorageService;

    @Override
    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    public Page<Product> getAllProductsPagination(Integer pageNo, Integer pageSize) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return productRepository.findAll(pageable);
    }

    @Override
    public Boolean deleteProduct(Integer id) {
        Product product = productRepository.findById(id).orElse(null);

        if (!ObjectUtils.isEmpty(product)) {
            productRepository.delete(product);
            return true;
        }
        return false;
    }

    @Override
    public Product getProductById(Integer id) {
        return productRepository.findById(id).orElse(null);
    }

    @Override
    public List<Product> getProductsByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    @Override
    public Product updateProduct(Product product, MultipartFile image) {

        Product dbProduct = getProductById(product.getId());

        dbProduct.setTitle(product.getTitle());
        dbProduct.setDescription(product.getDescription());
        dbProduct.setCategory(product.getCategory());
        dbProduct.setPrice(product.getPrice());
        dbProduct.setStock(product.getStock());
        if (dbProduct.getImage().isEmpty()) dbProduct.setImage(AppConstants.DEFAULT_IMAGE_URL);
        dbProduct.setIsActive(product.getIsActive());
        dbProduct.setDiscount(product.getDiscount());

        Double disocuntValue = product.getPrice() * (product.getDiscount() / 100.0);
        Double discountedPrice = product.getPrice() - disocuntValue;
        dbProduct.setDiscountedPrice(discountedPrice);

        Product updatedProduct = productRepository.save(dbProduct);
        if (!ObjectUtils.isEmpty(updatedProduct)) {
            if (!image.isEmpty()) {

                try {
                    String imageUploadUrl = neonStorageService.uploadFile("products", image);
                    updatedProduct.setImage(imageUploadUrl);
                    productRepository.save(updatedProduct);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
            return product;
        }
        return null;
    }

    @Override
    public List<Product> getAllActiveProducts(String category) {
        if (!ObjectUtils.isEmpty(category)) {
            return productRepository.findByIsActiveAndCategory(1, category);
        }
        List<String> activeCategoryNames = getActiveCategoryNames();
        if (activeCategoryNames.isEmpty()) {
            return new ArrayList<>();
        }
        return productRepository.findByIsActiveAndCategoryInOrderByIdDesc(1, activeCategoryNames);
    }

    @Override
    public List<Product> searchProduct(String keyword) {
        return productRepository.findByIsActiveAndTitleContainingIgnoreCaseOrIsActiveAndCategoryContainingIgnoreCase(1, keyword, 1, keyword);
    }

    @Override
    public List<Product> searchProductAdmin(String keyword) {
        return productRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword);
    }

    @Override
    public Page<Product> searchProductPagination(Integer pageNo, Integer pageSize, String keyword) {
        String sanitized = sanitizeKeyword(keyword);
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        List<Product> content = productRepository.searchActiveFullText(
                buildPrefixTsQuery(sanitized), sanitized, pageSize, (long) pageNo * pageSize);
        long total = (pageNo == 0 && content.size() < pageSize)
                ? content.size()
                : productRepository.countActiveFullText(buildPrefixTsQuery(sanitized), sanitized);
        return new PageImpl<>(content, pageable, total);
    }

    @Override
    public Page<Product> searchProductAdminPagination(Integer pageNo, Integer pageSize, String keyword) {
        String sanitized = sanitizeKeyword(keyword);
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        List<Product> content = productRepository.searchAllFullText(
                buildPrefixTsQuery(sanitized), sanitized, pageSize, (long) pageNo * pageSize);
        long total = (pageNo == 0 && content.size() < pageSize)
                ? content.size()
                : productRepository.countAllFullText(buildPrefixTsQuery(sanitized), sanitized);
        return new PageImpl<>(content, pageable, total);
    }

    private String sanitizeKeyword(String keyword) {
        if (ObjectUtils.isEmpty(keyword)) {
            return "";
        }
        return keyword.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9 ]+", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String buildPrefixTsQuery(String sanitized) {
        if (sanitized.isEmpty()) {
            return null;
        }
        return Arrays.stream(sanitized.split(" "))
                .filter(token -> !token.isEmpty())
                .map(token -> token + ":*")
                .collect(Collectors.joining(" & "));
    }


    @Override
    public Page<Product> getAllActiveProductPagination(Integer pageNo, Integer pageSize, String category) {
        Sort newestFirst = Sort.by(Sort.Direction.DESC, "id");
        Pageable pageable = PageRequest.of(pageNo, pageSize, newestFirst);

        if (ObjectUtils.isEmpty(category)) {
            List<String> activeCategoryNames = getActiveCategoryNames();
            if (activeCategoryNames.isEmpty()) {
                return new PageImpl<>(new ArrayList<>(), pageable, 0);
            }
            return productRepository.findByIsActiveAndCategoryIn(1, activeCategoryNames, pageable);
        }
        return productRepository.findByIsActiveAndCategory(pageable, 1, category);
    }

    private List<String> getActiveCategoryNames() {
        return categoryRepository.findByIsActive(1).stream()
                .map(Category::getName)
                .toList();
    }

}
