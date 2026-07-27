package com.softpoly.eventinventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// We authenticate via JWT and our own AuthService, so we exclude Spring Boot's default
// in-memory user (which otherwise logs "Using generated security password ..." on startup).
@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class EventInventoryApplication {

    public static void main(String[] args) {
        SpringApplication.run(EventInventoryApplication.class, args);
    }
}
