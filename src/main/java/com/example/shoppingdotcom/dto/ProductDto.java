package com.example.shoppingdotcom.dto;

import com.example.shoppingdotcom.model.Product;

public record ProductDto(
        Integer id,
        String title,
        String description,
        String category,
        Double price,
        int stock,
        String image,
        int discount,
        Double discountedPrice) {

    public static ProductDto from(Product p) {
        return new ProductDto(p.getId(), p.getTitle(), p.getDescription(), p.getCategory(),
                p.getPrice(), p.getStock(), p.getImage(), p.getDiscount(), p.getDiscountedPrice());
    }
}
