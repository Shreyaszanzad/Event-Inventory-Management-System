package com.softpoly.eventinventory.booking;

import com.softpoly.eventinventory.booking.dto.BookingResponse;
import com.softpoly.eventinventory.booking.dto.CreateBookingRequest;
import com.softpoly.eventinventory.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Booking endpoints for the logged-in user (any authenticated user). */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ApiResponse<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request,
                                               Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName()); // JWT subject = user id
        return ApiResponse.ok("Booking confirmed", bookingService.create(userId, request));
    }

    @GetMapping("/me")
    public ApiResponse<List<BookingResponse>> myBookings(Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(bookingService.listMyBookings(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookingResponse> getOne(@PathVariable Long id, Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(bookingService.getMyBooking(userId, id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<BookingResponse> cancel(@PathVariable Long id, Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok("Booking cancelled", bookingService.cancel(userId, id));
    }
}
