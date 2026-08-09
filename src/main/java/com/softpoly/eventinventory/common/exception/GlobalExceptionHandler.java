package com.softpoly.eventinventory.common.exception;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.softpoly.eventinventory.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.Arrays;
import java.util.stream.Collectors;

/** Converts exceptions into the standard {@link ApiResponse} envelope. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    public ResponseEntity<ApiResponse<Void>> handleTooManyRequests(TooManyRequestsException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(ApiResponse.fail(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(ApiResponse.fail(message));
    }

    /**
     * The request body could not be parsed at all — malformed JSON, or a value that does not fit
     * the field it was aimed at (most often a misspelt enum such as {@code "mode":"BITCOIN"}).
     *
     * <p>Bean validation never runs in that case, because binding failed first, so without this
     * the request fell through to {@link #handleGeneric} and came back as a 500 — telling the
     * caller to retry something that can never succeed.
     *
     * <p>When the culprit is an enum we name the accepted values: the client cannot guess them
     * from a 400 alone, and the alternative is reading the Java source.
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail(describeBindingFailure(ex)));
    }

    /** A path variable of the wrong type, e.g. {@code /api/admin/invoices/not-a-number}. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.fail(
                "'" + ex.getValue() + "' is not a valid value for " + ex.getName() + "."));
    }

    /** Unknown URL. A 404 belongs here, not the 500 the catch-all would otherwise produce. */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNoHandler(Exception ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("No endpoint matches that URL."));
    }

    /** Turns a Jackson binding failure into something a client can act on. */
    private String describeBindingFailure(HttpMessageNotReadableException ex) {
        if (ex.getCause() instanceof InvalidFormatException invalid) {
            Class<?> target = invalid.getTargetType();
            if (target != null && target.isEnum()) {
                String accepted = Arrays.stream(target.getEnumConstants())
                        .map(Object::toString)
                        .collect(Collectors.joining(", "));
                return "'" + invalid.getValue() + "' is not a valid value. Accepted values: " + accepted + ".";
            }
            return "'" + invalid.getValue() + "' is not valid for that field.";
        }
        return "The request body is malformed or missing.";
    }

    /**
     * A database constraint refused the write — almost always a delete blocked by
     * {@code ON DELETE RESTRICT} (an event that still has shows, a show that still
     * has ticket tiers) or a duplicate on a unique column.
     *
     * That is the caller's mistake, not a server fault, so it must not fall through
     * to {@link #handleGeneric} and report a 500: retrying would never help, and the
     * admin UI has no way to explain what went wrong.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        // The driver message names internal tables and constraints, so log it but
        // send the client something it can act on.
        log.warn("Constraint violation rejected a write", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.fail(
                "This record is still referenced by other data, or would duplicate an existing one. "
                        + "Remove or update whatever depends on it first."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        // Log the real cause server-side; never leak internal details to the client.
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("Something went wrong. Please try again later."));
    }
}
