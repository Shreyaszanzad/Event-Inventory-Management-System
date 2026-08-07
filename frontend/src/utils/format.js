import dayjs from 'dayjs';

/**
 * Display helpers. Formatting only — the backend owns every total (§2.5).
 *
 * Dates arrive as ISO-8601 without a timezone (`2026-08-20T19:00:00`); the server
 * clock is Asia/Kolkata. dayjs parses those as local time, which is what we want.
 */

const DATE = 'DD MMM YYYY';
const TIME = 'hh:mm A';

export const parseDate = (value) => (value ? dayjs(value) : null);

export const formatDate = (value) => {
  const d = parseDate(value);
  return d?.isValid() ? d.format(DATE) : '—';
};

export const formatTime = (value) => {
  const d = parseDate(value);
  return d?.isValid() ? d.format(TIME) : '—';
};

export const formatDateTime = (value) => {
  const d = parseDate(value);
  return d?.isValid() ? d.format(`${DATE} • ${TIME}`) : '—';
};

/** What the API wants back for a LocalDateTime field. */
export const toApiDateTime = (dayjsValue) =>
  dayjsValue ? dayjsValue.format('YYYY-MM-DDTHH:mm:ss') : null;

/**
 * Money is a JSON number with 2 decimals. We render it and nothing else — no
 * client-side arithmetic on totals, discounts, or balances (§2.5).
 */
export const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '₹—';
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/** Compact variant for tight spots like table cells — drops the paise. */
export const formatMoneyShort = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '₹—';
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

/** Seconds until `expiresAt`, floored at 0. Drives the seat-hold countdown. */
export const secondsUntil = (isoValue) => {
  const target = parseDate(isoValue);
  if (!target?.isValid()) return 0;
  return Math.max(0, Math.floor((target.valueOf() - Date.now()) / 1000));
};

/** `mm:ss` for a countdown. */
export const formatCountdown = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

/** Title-cases a backend enum for display: `PARTIALLY_PAID` → `Partially paid`. */
export const humaniseEnum = (value) => {
  if (!value) return '—';
  const lower = value.toLowerCase().replace(/_/g, ' ');
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

/** Placeholder art for events with no `posterUrl` — the only invented field we keep (§6). */
export const POSTER_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#db2777"/>
      </linearGradient></defs>
      <rect width="800" height="450" fill="url(#g)"/>
      <text x="400" y="245" font-family="sans-serif" font-size="120" text-anchor="middle" fill="rgba(255,255,255,0.85)">🎟️</text>
    </svg>`,
  );

export const posterOf = (event) => event?.posterUrl || POSTER_FALLBACK;
