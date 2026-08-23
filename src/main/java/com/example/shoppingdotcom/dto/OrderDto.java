package com.example.shoppingdotcom.dto;

public record OrderDto(
        Integer id,
        String orderId,
        java.time.LocalDate orderDate,
        String productTitle,
        String productImage,
        Double price,
        Integer quantity,
        String status,
        String paymentType) {
}
