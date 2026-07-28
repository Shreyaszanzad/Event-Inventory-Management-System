package com.softpoly.eventinventory.billing;

import com.softpoly.eventinventory.billing.dto.GenerateInvoiceRequest;
import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.billing.dto.RecordPaymentRequest;
import com.softpoly.eventinventory.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin billing under /api/admin/invoices (ROLE_ADMIN); a user reads their own under /api/invoices.
 */
@RestController
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    // ---------- Admin ----------

    @PostMapping("/api/admin/invoices")
    public ApiResponse<InvoiceResponse> generate(@Valid @RequestBody GenerateInvoiceRequest request) {
        return ApiResponse.ok("Invoice generated", invoiceService.generate(request));
    }

    @GetMapping("/api/admin/invoices")
    public ApiResponse<List<InvoiceResponse>> listAll() {
        return ApiResponse.ok(invoiceService.listAll());
    }

    @GetMapping("/api/admin/invoices/{id}")
    public ApiResponse<InvoiceResponse> getOne(@PathVariable Long id) {
        return ApiResponse.ok(invoiceService.getById(id));
    }

    @PostMapping("/api/admin/invoices/{id}/payments")
    public ApiResponse<InvoiceResponse> recordPayment(@PathVariable Long id,
                                                      @Valid @RequestBody RecordPaymentRequest request) {
        return ApiResponse.ok("Payment recorded", invoiceService.recordPayment(id, request));
    }

    // ---------- User (own invoices) ----------

    @GetMapping("/api/invoices/me")
    public ApiResponse<List<InvoiceResponse>> myInvoices(Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(invoiceService.listMine(userId));
    }

    @GetMapping("/api/invoices/{id}")
    public ApiResponse<InvoiceResponse> myInvoice(@PathVariable Long id, Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        return ApiResponse.ok(invoiceService.getMine(userId, id));
    }
}
