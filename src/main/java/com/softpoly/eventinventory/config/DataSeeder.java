package com.softpoly.eventinventory.config;

import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import com.softpoly.eventinventory.user.User;
import com.softpoly.eventinventory.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds a default admin account on first startup so the team can log in immediately. */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
                      @Value("${app.seed.admin-email}") String adminEmail,
                      @Value("${app.seed.admin-password}") String adminPassword,
                      @Value("${app.seed.admin-name}") String adminName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }
        User admin = User.builder()
                .name(adminName)
                .email(adminEmail)
                .passwordHash(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);
        log.info("Seeded default admin account: {} (change the password after first login)", adminEmail);
    }
}
