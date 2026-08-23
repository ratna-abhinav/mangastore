package com.example.shoppingdotcom.dto;

import com.example.shoppingdotcom.model.Users;

public record UserAdminDto(
        Integer id,
        String name,
        String email,
        String mobileNumber,
        Integer isEnable,
        String role,
        String profileImage) {

    public static UserAdminDto from(Users u) {
        return new UserAdminDto(u.getId(), u.getName(), u.getEmail(), u.getMobileNumber(),
                u.getIsEnable(), u.getRole(), u.getProfileImage());
    }
}
