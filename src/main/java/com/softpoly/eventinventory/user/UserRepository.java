package com.softpoly.eventinventory.user;

import com.softpoly.eventinventory.common.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailAndRole(String email, Role role);

    boolean existsByEmail(String email);
}
