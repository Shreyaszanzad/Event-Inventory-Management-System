import api from './client';

/**
 * Bookings (integration plan §3.3). Every call needs a user JWT.
 *
 * BookingResponse:
 *   { id, bookingReference, showId, totalAmount, paymentStatus, status,
 *     bookingDate, expiresAt, items: [{ ticketTypeId, quantity, unitPrice }] }
 *
 * ⚠️ `create` does NOT complete a booking. It places a 10-minute hold: status
 * PENDING, seats already decremented, `expiresAt` set. The user must then call
 * `confirm`, or a background sweeper flips it to EXPIRED and releases the seats.
 * Never navigate to a success screen off the back of `create` alone.
 */

/** `items` is `[{ ticketTypeId, quantity }]`. Returns a PENDING hold. */
export const createBooking = (showId, items) => api.post('/api/bookings', { showId, items });

/** The step that actually secures the seats. */
export const confirmBooking = (id) => api.post(`/api/bookings/${id}/confirm`);

/** Releases the held seats back to the pool. */
export const cancelBooking = (id) => api.post(`/api/bookings/${id}/cancel`);

export const listMyBookings = () => api.get('/api/bookings/me');

export const getBooking = (id) => api.get(`/api/bookings/${id}`);

/** Look up by the human-facing code, e.g. `EVB-2QPG445X`. */
export const getBookingByReference = (reference) => api.get(`/api/bookings/reference/${reference}`);
