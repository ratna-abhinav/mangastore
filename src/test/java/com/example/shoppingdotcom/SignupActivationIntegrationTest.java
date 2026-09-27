package com.example.shoppingdotcom;

import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.repository.UserRepository;
import com.example.shoppingdotcom.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class SignupActivationIntegrationTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DaoAuthenticationProvider authenticationProvider;

    @Autowired
    private com.example.shoppingdotcom.config.SignupProperties signupProperties;

    private String uniqueEmail(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 100000) + "@test.local";
    }

    private Users newFormUser(String email, String rawPassword) {
        Users u = new Users();
        u.setName("Test User");
        u.setEmail(email.toLowerCase());
        u.setMobileNumber("0000000000");
        u.setPassword(rawPassword);
        return u;
    }

    @Test
    void formSignupStartsInactive_untilAdminEnables() {
        String raw = "secretP@ss1";
        String email = uniqueEmail("signup");
        Users saved = userService.saveUser(newFormUser(email, raw));

        assertThat(saved.getIsEnable()).isZero();
        assertThat(saved.getRole()).isEqualTo("ROLE_USER");

        assertThatThrownBy(() -> authenticationProvider
                .authenticate(new UsernamePasswordAuthenticationToken(email, raw)))
                .isInstanceOf(DisabledException.class);

        userService.updateAccountStatus(saved.getId(), true);
        assertThat(userRepository.findById(saved.getId()).orElseThrow().getIsEnable()).isEqualTo(1);

        Authentication auth = authenticationProvider
                .authenticate(new UsernamePasswordAuthenticationToken(email, raw));
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getAuthorities()).extracting("authority").contains("ROLE_USER");
    }

    @Test
    void verifyEmailActivates_andExpiredTokenIsRejected() {
        String email = uniqueEmail("verify");
        Users saved = userService.saveUser(newFormUser(email, "password123"));
        assertThat(saved.getIsEnable()).isZero();

        saved.setVerificationToken(UUID.randomUUID().toString());
        saved.setVerificationTokenExpiry(new Date(System.currentTimeMillis() + 30 * 60 * 1000));
        userRepository.save(saved);

        Users activated = userService.verifyEmail(saved.getVerificationToken());
        assertThat(activated.getIsEnable()).isEqualTo(1);
        assertThat(activated.getVerificationToken()).isNull();

        Users second = userService.saveUser(newFormUser(uniqueEmail("verify"), "password123"));
        second.setVerificationToken(UUID.randomUUID().toString());
        second.setVerificationTokenExpiry(new Date(System.currentTimeMillis() - 1000));
        userRepository.save(second);

        assertThat(userService.verifyEmail(second.getVerificationToken())).isNull();
        assertThat(userRepository.findById(second.getId()).orElseThrow().getIsEnable()).isZero();
    }

    @Test
    void oauthUserCreationRespectsActivationMode_andAutoLinksExisting() {
        String oauthEmail = uniqueEmail("oauth");
        Users created = userService.createOrGetOAuthUser(oauthEmail, "OAuth User", "http://example.com/pic.png");
        assertThat(created.getIsEnable()).isZero();
        assertThat(created.getRole()).isEqualTo("ROLE_USER");
        assertThat(created.getPassword()).isNull();

        String formEmail = uniqueEmail("oauth");
        Users form = userService.saveUser(newFormUser(formEmail, "password123"));
        Users linked = userService.createOrGetOAuthUser(formEmail, "Anything", "http://example.com/pic.png");
        assertThat(linked.getId()).isEqualTo(form.getId());
        assertThat(linked.getPassword()).isNotBlank();
    }

    @Test
    void passwordEncodingIsBcryptAndNotDoubleHashed() {
        String email = uniqueEmail("pw");
        Users saved = userService.saveUser(newFormUser(email, "password123"));
        assertThat(saved.getPassword()).doesNotStartWith("password123");
        assertThat(passwordEncoder.matches("password123", saved.getPassword())).isTrue();
    }
}
