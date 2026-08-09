package com.softpoly.eventinventory.user;

import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.user.dto.UpdateProfileRequest;
import com.softpoly.eventinventory.user.dto.UserResponse;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        return UserResponse.from(findOrThrow(userId));
    }

    /**
     * Lets an account set its own display name and email.
     *
     * <p>Phone is not editable here: it is the credential the OTP flow authenticates against, so
     * changing it would move the account to a number nobody has proven they control. Role and
     * status are likewise off-limits — that is exactly the escalation the OTP fix closed.
     */
    @Transactional
    public UserResponse updateMe(Long userId, UpdateProfileRequest dto) {
        User user = findOrThrow(userId);

        if (dto.name() != null) {
            user.setName(dto.name().isBlank() ? null : dto.name().trim());
        }

        if (dto.email() != null) {
            String email = dto.email().isBlank() ? null : dto.email().trim().toLowerCase();
            if (email != null) {
                userRepository.findByEmail(email)
                        .filter(existing -> !existing.getId().equals(userId))
                        .ifPresent(existing -> {
                            throw new BadRequestException("That email is already in use.");
                        });
            }
            user.setEmail(email);
        }

        return UserResponse.from(userRepository.save(user));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
    }
}
