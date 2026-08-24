package com.example.shoppingdotcom.repository;

import com.example.shoppingdotcom.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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

    Page<Product> findByIsActiveAndTitleContainingIgnoreCaseOrIsActiveAndCategoryContainingIgnoreCase(
            Integer isActive, String title, Integer isActive2, String category, Pageable pageable);

    Page<Product> findByCategory(Pageable pageable, String category);

    Page<Product> findByIsActive(Pageable pageable, Integer isActive);

    Page<Product> findByIsActiveAndCategory(Pageable pageable, Integer isActive, String category);

    List<Product> findByIsActiveAndCategoryInOrderByIdDesc(Integer isActive, Collection<String> categories);

    Page<Product> findByIsActiveAndCategoryIn(Integer isActive, Collection<String> categories, Pageable pageable);

    String SEARCH_COLUMNS = """
            id, title, description, category, price, stock, image, discount, discounted_price, is_active
            """;

    String MATCH_PREDICATE = """
            (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, ''))
                 @@ to_tsquery('english', :tsQuery)
             OR lower(title) % :keyword
             OR lower(category) % :keyword
             OR (char_length(:keyword) >= 2
                 AND (lower(coalesce(title, '')) LIKE '%' || :keyword || '%'
                      OR lower(coalesce(category, '')) LIKE '%' || :keyword || '%'))
             OR (:queryVec IS NOT NULL AND embedding <=> CAST(:queryVec AS vector) < 0.6))
            """;

    String RANK_EXPRESSION = """
            (coalesce(ts_rank(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(category, '')),
                              to_tsquery('english', :tsQuery)), 0) * 2
             + greatest(similarity(lower(title), :keyword),
                        similarity(lower(category), :keyword))
             + coalesce(1 - (embedding <=> CAST(:queryVec AS vector)), 0))
            """;

    @Query(value = "SELECT " + SEARCH_COLUMNS + " FROM product WHERE is_active = 1 AND " + MATCH_PREDICATE
            + " ORDER BY " + RANK_EXPRESSION + " DESC, id DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Product> searchActiveHybrid(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                                     @Param("queryVec") String queryVec,
                                     @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) FROM product WHERE is_active = 1 AND " + MATCH_PREDICATE, nativeQuery = true)
    long countActiveHybrid(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                           @Param("queryVec") String queryVec);

    @Query(value = "SELECT " + SEARCH_COLUMNS + " FROM product WHERE " + MATCH_PREDICATE
            + " ORDER BY " + RANK_EXPRESSION + " DESC, id DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Product> searchAllHybrid(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                                  @Param("queryVec") String queryVec,
                                  @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) FROM product WHERE " + MATCH_PREDICATE, nativeQuery = true)
    long countAllHybrid(@Param("tsQuery") String tsQuery, @Param("keyword") String keyword,
                        @Param("queryVec") String queryVec);

    @Modifying
    @Query(value = "UPDATE product SET embedding = CAST(:vec AS vector) WHERE id = :id", nativeQuery = true)
    int updateEmbedding(@Param("id") Integer id, @Param("vec") String vec);
}
