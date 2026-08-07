import api from './client';

/**
 * Auth endpoints (integration plan §3.1). All three are public.
 *
 * `requestOtp` resolves to `{ message, devOtp }` — `devOtp` is only populated
 * while the backend runs with `app.otp.mock-enabled=true` and disappears once
 * SZ-6 lands, so treat it as an optional convenience, never a requirement.
 *
 * `verifyOtp` / `adminLogin` resolve to `{ token, userId, name, role }` where
 * `role` is the bare enum name — `USER` or `ADMIN`, no `ROLE_` prefix.
 */

/** Phone must be exactly 10 digits — the backend validator rejects anything else. */
export const requestOtp = (phone) => api.post('/api/auth/otp/request', { phone });

/** OTP must be exactly 6 digits. */
export const verifyOtp = (phone, otp) => api.post('/api/auth/otp/verify', { phone, otp });

export const adminLogin = (email, password) =>
  api.post('/api/auth/admin/login', { email, password });
