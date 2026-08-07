import axios from 'axios';

/**
 * The single place the frontend talks to Spring Boot.
 *
 * Two things happen here so that no component ever has to think about them:
 *
 *  1. Every request carries `Authorization: Bearer <token>` when we have one.
 *  2. Every response is unwrapped from the backend's envelope
 *     `{ success, message, data }` — callers receive `data` directly, and
 *     failures arrive as a rejected `ApiError` carrying the server's message.
 *
 * See §2.2 / §2.3 of the integration plan.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const AUTH_STORAGE_KEY = 'eventpass_auth';

/** Reads the persisted `{ token, userId, name, role }`, or null. */
export const readStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeStoredAuth = (auth) => {
  if (auth) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * AuthContext registers a callback here so the interceptor can log the user out
 * from outside the React tree when the server rejects our token.
 */
let onSessionExpired = null;
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

/** Error shape every caller can rely on. `message` is safe to show to a user. */
export class ApiError extends Error {
  constructor(message, { status = null, isNetwork = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetwork = isNetwork;
  }

  /** OTP / login spam guard tripped — the caller should back off, not retry. */
  get isRateLimited() {
    return this.status === 429;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Logged in, but this account may not touch the resource. */
  get isForbidden() {
    return this.status === 403;
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const auth = readStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

const FALLBACK_MESSAGES = {
  400: 'That request was rejected. Please check the details and try again.',
  403: 'You are not allowed to do that.',
  404: 'We could not find what you were looking for.',
  429: 'Too many attempts. Please wait a moment before trying again.',
  500: 'Something went wrong on the server. Please try again.',
};

/** Envelope in → `data` out. Non-enveloped bodies pass through untouched. */
const unwrap = (body) =>
  body && typeof body === 'object' && 'success' in body && 'data' in body ? body.data : body;

api.interceptors.response.use(
  (response) => unwrap(response.data),
  (error) => {
    // No response at all: backend down, wrong port, CORS, or timeout.
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          `Cannot reach the server at ${API_BASE_URL}. Is the backend running?`,
          { isNetwork: true },
        ),
      );
    }

    const { status, data } = error.response;
    const serverMessage = typeof data === 'object' && data?.message ? data.message : null;
    const message = serverMessage || FALLBACK_MESSAGES[status] || 'Request failed.';

    const hadToken = Boolean(readStoredAuth()?.token);
    const isAdminCall = (error.config?.url || '').includes('/api/admin/');

    // `JwtAuthFilter` swallows bad tokens and leaves the request anonymous, so an
    // expired session surfaces as Spring Security's default 403 rather than a 401.
    // Both mean the same thing to us: the token we hold is no longer usable.
    // (Backend task SZ-5 tracks making this a clean, JSON 401.)
    const sessionIsDead = status === 401 || (status === 403 && hadToken && !isAdminCall);

    if (sessionIsDead || (status === 403 && !hadToken)) {
      onSessionExpired?.();
      return Promise.reject(
        new ApiError(
          hadToken ? 'Your session has expired. Please sign in again.' : 'Please sign in to continue.',
          { status: 401 },
        ),
      );
    }

    return Promise.reject(new ApiError(message, { status }));
  },
);

export default api;
