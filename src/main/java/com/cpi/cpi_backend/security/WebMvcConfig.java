package com.cpi.cpi_backend.security;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Forward extensionless paths to their corresponding Next.js static exported HTML files
        registry.addViewController("/login").setViewName("forward:/login.html");
        registry.addViewController("/signup").setViewName("forward:/signup.html");
        registry.addViewController("/dashboard").setViewName("forward:/dashboard.html");
        registry.addViewController("/teams").setViewName("forward:/teams.html");
        registry.addViewController("/players").setViewName("forward:/players.html");
        registry.addViewController("/practice").setViewName("forward:/practice.html");
        registry.addViewController("/matches").setViewName("forward:/matches.html");
        registry.addViewController("/reports").setViewName("forward:/reports.html");
        registry.addViewController("/organization").setViewName("forward:/organization.html");
        
        // Redirect any direct GET requests to /logout back to /login page safely
        registry.addRedirectViewController("/logout", "/login");
    }
}
