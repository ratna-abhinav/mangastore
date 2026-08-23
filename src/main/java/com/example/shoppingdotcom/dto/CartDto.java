package com.example.shoppingdotcom.dto;

import java.util.List;

public record CartDto(List<CartItemDto> items, Double totalOrderPrice) {
}
