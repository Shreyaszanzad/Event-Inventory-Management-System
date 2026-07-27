# Event & Inventory Management System — Backend

A hybrid entertainment ticketing + event-inventory platform. Public users book
ticketed events (movies, comedy, amusement, live events); admins additionally manage inventory-type
events where physical items are allocated and tracked.

Backend: **Java 17 · Spring Boot 3.x · Spring Security (JWT) · Spring Data JPA · MySQL 8 · Maven.**

## Prerequisites

- JDK 17
- Maven 3.9+
- MySQL 8 running locally (or use the H2 profile below — no DB setup)
- Lombok plugin enabled in your IDE (IntelliJ/Eclipse/STS)

## Configure

Configuration lives in `src/main/resources/application.properties`. Sensitive values are read from
**environment variables** with dev-only fallbacks, so you can override them without editing the file:

| Env var | Purpose | Dev fallback |
|---|---|---|
| `DB_USERNAME` / `DB_PASSWORD` | MySQL credentials | `root` / `root` |
| `JWT_SECRET` | JWT signing secret (≥ 32 chars) | dev placeholder |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | first-run admin account | see note below |

The schema `event_inventory` is created automatically on first run (`createDatabaseIfNotExist=true`).

## Run

**With MySQL:**
```bash
mvn spring-boot:run
```

**Without MySQL (in-memory H2, zero setup — great for quick local testing):**
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=h2
```

The API starts on `http://localhost:8080`. On first startup a **development** admin account is seeded
from the `app.seed.*` properties (override via `SEED_ADMIN_*` env vars). These are local dev
credentials only — set real ones and change the password before any real use.

## Authentication

Two login flows, both returning a JWT:

| Realm | Flow | Role |
|-------|------|------|
| General user | `POST /api/auth/otp/request` → `POST /api/auth/otp/verify` (phone + OTP) | `ROLE_USER` |
| Admin | `POST /api/auth/admin/login` (email + password) | `ROLE_ADMIN` |

Send the token on protected calls: `Authorization: Bearer <token>`.

> **OTP is mocked** (`app.otp.mock-enabled=true`): the code is returned in the response as `devOtp`
> and logged — no SMS is sent. Swap in a real gateway (MSG91/Twilio) inside `OtpService` later.

### Abuse protection (built in)
- OTP requests are rate-limited per phone and per IP, with a resend cooldown.
- A new OTP invalidates the previous one; wrong OTP guesses are capped (then the code is burned).
- Admin login is throttled per email and per IP.
- Breaching a limit returns **HTTP 429**.

## Endpoints so far

```
POST   /api/auth/otp/request      request an OTP           (public)
POST   /api/auth/otp/verify       verify OTP, get JWT      (public)
POST   /api/auth/admin/login      admin login, get JWT     (public)
GET    /api/events                list public (TICKETED)   (public)
GET    /api/events/{id}           get one event            (public)
GET    /api/admin/events          list all events          (ROLE_ADMIN)
POST   /api/admin/events          create event             (ROLE_ADMIN)
PUT    /api/admin/events/{id}     update event             (ROLE_ADMIN)
DELETE /api/admin/events/{id}     delete event             (ROLE_ADMIN)

GET    /api/events/{id}/shows            list shows for an event   (public)
GET    /api/shows/{id}                   get a show                (public)
GET    /api/shows/{id}/ticket-types      list ticket tiers         (public)
POST   /api/admin/events/{id}/shows      create show               (ROLE_ADMIN)
PUT    /api/admin/shows/{id}             update show               (ROLE_ADMIN)
DELETE /api/admin/shows/{id}             delete show               (ROLE_ADMIN)
POST   /api/admin/shows/{id}/ticket-types create ticket tier       (ROLE_ADMIN)
PUT    /api/admin/ticket-types/{id}      update ticket tier        (ROLE_ADMIN)
DELETE /api/admin/ticket-types/{id}      delete ticket tier        (ROLE_ADMIN)

POST   /api/bookings              create a booking         (ROLE_USER)
GET    /api/bookings/me           my bookings              (ROLE_USER)
GET    /api/bookings/{id}         my booking detail        (ROLE_USER)
```

Every response uses the envelope: `{ "success": bool, "message": string, "data": ... }`.

## Testing (Postman)

Import `postman/EventInventory.postman_collection.json`. The login requests auto-save the JWT into
collection variables, so admin/user calls are ready to run. **The Postman collection is the team's
API contract** — backend re-exports it here on every endpoint change.

## Security notes

- **Never commit real secrets.** Production values (`JWT_SECRET`, DB credentials, admin password)
  must come from environment variables, not the properties file.
- The values in `application.properties` are **development fallbacks only** — there is no deployed
  instance, and they must be replaced before any real deployment.
- Generate a strong JWT secret with: `openssl rand -base64 48`.

## Contributing

`main` is protected: push a `feature/<name>` branch, open a PR, get CI green, and get an approval
before merging. Build on **JDK 17** (newer JDKs break Lombok in this setup).

## Project structure

```
com.softpoly.eventinventory
├── config/      SecurityConfig, DataSeeder
├── security/    JwtService, JwtAuthFilter, RateLimiterService
├── common/      ApiResponse, exceptions, enums
├── auth/        OTP + admin login  (Shreyash)
├── user/        user account       (Shreyash)
├── event/       catalog reference  (Tanmay extends: show, ticket_type, ...)
└── ...          booking, billing, inventory, vendor, notification (to be added)
```
