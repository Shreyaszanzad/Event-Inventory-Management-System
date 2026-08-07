# Database fixes — for Achal

**Written:** 7 August 2026 · **Deadline:** 11 August 2026 · **Est. effort:** ~30 minutes

Your schema is solid — it passed Hibernate's `validate` against the entities on the first try,
with zero errors, and a full booking → invoice → partial-payment flow ran green on it. Nothing
below is a design problem.

These are five concrete defects found by loading `schema.sql` + `seed.sql` into a real MySQL
8.0.45 and running the backend against it. **Four are in `seed.sql`, one is a missing index.**
Every fix has ready-to-run SQL — you should be able to paste, verify, and push.

Work through them in order; §6 tells you how to verify the whole thing at the end.

---

## 1. `seed.sql` — seeded bookings never decremented the stock 🔴

**The problem.** `seed.sql` inserts three bookings and their `booking_items`, but never reduces
`ticket_types.available_qty` to match. The seeded database therefore claims seats are free that
are already sold.

Measured on a fresh load:

| ticket_type | name | total_qty | available_qty | actually booked | should be |
|---|---|---|---|---|---|
| 1 | General | 500 | 500 | 2 | **498** |
| 5 | VIP | 200 | 200 | 1 | **199** |
| 6 | Regular | 800 | 800 | 1 | **799** |

**Why it matters.** A demo that books the last seat will oversell, because the counter starts
wrong. It also makes the admin dashboard's occupancy figures nonsense — it derives them from
this column.

**Fix.** In `seed.sql` §5 (TICKET TYPES), change the three `available_qty` values so they equal
`total_qty` minus what §7 books:

```sql
-- ticket_type 1 — 'General' for show 1: 2 booked by BK20260001
( 1, 'General',    499.00,  500, 498 ),

-- ticket_type 5 — 'VIP' for show 2: 1 booked by BK20260002
( 2, 'VIP',       1499.00,  200, 199 ),

-- ticket_type 6 — 'Regular' for show 3: 1 booked by BK20260003
( 3, 'Regular',    699.00,  800, 799 ),
```

Leave the other six tiers alone — nothing books them.

> **Rule of thumb going forward:** any seeded `booking_items` row must be matched by an equal
> reduction in that tier's `available_qty`. The application maintains this invariant itself;
> seed data has to arrive already consistent.

---

## 2. `seed.sql` — booking `BK20260003` is a zombie hold 🔴

**The problem.** That booking is `status = 'PENDING'` with `expires_at = NULL`.

The backend's hold sweeper runs every 60 seconds and looks for:

```sql
WHERE status = 'PENDING' AND expires_at < NOW()
```

`NULL` never satisfies `<`, so this row is **never swept**. It sits as a permanent pending hold,
holding a seat that will never be released or confirmed.

**Fix — pick one.** Simplest is to make it a live 10-minute hold, matching what the app would
create:

```sql
-- in §6 BOOKINGS, the BK20260003 row
(
    'BK20260003',
    2,
    3,
    NOW(6),
    DATE_ADD(NOW(6), INTERVAL 10 MINUTE),   -- was NULL
    699.00,
    'PENDING',
    'PENDING',
    0
);
```

Or, if you'd rather the seed data have no pending holds at all, set `payment_status = 'PAID'`,
`status = 'CONFIRMED'`, `expires_at = NULL`. Either is fine — just not the current combination.

> `expires_at` is **only** allowed to be NULL when the booking is no longer pending. A confirmed
> or cancelled booking has nothing to expire.

---

## 3. `seed.sql` — the password hashes aren't valid BCrypt 🔴

**The problem.** All three seeded users have `'$2a$10$dummyAdminPasswordHash'`. That's **29
characters**; a BCrypt hash is always exactly **60**. Spring Security can't parse it, so it
rejects the login outright.

Verified against the running backend:

```
POST /api/auth/admin/login  {"email":"admin@eventinventory.com","password":"Admin@123"}
→ {"success":false,"message":"Invalid email or password"}
```

**Fix.** Real hashes, generated with the project's own `BCryptPasswordEncoder` and verified to
match (`encoder.matches(raw, hash) == true`):

| Password | Hash (60 chars) |
|---|---|
| `Admin@123` | `$2a$10$c7jYVcUAEJoX5297CJmZu.Ex554Pt5R9Wfn7Blyiu4CsvgvTnGXe6` |
| `User@123` | `$2a$10$KQ7rfg9SiIUrUl3SXiQXPuAf8Ss9oY9XOZ2.J75BtnQ1lIog14BXS` |

In `seed.sql` §1 (USERS):

```sql
-- Admin User
'$2a$10$c7jYVcUAEJoX5297CJmZu.Ex554Pt5R9Wfn7Blyiu4CsvgvTnGXe6',   -- Admin@123

-- Achal Chopade  /  Tanmay Kohad
'$2a$10$KQ7rfg9SiIUrUl3SXiQXPuAf8Ss9oY9XOZ2.J75BtnQ1lIog14BXS',   -- User@123
```

> The two customer accounts sign in by phone + OTP, so their password is never actually used —
> but an unparseable hash in the column is still wrong, and a future email login would hit it.
>
> These are **development seed credentials only**. Don't reuse them anywhere real.

---

## 4. `schema.sql` — missing index on `invoices.gateway_order_id` 🟠

**The problem.** The payment gateway looks invoices up by `gateway_order_id` on every webhook
and every verify call. There's no index, so it's a full table scan:

```
EXPLAIN SELECT * FROM invoices WHERE gateway_order_id = 'order_X';

+------+---------------+------+----------+-------------+
| type | possible_keys | key  | rows     | Extra       |
+------+---------------+------+----------+-------------+
| ALL  | NULL          | NULL | <all>    | Using where |    <-- full scan
+------+---------------+------+----------+-------------+
```

Harmless at four rows, but this is the payment-confirmation hot path — the one query you least
want scanning.

**Fix.** Add to the INDEXES section of `schema.sql`:

```sql
CREATE INDEX idx_invoices_gateway_order
    ON invoices (gateway_order_id);
```

---

## 5. Two admin accounts 🟠

**The problem.** `seed.sql` inserts `admin@eventinventory.com`, and the application's
`DataSeeder` creates `admin@eims.com` on first boot. Both end up in `users` with role `ADMIN`.
No constraint is violated — it's just confusing at demo time, and only one of them works
(see §3).

**Fix — recommended.** Drop the admin from `seed.sql` and let `DataSeeder` own admin creation.
It reads its credentials from `app.seed.*` properties, so it stays configurable and its hash is
always generated correctly.

If you'd rather keep it in `seed.sql`, use `admin@eims.com` with the §3 hash so the two agree
instead of competing — but then `DataSeeder` will skip creating one, and the password comes from
your SQL rather than the environment. The first option is cleaner.

---

## Optional — nice if you have time 🟢

Not defects. Skip all of these if the deadline is tight.

**a. Redundant index.** `idx_invoices_booking` duplicates the `uk_invoices_booking` unique
constraint — MySQL already indexes a UNIQUE. Costs write throughput and disk for nothing.

```sql
DROP INDEX idx_invoices_booking ON invoices;
```

**b. Composite index for the hold sweeper.** It runs every 60 seconds filtering on
`status` **and** `expires_at`, but only `status` is indexed, so MySQL filters the rest by hand.

```sql
CREATE INDEX idx_bookings_status_expires ON bookings (status, expires_at);
-- then the single-column idx_bookings_status becomes redundant (it's a prefix of this one)
DROP INDEX idx_bookings_status ON bookings;
```

**c. Kill a filesort on "my invoices".** `findByUserIdOrderByInvoiceDateDesc` currently sorts in
memory:

```sql
CREATE INDEX idx_invoices_user_date ON invoices (user_id, invoice_date);
```

---

## 6. How to verify before you push

Load both files into a clean database and check the invariants:

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS event_inventory;"
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Then run these three checks — **all must come back clean**:

```sql
USE event_inventory;

-- 1. Stock matches bookings (fix §1). Any row returned is a bug.
SELECT tt.id, tt.name, tt.total_qty, tt.available_qty,
       COALESCE(SUM(bi.quantity), 0) AS booked
FROM ticket_types tt
LEFT JOIN booking_items bi ON bi.ticket_type_id = tt.id
GROUP BY tt.id
HAVING tt.total_qty - tt.available_qty <> booked;

-- 2. No pending booking without an expiry (fix §2). Must return 0.
SELECT COUNT(*) AS zombie_holds
FROM bookings WHERE status = 'PENDING' AND expires_at IS NULL;

-- 3. Every password hash is a real BCrypt (fix §3). Must return 0.
SELECT COUNT(*) AS bad_hashes
FROM users
WHERE password_hash IS NOT NULL
  AND (CHAR_LENGTH(password_hash) <> 60 OR password_hash NOT LIKE '$2%$%');
```

Finally, boot the backend against it and confirm a clean start plus a working admin login:

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17   # JDK 17 — the build fails on 25
mvn spring-boot:run
```

```bash
curl -s -X POST http://localhost:8080/api/auth/admin/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@eims.com","password":"Admin@123"}'
```

That must return `"success": true` with a token.

---

## Heads-up: two new tables are landing

The inventory module (`inventory_items` and `event_inventory`) has been added to `schema.sql`
and `seed.sql` on the `feature/inventory` branch, written to match your conventions — native
`ENUM` columns, `CHECK` constraints, named foreign keys with `ON DELETE RESTRICT`, and matching
indexes.

**It doesn't collide with anything above** — different tables, appended at the end of both
files. But if you're editing `seed.sql` at the same time, pull that branch first so you're not
resolving a conflict later.

Ping me if any of this doesn't reproduce on your machine.
