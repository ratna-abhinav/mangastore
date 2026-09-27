package com.example.shoppingdotcom;

import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.repository.UserRepository;
import com.example.shoppingdotcom.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "app.signup.activation-mode=email")
class SignupActivationEmailModeTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    private String uniqueEmail(String prefix) {
        return prefix + "_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 100000) + "@test.local";
    }

    @Test
    void formSignupIssuesExpiringVerificationToken() {
        Users u = new Users();
        u.setName("Email Mode");
        u.setEmail(uniqueEmail("emailmode"));
        u.setMobileNumber("0000000000");
        u.setPassword("password123");

        Users saved = userService.saveUser(u);
        assertThat(saved.getIsEnable()).isZero();
        assertThat(saved.getVerificationToken()).isNotBlank();
        long ttl = saved.getVerificationTokenExpiry().getTime() - System.currentTimeMillis();
        assertThat(ttl).isBetween(28L * 60_000, 30L * 60_000 + 60_000);

        Users activated = userService.verifyEmail(saved.getVerificationToken());
        assertThat(activated).isNotNull();
        assertThat(activated.getIsEnable()).isEqualTo(1);
        assertThat(activated.getVerificationToken()).isNull();
    }

    @Test
    void issueVerificationTokenRegeneratesForInactiveOnly() {
        String other = uniqueEmail("second");
        Users first = userService.saveUser(new Users(null, "A", "1", other, null, null, null, null,
                "password123", null, null, 0, 1, 0, null, null, null, null));
        String oldToken = first.getVerificationToken();
        Users reissued = userService.issueVerificationToken(other);
        assertThat(reissued.getVerificationToken()).isNotBlank();
        assertThat(reissued.getVerificationToken()).isNotEqualTo(oldToken);
    }

    @Test
    void oauthUsersAreActiveImmediatelyInEmailMode() {
        String email = uniqueEmail("emailoauth");
        Users created = userService.createOrGetOAuthUser(email, "Google User", "http://example.com/p.png");
        assertThat(created.getIsEnable()).isEqualTo(1);
        assertThat(created.getRole()).isEqualTo("ROLE_USER");
        assertThat(created.getPassword()).isNull();
        assertThat(created.getVerificationToken()).isNull();

        Users again = userService.createOrGetOAuthUser(email, "Google User", "http://example.com/p.png");
        assertThat(again.getId()).isEqualTo(created.getId());
    }

    @Test
    void expiryBoundaryIsHonoured() {
        Users u = new Users();
        u.setName("Expired");
        u.setEmail(uniqueEmail("expired"));
        u.setMobileNumber("0000000000");
        u.setPassword("password123");
        Users saved = userService.saveUser(u);
        assertThat(saved.getIsEnable()).isZero();

        saved.setVerificationTokenExpiry(new Date(System.currentTimeMillis() - 1000));
        userRepository.save(saved);

        assertThat(userService.verifyEmail(saved.getVerificationToken())).isNull();
        assertThat(userRepository.findById(saved.getId()).orElseThrow().getIsEnable()).isZero();
    }
}