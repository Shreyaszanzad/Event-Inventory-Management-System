# Event & Inventory Management System — Backend

A hybrid entertainment ticketing + event-inventory platform. Public users book
ticketed events (movies, comedy, amusement, live events); admins additionally manage inventory-type
events where physical items (chairs, tables, sound, decor) are allocated and tracked.

Backend: **Java 17 · Spring Boot 3.x · Spring Security (JWT) · Spring Data JPA · MySQL 8 · Maven.**

## Prerequisites

- JDK 17
- Maven 3.9+
- MySQL 8 running locally
- Lombok plugin enabled in your IDE (IntelliJ/Eclipse/STS)

## Configure

Edit `src/main/resources/application.properties` and set your MySQL username/password.
The schema `event_inventory` is created automatically on first run (`createDatabaseIfNotExist=true`).

## Run

```bash
mvn spring-boot:run
```

The API starts on `http://localhost:8080`. A default admin is seeded on first startup:

- **email:** `admin@eims.com`
- **password:** `Admin@123`  _(change after first login)_

## Authentication

Two login flows, both returning a JWT:

| Realm | Flow | Role |
|-------|------|------|
| General user | `POST /api/auth/otp/request` → `POST /api/auth/otp/verify` (phone + OTP) | `ROLE_USER` |
| Admin | `POST /api/auth/admin/login` (email + password) | `ROLE_ADMIN` |

Send the token on protected calls: `Authorization: Bearer <token>`.

> **OTP is mocked** (`app.otp.mock-enabled=true`): the code is returned in the response as `devOtp`
> and logged — no SMS is sent. Swap in a real gateway (MSG91/Twilio) inside `OtpService` later.

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
```

Every response uses the envelope: `{ "success": bool, "message": string, "data": ... }`.

## Testing (Postman)

Import `postman/EventInventory.postman_collection.json`. The login requests auto-save the JWT into
collection variables, so admin/user calls are ready to run. **The Postman collection is the team's
API contract** — backend re-exports it here on every endpoint change.

## Project structure

```
com.softpoly.eventinventory
├── config/      SecurityConfig, DataSeeder
├── security/    JwtService, JwtAuthFilter
├── common/      ApiResponse, exceptions, enums
├── auth/        OTP + admin login  (Shreyash)
├── user/        user account       (Shreyash)
├── event/       catalog reference  (Tanmay extends: show, ticket_type, ...)
└── ...          booking, billing, inventory, vendor, notification (to be added)
```
