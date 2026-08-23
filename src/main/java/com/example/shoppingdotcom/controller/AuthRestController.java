package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.CartService;
import com.example.shoppingdotcom.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthRestController {

    @Autowired
    private UserService userService;

    @Autowired
    private CartService cartService;

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Principal principal) {
        if (principal == null) {
            return unauthorized();
        }
        Users user = userService.getUserByEmail(principal.getName());
        if (user == null) {
            return unauthorized();
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("id", user.getId());
        body.put("name", user.getName());
        body.put("email", user.getEmail());
        body.put("role", user.getRole());
        body.put("profileImage", user.getProfileImage());
        Integer cartCount = cartService.getCountCart(user.getId());
        body.put("cartCount", cartCount == null ? 0 : cartCount);

        return ResponseEntity.ok(body);
    }

    private ResponseEntity<Map<String, Object>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("error", "Unauthorized"));
    }
}
