package com.example.shoppingdotcom.repository;

import com.example.shoppingdotcom.model.ProductOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductOrderRepository extends JpaRepository<ProductOrder, Integer> {

    List<ProductOrder> findByUserId(Integer userId);

    boolean existsByOrderId(String orderId);

    ProductOrder findByOrderId(String orderId);

    @Query("select o.orderId from ProductOrder o where o.orderId in :orderIds")
    List<String> findExistingOrderIds(@Param("orderIds") Collection<String> orderIds);
}
