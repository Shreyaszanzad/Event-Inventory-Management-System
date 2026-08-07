/**
 * The frontend adopts the backend's four categories (integration plan §4 and §11).
 *
 * The database column is a native ENUM — MOVIE | COMEDY | AMUSEMENT | EVENT — and
 * changing it would mean new DDL, an ALTER TABLE, entity edits and a reseed. So we
 * keep the nicer labels and icons as a *display map* over the four real values
 * instead. Everything sent to or read from the API uses the enum name.
 */
export const CATEGORY_LABELS = {
  MOVIE: { label: 'Movies', icon: '🎬', color: '#722ed1', bg: '#f9f0ff' },
  COMEDY: { label: 'Standup Comedy', icon: '🎙️', color: '#eb2f96', bg: '#fff0f6' },
  AMUSEMENT: { label: 'Amusement & Parks', icon: '🎡', color: '#fa8c16', bg: '#fff7e6' },
  EVENT: { label: 'Live Events', icon: '🎵', color: '#13c2c2', bg: '#e6fffb' },
};

/** Category is nullable on the backend, so every lookup needs a fallback. */
export const UNCATEGORISED = { label: 'Uncategorised', icon: '🎟️', color: '#64748b', bg: '#f1f5f9' };

export const categoryMeta = (category) => CATEGORY_LABELS[category] || UNCATEGORISED;

export const categoryLabel = (category) => categoryMeta(category).label;

/** For <Select> / <Tabs> options. */
export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, meta]) => ({
  value,
  label: `${meta.icon} ${meta.label}`,
}));

/** EventType — required on create, and it decides whether the public feed shows it. */
export const EVENT_TYPE_OPTIONS = [
  { value: 'TICKETED', label: 'Ticketed — bookable by the public' },
  { value: 'INVENTORY', label: 'Inventory — admin only, hidden from the public feed' },
];

/**
 * `city` is a free-text column, not an enum, so we never hardcode a city list —
 * we derive the filter options from the events the API actually returned (§4).
 */
export const deriveCityOptions = (events = []) => {
  const cities = [...new Set(events.map((e) => e.city).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  return cities.map((city) => ({ value: city, label: city }));
};

/** Booking + payment status colours, keyed by the exact backend enum names. */
export const BOOKING_STATUS_COLOR = {
  PENDING: 'orange',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  EXPIRED: 'default',
};

export const PAYMENT_STATUS_COLOR = {
  PENDING: 'orange',
  PAID: 'green',
  REFUNDED: 'blue',
};
