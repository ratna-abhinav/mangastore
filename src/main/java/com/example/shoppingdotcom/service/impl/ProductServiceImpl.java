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
import java.util.List;

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
        List<Product> products = null;
        if (ObjectUtils.isEmpty(category)) {
            List<Category> activeCategories = categoryRepository.findByIsActive(1);
            for (Category curCategory : activeCategories) {
                List<Product> curCategoryProducts = productRepository.findByIsActiveAndCategory(1, curCategory.getName());
                if (!ObjectUtils.isEmpty(curCategoryProducts)) {
                    if (products == null) products = curCategoryProducts;
                    else products.addAll(curCategoryProducts);
                }
            }
        } else {
            products = productRepository.findByIsActiveAndCategory(1, category);
        }
        return products;
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
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return productRepository.findByIsActiveAndTitleContainingIgnoreCaseOrIsActiveAndCategoryContainingIgnoreCase(1, keyword, 1, keyword, pageable);
    }

    @Override
    public Page<Product> searchProductAdminPagination(Integer pageNo, Integer pageSize, String keyword) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        return productRepository.findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(keyword, keyword, pageable);
    }


    @Override
    public Page<Product> getAllActiveProductPagination(Integer pageNo, Integer pageSize, String category) {
        Pageable pageable = PageRequest.of(pageNo, pageSize);
        Page<Product> productsPage;

        if (ObjectUtils.isEmpty(category)) {
            List<Product> allProducts = new ArrayList<>();
            List<Category> activeCategories = categoryRepository.findByIsActive(1);

            for (Category curCategory : activeCategories) {
                Page<Product> curCategoryProductsPage = productRepository.findByIsActiveAndCategory(Pageable.unpaged(), 1, curCategory.getName());
                if (!curCategoryProductsPage.isEmpty()) {
                    allProducts.addAll(curCategoryProductsPage.getContent());
                }
            }
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageSize), allProducts.size());

            List<Product> paginatedProducts;
            if (start > allProducts.size()) {
                paginatedProducts = new ArrayList<>();
            } else {
                paginatedProducts = allProducts.subList(start, end);
            }
            productsPage = new PageImpl<>(paginatedProducts, pageable, allProducts.size());
        } else {
            productsPage = productRepository.findByIsActiveAndCategory(pageable, 1, category);
        }
        return productsPage;
    }

}
