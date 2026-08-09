package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.auth.dto.AdminLoginDto;
import com.softpoly.eventinventory.auth.dto.AuthResponseDto;
import com.softpoly.eventinventory.auth.dto.OtpRequestDto;
import com.softpoly.eventinventory.auth.dto.OtpVerifyDto;
import com.softpoly.eventinventory.common.enums.Role;
import com.softpoly.eventinventory.common.enums.UserStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.user.User;
import com.softpoly.eventinventory.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Who is allowed to obtain a token.
 *
 * <p>The headline case is privilege escalation: the phone+OTP flow used to mint a token carrying
 * whatever role the account held, so an administrator with a phone number could be signed in as
 * ADMIN by anyone holding the six-digit code — no password involved.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:eimsauthtest;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "app.otp.mock-enabled=true",
        "app.otp.resend-cooldown-seconds=0",
        "app.booking.sweeper-initial-ms=3600000"
})
class AuthServiceTest {

    private static final String IP = "127.0.0.1";

    @Autowired AuthService authService;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    /** Requests an OTP and returns the dev code, exactly as a caller would. */
    private String otpFor(String phone) {
        return authService.requestOtp(new OtpRequestDto(phone), IP).devOtp();
    }

    private User saveUser(String phone, String email, Role role, UserStatus status) {
        return userRepository.save(User.builder()
                .name("Test " + role)
                .phone(phone)
                .email(email)
                .passwordHash(passwordEncoder.encode("Secret@123"))
                .role(role)
                .status(status)
                .build());
    }

    @Test
    void otpLoginCreatesAndSignsInAnOrdinaryCustomer() {
        String phone = "9000000001";

        AuthResponseDto response = authService.verifyOtp(new OtpVerifyDto(phone, otpFor(phone)), IP);

        assertThat(response.role()).isEqualTo("USER");
        assertThat(response.token()).isNotBlank();
        assertThat(userRepository.findByPhone(phone)).isPresent();
    }

    @Test
    void otpLoginSignsInAnExistingCustomer() {
        String phone = "9000000002";
        saveUser(phone, "customer@example.com", Role.USER, UserStatus.ACTIVE);

        AuthResponseDto response = authService.verifyOtp(new OtpVerifyDto(phone, otpFor(phone)), IP);

        assertThat(response.role()).isEqualTo("USER");
    }

    /**
     * The escalation itself: an ADMIN account carrying a phone number must not be reachable
     * through the customer OTP entrance, whatever the code.
     */
    @Test
    void otpLoginRefusesAnAdministratorAccount() {
        String phone = "9000000003";
        saveUser(phone, "admin.with.phone@example.com", Role.ADMIN, UserStatus.ACTIVE);

        assertThatThrownBy(() -> authService.verifyOtp(new OtpVerifyDto(phone, otpFor(phone)), IP))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("administrator account");
    }

    /** Belt and braces: no token is minted at all, so nothing can leak an ADMIN role. */
    @Test
    void noAdminTokenIsIssuedByTheOtpFlow() {
        String phone = "9000000004";
        saveUser(phone, "admin.no.token@example.com", Role.ADMIN, UserStatus.ACTIVE);

        AuthResponseDto response = null;
        try {
            response = authService.verifyOtp(new OtpVerifyDto(phone, otpFor(phone)), IP);
        } catch (BadRequestException expected) {
            // the refusal above
        }

        assertThat(response).isNull();
    }

    @Test
    void otpLoginRefusesADeactivatedAccount() {
        String phone = "9000000005";
        saveUser(phone, "inactive@example.com", Role.USER, UserStatus.INACTIVE);

        assertThatThrownBy(() -> authService.verifyOtp(new OtpVerifyDto(phone, otpFor(phone)), IP))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void adminLoginStillWorksWithEmailAndPassword() {
        saveUser("9000000006", "working.admin@example.com", Role.ADMIN, UserStatus.ACTIVE);

        AuthResponseDto response = authService.adminLogin(
                new AdminLoginDto("working.admin@example.com", "Secret@123"), IP);

        assertThat(response.role()).isEqualTo("ADMIN");
        assertThat(response.token()).isNotBlank();
    }

    @Test
    void adminLoginRefusesADeactivatedAdmin() {
        saveUser("9000000007", "inactive.admin@example.com", Role.ADMIN, UserStatus.INACTIVE);

        assertThatThrownBy(() -> authService.adminLogin(
                new AdminLoginDto("inactive.admin@example.com", "Secret@123"), IP))
                .isInstanceOf(BadRequestException.class)
                // deliberately indistinguishable from a wrong password
                .hasMessage("Invalid email or password");
    }

    @Test
    void adminLoginRejectsAWrongPassword() {
        saveUser("9000000008", "wrong.password@example.com", Role.ADMIN, UserStatus.ACTIVE);

        assertThatThrownBy(() -> authService.adminLogin(
                new AdminLoginDto("wrong.password@example.com", "NotTheRightOne"), IP))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid email or password");
    }
}
