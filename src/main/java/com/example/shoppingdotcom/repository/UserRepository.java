package com.example.shoppingdotcom.repository;

import com.example.shoppingdotcom.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<Users, Integer> {
    public Users findByEmail(String username);

    public List<Users> findByRole(String role);

    public Users findByResetToken(String token);

    public Users findByVerificationToken(String token);

    public Boolean existsByEmail(String email);
}
