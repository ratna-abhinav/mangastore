package com.example.shoppingdotcom.service.impl;

import com.example.shoppingdotcom.model.Users;
import com.example.shoppingdotcom.repository.UserRepository;
import com.example.shoppingdotcom.service.UserService;
import com.example.shoppingdotcom.util.AppConstants;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.io.IOException;

@Component
public class AuthFailureHandlerImpl extends SimpleUrlAuthenticationFailureHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException, ServletException {

        String email = request.getParameter("username");
        Users user = userRepository.findByEmail(email);

        if (ObjectUtils.isEmpty(user)) {
            exception = new LockedException("Invalid Email!");
        } else {
            if (user.getIsEnable()==1) {
                if (user.getAccountNonLocked()==1) {
                    if (user.getFailedAttempt() < AppConstants.ATTEMPT_TIME) {
                        userService.increaseFailedAttempt(user);
                    } else {
                        userService.userAccountLock(user);
                        exception = new LockedException("Your account is locked !! No of failed attempts exceeded the limit");
                    }
                } else {
                    if (userService.unlockAccountTimeExpired(user)) {
                        exception = new LockedException("Your account is unlocked !! Please try to login again");
                    } else {
                        exception = new LockedException("Your account is locked !! Please try after sometime");
                    }
                }
            } else {
                exception = new LockedException("Your account is Inactive!");
            }
        }
        String accept = request.getHeader("Accept");
        if (accept != null && accept.contains("application/json")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            String msg = exception.getMessage() == null ? "Invalid email or password" : exception.getMessage();
            response.getWriter().write("{\"error\":\"" + msg.replace("\"", "'") + "\"}");
            return;
        }

        super.setDefaultFailureUrl("/signin?error");
        super.onAuthenticationFailure(request, response, exception);
    }
}
