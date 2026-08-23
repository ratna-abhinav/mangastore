package com.example.shoppingdotcom.dto;

import com.example.shoppingdotcom.model.Category;

public record CategoryDto(Integer id, String name, String imageName, Integer isActive) {

    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getName(), c.getImageName(), c.getIsActive());
    }
}
