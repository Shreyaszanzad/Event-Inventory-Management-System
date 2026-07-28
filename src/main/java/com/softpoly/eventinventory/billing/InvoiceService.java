package com.softpoly.eventinventory.billing;

import com.softpoly.eventinventory.billing.dto.GenerateInvoiceRequest;
import com.softpoly.eventinventory.billing.dto.InvoiceResponse;
import com.softpoly.eventinventory.billing.dto.RecordPaymentRequest;
import com.softpoly.eventinventory.booking.Booking;
import com.softpoly.eventinventory.booking.BookingRepository;
import com.softpoly.eventinventory.common.enums.BookingStatus;
import com.softpoly.eventinventory.common.enums.InvoiceStatus;
import com.softpoly.eventinventory.common.enums.PaymentStatus;
import com.softpoly.eventinventory.common.exception.BadRequestException;
import com.softpoly.eventinventory.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

@Service
public class InvoiceService {

    private static final String INVOICE_NOT_FOUND = "Invoice not found with id ";
    private static final String REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final InvoiceRepository invoiceRepository;
    private final BookingRepository bookingRepository;

    public InvoiceService(InvoiceRepository invoiceRepository, BookingRepository bookingRepository) {
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
    }

    /** Generates a single invoice for a booking (admin). Subtotal comes from the booking total. */
    @Transactional
    public InvoiceResponse generate(GenerateInvoiceRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id " + request.bookingId()));

        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.EXPIRED) {
            throw new BadRequestException("Cannot invoice a " + booking.getStatus().name().toLowerCase() + " booking");
        }
        if (invoiceRepository.existsByBookingId(booking.getId())) {
            throw new BadRequestException("An invoice already exists for this booking");
        }

        BigDecimal subtotal = booking.getTotalAmount();
        BigDecimal discount = request.discountOrZero();
        if (discount.compareTo(subtotal) > 0) {
            throw new BadRequestException("Discount cannot exceed the subtotal");
        }
        BigDecimal total = subtotal.subtract(discount);

        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .bookingId(booking.getId())
                .userId(booking.getUserId())
                .subtotal(subtotal)
                .discount(discount)
                .totalAmount(total)
                .paidAmount(BigDecimal.ZERO)
                .balanceAmount(total)
                .status(total.signum() == 0 ? InvoiceStatus.PAID : InvoiceStatus.UNPAID)
                .build();

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    /** Records a payment against an invoice (admin). Supports partial payments; can't overpay. */
    @Transactional
    public InvoiceResponse recordPayment(Long invoiceId, RecordPaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException(INVOICE_NOT_FOUND + invoiceId));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new BadRequestException("Invoice is already fully paid");
        }
        if (request.amount().compareTo(invoice.getBalanceAmount()) > 0) {
            throw new BadRequestException("Payment " + request.amount()
                    + " exceeds the outstanding balance of " + invoice.getBalanceAmount());
        }

        Payment payment = Payment.builder().amount(request.amount()).mode(request.mode()).build();
        invoice.addPayment(payment);

        BigDecimal paid = invoice.getPaidAmount().add(request.amount());
        BigDecimal balance = invoice.getTotalAmount().subtract(paid);
        invoice.setPaidAmount(paid);
        invoice.setBalanceAmount(balance);

        if (balance.signum() == 0) {
            invoice.setStatus(InvoiceStatus.PAID);
            // keep the booking's payment flag in sync once the invoice is fully settled
            bookingRepository.findById(invoice.getBookingId()).ifPresent(b -> {
                b.setPaymentStatus(PaymentStatus.PAID);
                bookingRepository.save(b);
            });
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        return InvoiceResponse.from(invoiceRepository.save(invoice));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listAll() {
        return invoiceRepository.findAll().stream().map(InvoiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getById(Long id) {
        return InvoiceResponse.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<InvoiceResponse> listMine(Long userId) {
        return invoiceRepository.findByUserIdOrderByInvoiceDateDesc(userId).stream()
                .map(InvoiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getMine(Long userId, Long id) {
        Invoice invoice = invoiceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(INVOICE_NOT_FOUND + id));
        return InvoiceResponse.from(invoice);
    }

    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(INVOICE_NOT_FOUND + id));
    }

    private String generateInvoiceNumber() {
        String number;
        do {
            StringBuilder sb = new StringBuilder("INV-");
            for (int i = 0; i < 8; i++) sb.append(REF_ALPHABET.charAt(RANDOM.nextInt(REF_ALPHABET.length())));
            number = sb.toString();
        } while (invoiceRepository.existsByInvoiceNumber(number));
        return number;
    }
}
