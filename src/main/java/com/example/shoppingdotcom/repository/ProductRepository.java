package com.example.shoppingdotcom.repository;

import com.example.shoppingdotcom.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    Page<Product> findByIsActiveAndCategory(Pageable pageable, Integer isActive, String category);

    List<Product> findByIsActiveAndCategoryInOrderByIdDesc(Integer isActive, Collection<String> categories);

    Page<Product> findByIsActiveAndCategoryIn(Integer isActive, Collection<String> categories, Pageable pageable);

    @Query(value = """
            SELECT * FROM product
            WHERE is_active = 1
              AND (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
                       @@ to_tsquery('english', :tsQuery)
                   OR lower(title) % :keyword
                   OR lower(category) % :keyword
                   OR (char_length(:keyword) >= 2
                       AND (lower(coalesce(title, '')) LIKE '%' || :keyword || '%'
                            OR lower(coalesce(category, '')) LIKE '%' || :keyword || '%')))
            ORDER BY (coalesce(ts_rank(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '')),
                                       to_tsquery('english', :tsQuery)), 0) * 2
                      + greatest(similarity(lower(title), :keyword),
                                 similarity(lower(category), :keyword))) DESC,
                     id DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Product> searchActiveFullText(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                                       @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = """
            SELECT count(*) FROM product
            WHERE is_active = 1
              AND (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
                       @@ to_tsquery('english', :tsQuery)
                   OR lower(title) % :keyword
                   OR lower(category) % :keyword
                   OR (char_length(:keyword) >= 2
                       AND (lower(coalesce(title, '')) LIKE '%' || :keyword || '%'
                            OR lower(coalesce(category, '')) LIKE '%' || :keyword || '%')))
            """, nativeQuery = true)
    long countActiveFullText(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword);

    @Query(value = """
            SELECT * FROM product
            WHERE (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
                       @@ to_tsquery('english', :tsQuery)
                   OR lower(title) % :keyword
                   OR lower(category) % :keyword
                   OR (char_length(:keyword) >= 2
                       AND (lower(coalesce(title, '')) LIKE '%' || :keyword || '%'
                            OR lower(coalesce(category, '')) LIKE '%' || :keyword || '%')))
            ORDER BY (coalesce(ts_rank(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '')),
                                       to_tsquery('english', :tsQuery)), 0) * 2
                      + greatest(similarity(lower(title), :keyword),
                                 similarity(lower(category), :keyword))) DESC,
                     id DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<Product> searchAllFullText(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                                    @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = """
            SELECT count(*) FROM product
            WHERE (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
                       @@ to_tsquery('english', :tsQuery)
                   OR lower(title) % :keyword
                   OR lower(category) % :keyword
                   OR (char_length(:keyword) >= 2
                       AND (lower(coalesce(title, '')) LIKE '%' || :keyword || '%'
                            OR lower(coalesce(category, '')) LIKE '%' || :keyword || '%')))
            """, nativeQuery = true)
    long countAllFullText(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword);
}
