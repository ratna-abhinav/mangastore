package com.example.shoppingdotcom.service.impl;

import com.example.shoppingdotcom.config.SignupProperties;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.repository.UserRepository;
import com.example.shoppingdotcom.service.NeonStorageService;
import com.example.shoppingdotcom.service.UserService;
import com.example.shoppingdotcom.util.AppConstants;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NeonStorageService neonStorageService;

    @Autowired
    private SignupProperties signupProperties;

    @Override
    public Users saveUser(Users user) {
        user.setRole("ROLE_USER");
        user.setIsEnable(0);
        user.setAccountNonLocked(1);
        user.setFailedAttempt(0);
        String encodePassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodePassword);
        if (signupProperties.isEmailVerification()) {
            generateVerificationToken(user);
        }
        return userRepository.save(user);
    }

    @Override
    public Users verifyEmail(String token) {
        Users user = userRepository.findByVerificationToken(token);
        if (user == null) {
            return null;
        }
        Date expiry = user.getVerificationTokenExpiry();
        if (expiry == null || expiry.getTime() < System.currentTimeMillis()) {
            return null;
        }
        user.setIsEnable(1);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        return userRepository.save(user);
    }

    @Override
    public Users issueVerificationToken(String email) {
        Users user = userRepository.findByEmail(email);
        if (user == null || user.getIsEnable() == 1) {
            return null;
        }
        generateVerificationToken(user);
        return userRepository.save(user);
    }

    @Override
    public Users createOrGetOAuthUser(String email, String name, String picture) {
        Users user = userRepository.findByEmail(email);
        if (user != null) {
            return user;
        }
        Users fresh = new Users();
        fresh.setName(name);
        fresh.setEmail(email);
        fresh.setProfileImage(picture);
        fresh.setRole("ROLE_USER");
        fresh.setIsEnable(signupProperties.isEmailVerification() ? 1 : 0);
        fresh.setAccountNonLocked(1);
        fresh.setFailedAttempt(0);
        return userRepository.save(fresh);
    }

    private void generateVerificationToken(Users user) {
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationTokenExpiry(
                new Date(System.currentTimeMillis() + signupProperties.getVerificationTokenTtlMillis()));
    }

    @Override
    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public List<Users> getUsers(String role) {
        return userRepository.findByRole(role);
    }

    @Override
    public Boolean updateAccountStatus(Integer id, Boolean status) {

        Optional<Users> findByUser = userRepository.findById(id);
        if (findByUser.isPresent()) {
            Users user = findByUser.get();
            if (status) user.setIsEnable(1);
            else user.setIsEnable(0);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Override
    public void increaseFailedAttempt(Users user) {
        int attempt = user.getFailedAttempt() + 1;
        user.setFailedAttempt(attempt);
        userRepository.save(user);
    }

    @Override
    public void userAccountLock(Users user) {
        user.setAccountNonLocked(0);
        user.setLockTime(new Date());
        userRepository.save(user);
    }

    @Override
    public boolean unlockAccountTimeExpired(Users user) {

        long lockTime = user.getLockTime().getTime();
        long unLockTime = lockTime + AppConstants.UNLOCK_DURATION_TIME;
        long currentTime = System.currentTimeMillis();

        if (unLockTime < currentTime) {
            user.setAccountNonLocked(1);
            user.setFailedAttempt(0);
            user.setLockTime(null);
            userRepository.save(user);
            return true;
        }
        return false;
    }

    @Override
    public void resetAttempt(int userId) {

    }

    @Override
    public void updateUserResetToken(String email, String resetToken) {
        Users user = userRepository.findByEmail(email);
        user.setResetToken(resetToken);
        userRepository.save(user);
    }

    @Override
    public Users getUserByToken(String token) {
        return userRepository.findByResetToken(token);
    }

    @Override
    public Users updateUser(Users user) {
        return userRepository.save(user);
    }

    @Override
    public Users updateUserProfile(Users user, MultipartFile img) {

        Users curUser = userRepository.findById(user.getId()).get();
        if (!img.isEmpty()) {
            curUser.setProfileImage(AppConstants.DEFAULT_IMAGE_URL);
        }
        if (!ObjectUtils.isEmpty(curUser)) {
            curUser.setName(user.getName());
            curUser.setMobileNumber(user.getMobileNumber());
            curUser.setAddress(user.getAddress());
            curUser.setCity(user.getCity());
            curUser.setState(user.getState());
            curUser.setPincode(user.getPincode());
            curUser = userRepository.save(curUser);
        }

        if (!img.isEmpty()) {
            try {
                String imageUploadUrl = neonStorageService.uploadFile("profiles", img);
                curUser.setProfileImage(imageUploadUrl);
                userRepository.save(curUser);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return curUser;
    }

    @Override
    public Users saveAdmin(Users user) {
        user.setRole("ROLE_ADMIN");
        user.setIsEnable(1);
        user.setAccountNonLocked(1);
        user.setFailedAttempt(0);

        String encodePassword = passwordEncoder.encode(user.getPassword());
        user.setPassword(encodePassword);
        return userRepository.save(user);
    }

    @Override
    public Boolean existsEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
