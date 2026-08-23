package com.example.shoppingdotcom.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;

@Controller
public class SpaForwardController {

    private static final String SEG = "[^\\.]*";

    @GetMapping({
            "/{p:" + SEG + "}",
            "/{a:" + SEG + "}/{b:" + SEG + "}",
            "/{a:" + SEG + "}/{b:" + SEG + "}/{c:" + SEG + "}"
    })
    public String forwardToSpa(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (request.getRequestURI().startsWith("/api/")) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Not found\"}");
            return null;
        }
        return "forward:/index.html";
    }
}
