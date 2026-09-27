package com.example.shoppingdotcom.controller;

import com.example.shoppingdotcom.config.SignupProperties;
import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.NeonStorageService;
import com.example.shoppingdotcom.service.UserService;
import com.example.shoppingdotcom.util.CommonUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class ApiAuthRestController {

    @Autowired
    private UserService userService;

    @Autowired
    private NeonStorageService neonStorageService;

    @Autowired
    private CommonUtils commonUtils;

    @Autowired
    private SignupProperties signupProperties;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> register(
            @RequestParam String name,
            @RequestParam String email,
            @RequestParam String mobileNumber,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pincode,
            @RequestParam String password,
            @RequestParam(required = false) MultipartFile img,
            Principal principal,
            HttpServletRequest request) throws IOException {

        if (userService.existsEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already exists !!"));
        }

        if (principal != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You are already signed in."));
        }

        Users user = new Users();
        user.setName(name);
        user.setEmail(email);
        user.setMobileNumber(mobileNumber);
        user.setAddress(address);
        user.setCity(city);
        user.setState(state);
        user.setPincode(pincode);
        user.setPassword(password);
        user.setProfileImage(null);

        try {
            if (img != null && !img.isEmpty()) {
                user.setProfileImage(neonStorageService.uploadFile("profiles", img));
            }
            userService.saveUser(user);
        } catch (IOException e) {
            if (user.getProfileImage() != null) {
                userService.saveUser(user);
            } else {
                return ResponseEntity.internalServerError()
                        .body(Map.of("error", "User cannot be saved! Internal Server error: " + e.getMessage()));
            }
        }

        String message;
        if (signupProperties.isEmailVerification() && user.getVerificationToken() != null) {
            try {
                String url = CommonUtils.generateUrl(request) + "/verify-email?token=" + user.getVerificationToken();
                commonUtils.sendMailForEmailVerification(url, email, user.getName());
                message = "Account created !! Please verify your email to activate your account.";
            } catch (Exception e) {
                e.printStackTrace();
                message = "Account created !! Could not send the verification email. Use the resend option on the sign-in page.";
            }
        } else {
            message = "Account created !! Your account is pending admin approval. Please sign in after being approved.";
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "message", message));
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> config() {
        return ResponseEntity.ok(Map.of(
                "activationMode", signupProperties.getActivationMode(),
                "emailVerification", signupProperties.isEmailVerification(),
                "adminApproval", signupProperties.isAdminApproval(),
                "googleEnabled", signupProperties.isGoogleEnabled()));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing verification token !!"));
        }
        Users verified = userService.verifyEmail(token);
        if (verified == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification link is invalid or expired !!"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Email verified !! You can now sign in."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody Map<String, String> body,
                                                                  HttpServletRequest request) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required !!"));
        }
        Users user = userService.issueVerificationToken(email.trim());
        if (user != null && signupProperties.isEmailVerification()) {
            try {
                String url = CommonUtils.generateUrl(request) + "/verify-email?token=" + user.getVerificationToken();
                commonUtils.sendMailForEmailVerification(url, user.getEmail(), user.getName());
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return ResponseEntity.ok(Map.of("message", "If an account exists for this email, a verification email has been sent !!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> body,
                                                              HttpServletRequest request)
            throws java.io.UnsupportedEncodingException, jakarta.mail.MessagingException {
        String email = body.get("email");
        Users userByEmail = userService.getUserByEmail(email);
        if (ObjectUtils.isEmpty(userByEmail)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid email !!"));
        }
        if (userByEmail.getIsEnable() == 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Account is not active. Please verify or contact support !!"));
        }
        if (userByEmail.getPassword() == null || userByEmail.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "This account uses Google sign-in and has no password !!"));
        }

        String resetToken = java.util.UUID.randomUUID().toString();
        userService.updateUserResetToken(email, resetToken);

        String url = CommonUtils.generateUrl(request) + "/reset-password?token=" + resetToken;
        boolean sent = commonUtils.sendMail(url, email);
        if (!sent) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Email not sent ! Internal Server error"));
        }
        return ResponseEntity.ok(Map.of("message", "Please check your email. Password reset link has been sent !!"));
    }

    @GetMapping("/reset-token/{token}")
    public ResponseEntity<Map<String, Object>> checkResetToken(@PathVariable String token) {
        Users userByToken = userService.getUserByToken(token);
        return ResponseEntity.ok(Map.of("valid", !ObjectUtils.isEmpty(userByToken)));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");

        Users userByToken = userService.getUserByToken(token);
        if (ObjectUtils.isEmpty(userByToken)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Your link is invalid or expired !!"));
        }

        userByToken.setPassword(passwordEncoder.encode(newPassword));
        userByToken.setResetToken(null);
        userService.updateUser(userByToken);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully !!"));
    }
}
