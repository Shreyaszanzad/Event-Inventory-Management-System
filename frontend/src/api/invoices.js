import api from './client';

/** The signed-in customer's own invoices. */
export const listMyInvoices = () => api.get('/api/invoices/me');

export const getMyInvoice = (id) => api.get(`/api/invoices/${id}`);

// ---------- Admin ----------

export const listAllInvoices = () => api.get('/api/admin/invoices');

export const getInvoice = (id) => api.get(`/api/admin/invoices/${id}`);

export const generateInvoice = (bookingId, discount) =>
  api.post('/api/admin/invoices', { bookingId, discount: discount ?? 0 });

/** Records a manual payment — cash at the counter, a card machine, a bank transfer. */
export const recordPayment = (invoiceId, amount, mode) =>
  api.post(`/api/admin/invoices/${invoiceId}/payments`, { amount, mode });
