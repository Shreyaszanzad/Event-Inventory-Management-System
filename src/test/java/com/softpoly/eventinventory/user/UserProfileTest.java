package com.softpoly.eventinventory.user;

import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import com.softpoly.eventinventory.user.dto.UpdateProfileRequest;
import com.softpoly.eventinventory.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimsprofiletest;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "app.booking.sweeper-initial-ms=3600000"
})
class UserProfileTest {

    @Autowired UserService userService;
    @Autowired UserRepository userRepository;

    private User save(String phone, String email, String name) {
        return userRepository.save(User.builder()
                .name(name).phone(phone).email(email)
                .role(Role.USER).status(UserStatus.ACTIVE).build());
    }

    @Test
    void returnsTheFieldsTheLoginResponseCouldNotCarry() {
        User user = save("9100000001", "profile@example.com", "Profile User");

        UserResponse me = userService.getMe(user.getId());

        assertThat(me.phone()).isEqualTo("9100000001");
        assertThat(me.email()).isEqualTo("profile@example.com");
        assertThat(me.name()).isEqualTo("Profile User");
        assertThat(me.role()).isEqualTo("USER");
        assertThat(me.status()).isEqualTo("ACTIVE");
        assertThat(me.createdAt()).isNotNull();   // "member since"
    }

    @Test
    void unknownUserIsNotFound() {
        assertThatThrownBy(() -> userService.getMe(999_999L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void canUpdateNameAndEmail() {
        User user = save("9100000002", null, null);

        UserResponse updated = userService.updateMe(user.getId(),
                new UpdateProfileRequest("  New Name  ", "New.Email@Example.com"));

        assertThat(updated.name()).isEqualTo("New Name");          // trimmed
        assertThat(updated.email()).isEqualTo("new.email@example.com"); // normalised
    }

    @Test
    void omittedFieldsAreLeftAlone() {
        User user = save("9100000003", "keep@example.com", "Keep Me");

        UserResponse updated = userService.updateMe(user.getId(), new UpdateProfileRequest(null, null));

        assertThat(updated.name()).isEqualTo("Keep Me");
        assertThat(updated.email()).isEqualTo("keep@example.com");
    }

    @Test
    void cannotTakeAnEmailAnotherAccountAlreadyUses() {
        save("9100000004", "taken@example.com", "First");
        User second = save("9100000005", null, "Second");

        assertThatThrownBy(() -> userService.updateMe(second.getId(),
                new UpdateProfileRequest(null, "taken@example.com")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already in use");
    }

    /** Keeping your own email is not a clash with yourself. */
    @Test
    void canReSubmitYourOwnEmail() {
        User user = save("9100000006", "mine@example.com", "Mine");

        UserResponse updated = userService.updateMe(user.getId(),
                new UpdateProfileRequest("Mine", "mine@example.com"));

        assertThat(updated.email()).isEqualTo("mine@example.com");
    }

    /** The phone is the OTP credential, so the profile payload cannot carry it at all. */
    @Test
    void phoneIsNotChangeableThroughTheProfile() {
        User user = save("9100000007", null, "Fixed Phone");

        userService.updateMe(user.getId(), new UpdateProfileRequest("Renamed", null));

        assertThat(userRepository.findById(user.getId()).orElseThrow().getPhone())
                .isEqualTo("9100000007");
    }
}
