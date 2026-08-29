package com.example.shoppingdotcom.config;

import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.List;

public class CustomOAuth2UserService extends OidcUserService {

    private static final String NAME_ATTRIBUTE = "email";

    @Autowired
    private UserService userService;

    @Autowired
    private SignupProperties signupProperties;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        Object emailVerified = oidcUser.getUserInfo().getClaim("email_verified");
        String email = oidcUser.getUserInfo().getEmail();
        if (email == null || email.isBlank() || !Boolean.TRUE.equals(emailVerified)) {
            throw new OAuth2AuthenticationException("Google did not provide a verified email address.");
        }

        String name = oidcUser.getUserInfo().getFullName();
        if (name == null || name.isBlank()) {
            name = oidcUser.getUserInfo().getClaim("given_name");
        }
        if (name == null || name.isBlank()) {
            name = email;
        }
        String picture = oidcUser.getUserInfo().getPicture();

        Users user = userService.createOrGetOAuthUser(email, name, picture);

        if (user.getIsEnable() == 0) {
            throw new DisabledException("Your account is inactive. Please wait for admin approval.");
        }

        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(user.getRole()));
        return new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), NAME_ATTRIBUTE);
    }
}