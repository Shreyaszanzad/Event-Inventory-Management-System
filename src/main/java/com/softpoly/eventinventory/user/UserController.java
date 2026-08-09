package com.softpoly.eventinventory.user;

import com.softpoly.eventinventory.common.dto.ApiResponse;
import com.softpoly.eventinventory.user.dto.UpdateProfileRequest;
import com.softpoly.eventinventory.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The signed-in account's own profile.
 *
 * <p>Both routes read the id from the JWT rather than the path, so an account can only ever reach
 * itself — there is no {@code /api/users/{id}} to walk. Neither path is public nor under
 * {@code /api/admin/**}, so SecurityConfig's {@code anyRequest().authenticated()} covers them.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(Authentication authentication) {
        return ApiResponse.ok(userService.getMe(currentUserId(authentication)));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMe(@Valid @RequestBody UpdateProfileRequest dto,
                                              Authentication authentication) {
        return ApiResponse.ok("Profile updated", userService.updateMe(currentUserId(authentication), dto));
    }

    /** JwtAuthFilter puts the user id in the principal name. */
    private Long currentUserId(Authentication authentication) {
        return Long.valueOf(authentication.getName());
    }
}
