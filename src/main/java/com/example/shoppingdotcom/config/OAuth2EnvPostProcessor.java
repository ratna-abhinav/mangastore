package com.example.shoppingdotcom.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

public class OAuth2EnvPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String clientId = environment.getProperty("GOOGLE_CLIENT_ID");
        String clientSecret = environment.getProperty("GOOGLE_CLIENT_SECRET");

        boolean fixClientId = clientId != null && clientId.trim().isEmpty();
        boolean fixClientSecret = clientSecret != null && clientSecret.trim().isEmpty();

        if (fixClientId || fixClientSecret) {
            Map<String, Object> fallback = new HashMap<>();
            if (fixClientId) {
                fallback.put("spring.security.oauth2.client.registration.google.client-id", "dummy-client-id");
            }
            if (fixClientSecret) {
                fallback.put("spring.security.oauth2.client.registration.google.client-secret", "dummy-client-secret");
            }
            environment.getPropertySources().addFirst(new MapPropertySource("oauth2Fallback", fallback));
        }
    }
}