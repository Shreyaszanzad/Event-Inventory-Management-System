import api from './client';

/**
 * Inventory catalogue and event allocation.
 *
 * Every route lives under /api/admin/**, so all of this requires an ADMIN token —
 * there is no public inventory surface.
 */

// ---------- Catalogue ----------

/** @param {{category?: string, status?: string}} filters */
export const listInventory = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();
  return api.get(`/api/admin/inventory${query ? `?${query}` : ''}`);
};

export const getInventoryItem = (id) => api.get(`/api/admin/inventory/${id}`);

export const createInventoryItem = (payload) => api.post('/api/admin/inventory', payload);

export const updateInventoryItem = (id, payload) => api.put(`/api/admin/inventory/${id}`, payload);

export const deleteInventoryItem = (id) => api.delete(`/api/admin/inventory/${id}`);

// ---------- Allocation ----------

export const listEventInventory = (eventId) => api.get(`/api/admin/events/${eventId}/inventory`);

export const allocateInventory = (eventId, payload) =>
  api.post(`/api/admin/events/${eventId}/inventory`, payload);

export const updateAllocation = (allocationId, quantity) =>
  api.put(`/api/admin/inventory-allocations/${allocationId}`, { quantity });

/**
 * End an allocation and return its stock to the pool.
 * @param {boolean} returned true = kit came back (RETURNED), false = never went out (CANCELLED)
 */
export const releaseAllocation = (allocationId, returned = true) =>
  api.delete(`/api/admin/inventory-allocations/${allocationId}?returned=${returned}`);
