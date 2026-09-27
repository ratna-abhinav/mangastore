package com.example.shoppingdotcom.service;

import com.example.shoppingdotcom.model.Users;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    public Users saveUser(Users users);

    public Users getUserByEmail(String email);

    public List<Users> getUsers(String role);

    public Boolean updateAccountStatus(Integer id, Boolean status);

    public void increaseFailedAttempt(Users user);

    public void userAccountLock(Users user);

    public boolean unlockAccountTimeExpired(Users user);

    public void resetAttempt(int userId);

    public void updateUserResetToken(String email, String resetToken);

    public Users getUserByToken(String token);

    public Users updateUser(Users user);

    Users updateUserProfile(Users user, MultipartFile img);

    Users saveAdmin(Users user);

    Boolean existsEmail(String email);

    Users verifyEmail(String token);

    Users issueVerificationToken(String email);

    Users createOrGetOAuthUser(String email, String name, String picture);
}
