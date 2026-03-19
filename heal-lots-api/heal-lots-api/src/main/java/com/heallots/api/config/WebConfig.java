package com.heallots.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded profile pictures at http://localhost:8080/uploads/...
        // Use the same directory as in UserController
        String uploadDir = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().toString();
        // Convert to proper file URI format (Windows: file:///C:/path, Unix: file:///path)
        String uploadUri = "file:///" + uploadDir.replace("\\", "/");
        
        System.out.println("Registered resource handler for /uploads/** -> " + uploadUri);
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadUri)
                .setCachePeriod(3600);
    }
}