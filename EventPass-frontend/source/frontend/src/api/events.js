import api from './client';

/**
 * Event catalogue (integration plan §3.2 and §3.6).
 *
 * An `EventResponse` is:
 *   { id, title, description, type, category, venueName, city, posterUrl, startTime, status }
 *
 * `type` is TICKETED | INVENTORY and `category` is MOVIE | COMEDY | AMUSEMENT | EVENT
 * (or null). The public feed only ever returns TICKETED events.
 */

// ---------- public ----------

export const listPublicEvents = () => api.get('/api/events');

export const getEvent = (id) => api.get(`/api/events/${id}`);

// ---------- admin ----------

/** Includes INVENTORY-type events, which never appear in the public feed. */
export const listAllEvents = () => api.get('/api/admin/events');

/**
 * `type` is required by the backend validator. `availableQty`-style server-managed
 * fields do not exist here, so the payload is exactly what the form collects.
 */
export const createEvent = (payload) => api.post('/api/admin/events', payload);

export const updateEvent = (id, payload) => api.put(`/api/admin/events/${id}`, payload);

export const deleteEvent = (id) => api.delete(`/api/admin/events/${id}`);
