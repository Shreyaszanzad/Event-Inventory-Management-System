import api from './client';

/**
 * Shows and their ticket tiers (integration plan §3.2 and §3.6).
 *
 *   ShowResponse       { id, eventId, showDatetime, status }
 *   TicketTypeResponse { id, showId, name, price, totalQty, availableQty }
 *
 * `showDatetime` is ISO-8601 without a timezone (server clock is Asia/Kolkata).
 */

// ---------- public ----------

export const listShowsForEvent = (eventId) => api.get(`/api/events/${eventId}/shows`);

export const getShow = (showId) => api.get(`/api/shows/${showId}`);

export const listTicketTypes = (showId) => api.get(`/api/shows/${showId}/ticket-types`);

// ---------- admin: shows ----------

/** `showDatetime` must be an ISO string, e.g. `2026-08-20T19:00:00`. */
export const createShow = (eventId, payload) =>
  api.post(`/api/admin/events/${eventId}/shows`, payload);

export const updateShow = (showId, payload) => api.put(`/api/admin/shows/${showId}`, payload);

export const deleteShow = (showId) => api.delete(`/api/admin/shows/${showId}`);

// ---------- admin: ticket types ----------

/**
 * Takes `{ name, price, totalQty }` only. `availableQty` is server-managed —
 * sending it is meaningless and the DTO would ignore it anyway.
 */
export const createTicketType = (showId, payload) =>
  api.post(`/api/admin/shows/${showId}/ticket-types`, payload);

export const updateTicketType = (id, payload) => api.put(`/api/admin/ticket-types/${id}`, payload);

export const deleteTicketType = (id) => api.delete(`/api/admin/ticket-types/${id}`);
