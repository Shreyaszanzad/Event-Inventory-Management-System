package com.softpoly.eventinventory.common.dto;

/**
 * Standard envelope for every API response so the frontend always sees the same shape:
 * { "success": true, "message": "...", "data": { ... } }
 */
public record ApiResponse<T>(boolean success, String message, T data) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> fail(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
