package com.example.shoppingdotcom.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.signup")
public class SignupProperties {

    public static final String MODE_ADMIN = "admin";
    public static final String MODE_EMAIL = "email";

    public static final long VERIFICATION_TOKEN_TTL_MILLIS = 30 * 60 * 1000L;

    private String activationMode = MODE_ADMIN;

    private boolean googleEnabled = false;

    public String getActivationMode() {
        return activationMode;
    }

    public void setActivationMode(String activationMode) {
        this.activationMode = activationMode;
    }

    public boolean isGoogleEnabled() {
        return googleEnabled;
    }

    public void setGoogleEnabled(boolean googleEnabled) {
        this.googleEnabled = googleEnabled;
    }

    public boolean isAdminApproval() {
        return MODE_ADMIN.equalsIgnoreCase(activationMode);
    }

    public boolean isEmailVerification() {
        return MODE_EMAIL.equalsIgnoreCase(activationMode);
    }

    public long getVerificationTokenTtlMillis() {
        return VERIFICATION_TOKEN_TTL_MILLIS;
    }
}