package com.softpoly.eventinventory.auth;

import com.softpoly.eventinventory.auth.dto.AdminLoginDto;
import com.softpoly.eventinventory.auth.dto.OtpRequestDto;
import com.softpoly.eventinventory.auth.dto.OtpVerifyDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Credentials get pasted, and a paste drags its formatting along: a trailing space on an email,
 * a {@code +91} or dashes on a phone number. Validation then rejects the value and blames the
 * address rather than the whitespace, so the DTOs normalise before validation runs.
 *
 * <p>Plain unit tests — record constructors need no Spring context.
 */
class LoginInputNormalisationTest {

    @Test
    void adminEmailIsTrimmed() {
        assertThat(new AdminLoginDto("  admin@eims.com  ", "Admin@123").email())
                .isEqualTo("admin@eims.com");
    }

    @Test
    void adminEmailCaseIsLeftAlone() {
        // Deliberate: case-folding would change which stored account a login matches.
        assertThat(new AdminLoginDto("Admin@Eims.com", "x").email()).isEqualTo("Admin@Eims.com");
    }

    @Test
    void adminPasswordIsNotTrimmed() {
        assertThat(new AdminLoginDto("a@b.com", "  spaced  ").password()).isEqualTo("  spaced  ");
    }

    @Test
    void phoneKeepsOnlyDigits() {
        assertThat(new OtpRequestDto(" 98765 43211 ").phone()).isEqualTo("9876543211");
        assertThat(new OtpRequestDto("98765-43211").phone()).isEqualTo("9876543211");
    }

    @Test
    void phoneDropsACountryCode() {
        assertThat(new OtpRequestDto("+91 9876543211").phone()).isEqualTo("9876543211");
        assertThat(new OtpRequestDto("0091-9876543211").phone()).isEqualTo("9876543211");
    }

    @Test
    void tooShortAPhoneIsLeftForTheValidatorToReject() {
        // Normalisation must not invent digits — "12345" stays invalid.
        assertThat(new OtpRequestDto("12345").phone()).isEqualTo("12345");
    }

    @Test
    void verifyDtoNormalisesPhoneAndTrimsOtp() {
        OtpVerifyDto dto = new OtpVerifyDto("+91 98765 43211", " 123456 ");
        assertThat(dto.phone()).isEqualTo("9876543211");
        assertThat(dto.otp()).isEqualTo("123456");
    }

    @Test
    void nullsSurviveForTheNotBlankRuleToReport() {
        assertThat(new OtpRequestDto(null).phone()).isNull();
        assertThat(new AdminLoginDto(null, null).email()).isNull();
    }
}
