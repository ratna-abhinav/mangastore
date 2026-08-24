package com.example.shoppingdotcom.repository;

import com.example.shoppingdotcom.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    List<Product> findByIsActiveTrue();

    List<Product> findByCategory(String category);

    List<Product> findByIsActiveAndCategory(Integer isActive, String category);

    List<Product> findByIsActiveAndTitleContainingIgnoreCaseOrIsActiveAndCategoryContainingIgnoreCase(
            Integer isActive, String keyword, Integer isActive2, String keyword1);

    List<Product> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(String title, String category);

    Page<Product> findByTitleContainingIgnoreCaseOrCategoryContainingIgnoreCase(String title, String category, Pageable pageable);

    Page<Product> findByIsActiveAndTitleContainingIgnoreCaseOrIsActiveAndCategoryContainingIgnoreCase(
            Integer isActive, String title, Integer isActive2, String category, Pageable pageable);

    Page<Product> findByCategory(Pageable pageable, String category);

    Page<Product> findByIsActive(Pageable pageable, Integer isActive);

    Page<Product> findByIsActiveAndCategory(Pageable pageable, Integer isActive, String category);

    List<Product> findByIsActiveAndCategoryInOrderByIdDesc(Integer isActive, Collection<String> categories);

    Page<Product> findByIsActiveAndCategoryIn(Integer isActive, Collection<String> categories, Pageable pageable);
}
