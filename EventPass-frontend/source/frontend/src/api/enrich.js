import { getShow, listTicketTypes } from './shows';
import { getEvent } from './events';

/**
 * Fills in the display fields a booking needs but the API does not yet return.
 *
 * `BookingResponse` currently carries only `showId` and `ticketTypeId`, so a
 * bookings list has no event title, venue, date, or tier name to render. Until
 * backend task **SZ-1** enriches the DTO, we resolve those by walking
 * booking → show → event and booking → show → ticket-types.
 *
 * Two things keep that honest:
 *
 *  - Everything is cached per module load and every distinct show is fetched
 *    once, no matter how many bookings reference it.
 *  - If a booking already carries `eventTitle` (i.e. SZ-1 has landed), we return
 *    it untouched and make zero extra calls. **When SZ-1 ships, delete this file
 *    and the `enrichBooking(s)` calls** — the pages read the same field names
 *    either way.
 */

const showCache = new Map();
const eventCache = new Map();
const ticketTypeCache = new Map();

/** Runs `loader` once per key; concurrent callers share the same in-flight promise. */
const cached = (cache, key, loader) => {
  if (!cache.has(key)) {
    cache.set(
      key,
      Promise.resolve(loader()).catch((error) => {
        cache.delete(key); // don't cache failures — a retry should re-fetch
        throw error;
      }),
    );
  }
  return cache.get(key);
};

const loadShow = (showId) => cached(showCache, showId, () => getShow(showId));
const loadEvent = (eventId) => cached(eventCache, eventId, () => getEvent(eventId));
const loadTicketTypes = (showId) => cached(ticketTypeCache, showId, () => listTicketTypes(showId));

/** Drops every cached lookup. Call after admin edits so stale titles don't linger. */
export const clearCatalogueCache = () => {
  showCache.clear();
  eventCache.clear();
  ticketTypeCache.clear();
};

/**
 * Returns a copy of `booking` with `eventId`, `eventTitle`, `venueName`, `city`,
 * `posterUrl`, `showDatetime`, and a `ticketTypeName` on each item.
 *
 * Best-effort: if a lookup fails (deleted show, say) the booking still comes back
 * with whatever we could resolve, so one bad row never blanks the whole page.
 */
export const enrichBooking = async (booking) => {
  if (!booking) return booking;
  if (booking.eventTitle) return booking; // SZ-1 has landed — nothing to do

  const enriched = { ...booking };

  try {
    const show = await loadShow(booking.showId);
    enriched.showDatetime = show?.showDatetime ?? null;
    enriched.eventId = show?.eventId ?? null;

    if (show?.eventId) {
      const event = await loadEvent(show.eventId);
      enriched.eventTitle = event?.title ?? null;
      enriched.venueName = event?.venueName ?? null;
      enriched.city = event?.city ?? null;
      enriched.posterUrl = event?.posterUrl ?? null;
      enriched.category = event?.category ?? null;
    }
  } catch {
    // leave the catalogue fields null; the UI falls back to the booking reference
  }

  try {
    const tiers = await loadTicketTypes(booking.showId);
    const nameById = new Map((tiers || []).map((t) => [t.id, t.name]));
    enriched.items = (booking.items || []).map((item) => ({
      ...item,
      ticketTypeName: nameById.get(item.ticketTypeId) || `Ticket #${item.ticketTypeId}`,
    }));
  } catch {
    enriched.items = (booking.items || []).map((item) => ({
      ...item,
      ticketTypeName: `Ticket #${item.ticketTypeId}`,
    }));
  }

  return enriched;
};

/** Enriches a list. Shared shows are fetched once thanks to the caches above. */
export const enrichBookings = (bookings) => Promise.all((bookings || []).map(enrichBooking));
