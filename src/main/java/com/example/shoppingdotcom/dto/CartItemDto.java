package com.example.shoppingdotcom.dto;

public record CartItemDto(
        Integer id,
        Integer productId,
        String title,
        String image,
        Double price,
        Double discountedPrice,
        int quantity,
        int stock,
        Double totalPrice) {
}
