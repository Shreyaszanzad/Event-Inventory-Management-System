```sql
-- ============================================================
-- EVENT & INVENTORY MANAGEMENT SYSTEM
-- queries.sql
-- Common SQL Queries for Testing and Backend Development
-- ============================================================

USE event_booking_db;


-- ============================================================
-- 1. DATABASE / TABLE CHECK
-- ============================================================

-- Show all tables
SHOW TABLES;


-- Check table structures
DESC users;
DESC otp;
DESC events;
DESC shows;
DESC ticket_types;
DESC bookings;
DESC inventory;
DESC event_inventory;


-- ============================================================
-- 2. USER QUERIES
-- ============================================================

-- Get all users
SELECT *
FROM users;


-- Get user by ID
SELECT *
FROM users
WHERE user_id = 1;


-- Find user by mobile
SELECT *
FROM users
WHERE mobile = '9876543210';


-- Find user by email
SELECT *
FROM users
WHERE email = 'achal@gmail.com';


-- Get all admin users
SELECT
    user_id,
    name,
    mobile,
    email,
    role
FROM users
WHERE role = 'ADMIN';


-- Get all verified users
SELECT
    user_id,
    name,
    mobile,
    email
FROM users
WHERE is_verified = TRUE;


-- Update user verification
UPDATE users
SET is_verified = TRUE
WHERE user_id = 1;


-- Update user details
UPDATE users
SET
    name = 'Achal Chopade',
    email = 'achal.updated@gmail.com'
WHERE user_id = 1;


-- ============================================================
-- 3. OTP QUERIES
-- ============================================================

-- Get latest OTP for a mobile number
SELECT *
FROM otp
WHERE mobile = '9876543210'
ORDER BY otp_id DESC
LIMIT 1;


-- Verify OTP
UPDATE otp
SET verified = TRUE
WHERE mobile = '9876543210'
  AND otp = '123456'
  AND expires_at > NOW()
  AND verified = FALSE;


-- Find valid OTP
SELECT *
FROM otp
WHERE mobile = '9876543210'
  AND otp = '123456'
  AND expires_at > NOW()
  AND verified = FALSE
ORDER BY otp_id DESC
LIMIT 1;


-- Delete expired OTPs
DELETE FROM otp
WHERE expires_at < NOW();


-- ============================================================
-- 4. EVENT QUERIES
-- ============================================================

-- Get all events
SELECT *
FROM events
ORDER BY created_at DESC;


-- Get published events
SELECT *
FROM events
WHERE status = 'PUBLISHED'
ORDER BY created_at DESC;


-- Get event by ID
SELECT *
FROM events
WHERE event_id = 1;


-- Search event by title
SELECT *
FROM events
WHERE title LIKE '%Music%';


-- Search events by city
SELECT *
FROM events
WHERE city = 'Pune'
  AND status = 'PUBLISHED';


-- Search events by category
SELECT *
FROM events
WHERE category = 'Music'
  AND status = 'PUBLISHED';


-- Search by city and category
SELECT *
FROM events
WHERE city = 'Pune'
  AND category = 'Music'
  AND status = 'PUBLISHED';


-- Search event by title, city or category
SELECT *
FROM events
WHERE
    title LIKE '%Tech%'
    OR city LIKE '%Pune%'
    OR category LIKE '%Technology%';


-- Get events by organizer
SELECT *
FROM events
WHERE organizer_name = 'Event Management Pvt Ltd';


-- Get cancelled events
SELECT *
FROM events
WHERE status = 'CANCELLED';


-- Get draft events
SELECT *
FROM events
WHERE status = 'DRAFT';


-- Publish an event
UPDATE events
SET status = 'PUBLISHED'
WHERE event_id = 1;


-- Cancel an event
UPDATE events
SET status = 'CANCELLED'
WHERE event_id = 1;


-- ============================================================
-- 5. SHOW QUERIES
-- ============================================================

-- Get all shows
SELECT *
FROM shows
ORDER BY show_date, show_time;


-- Get shows for a particular event
SELECT *
FROM shows
WHERE event_id = 1
ORDER BY show_date, show_time;


-- Get upcoming active shows
SELECT
    s.show_id,
    e.title AS event_name,
    s.show_date,
    s.show_time,
    s.venue,
    s.total_seats,
    s.available_seats
FROM shows s
JOIN events e
    ON s.event_id = e.event_id
WHERE s.show_date >= CURDATE()
  AND s.status = 'ACTIVE'
ORDER BY s.show_date, s.show_time;


-- Get shows where seats are available
SELECT
    s.show_id,
    e.title AS event_name,
    s.show_date,
    s.show_time,
    s.available_seats
FROM shows s
JOIN events e
    ON s.event_id = e.event_id
WHERE s.available_seats > 0
  AND s.status = 'ACTIVE';


-- Get sold-out shows
SELECT
    s.show_id,
    e.title AS event_name,
    s.show_date,
    s.show_time
FROM shows s
JOIN events e
    ON s.event_id = e.event_id
WHERE s.available_seats = 0;


-- ============================================================
-- 6. TICKET TYPE QUERIES
-- ============================================================

-- Get all ticket types
SELECT *
FROM ticket_types;


-- Get tickets for a show
SELECT
    ticket_type_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
FROM ticket_types
WHERE show_id = 1;


-- Get available ticket types
SELECT
    ticket_type_id,
    ticket_name,
    price,
    available_tickets
FROM ticket_types
WHERE show_id = 1
  AND available_tickets > 0;


-- Get ticket type by ID
SELECT *
FROM ticket_types
WHERE ticket_type_id = 1;


-- Get cheapest ticket for a show
SELECT *
FROM ticket_types
WHERE show_id = 1
ORDER BY price ASC
LIMIT 1;


-- Get most expensive ticket for a show
SELECT *
FROM ticket_types
WHERE show_id = 1
ORDER BY price DESC
LIMIT 1;


-- ============================================================
-- 7. BOOKING QUERIES
-- ============================================================

-- Get all bookings
SELECT *
FROM bookings
ORDER BY booked_at DESC;


-- Get booking by booking code
SELECT *
FROM bookings
WHERE booking_code = 'BK20260001';


-- Get booking by booking ID
SELECT *
FROM bookings
WHERE booking_id = 1;


-- Get all bookings of a particular user
SELECT *
FROM bookings
WHERE user_id = 1
ORDER BY booked_at DESC;


-- Get all confirmed bookings
SELECT *
FROM bookings
WHERE booking_status = 'CONFIRMED';


-- Get all pending bookings
SELECT *
FROM bookings
WHERE booking_status = 'PENDING';


-- Get all cancelled bookings
SELECT *
FROM bookings
WHERE booking_status = 'CANCELLED';


-- Get all paid bookings
SELECT *
FROM bookings
WHERE payment_status = 'PAID';


-- Get all pending payments
SELECT *
FROM bookings
WHERE payment_status = 'PENDING';


-- ============================================================
-- 8. COMPLETE BOOKING DETAILS
-- ============================================================

SELECT
    b.booking_id,
    b.booking_code,

    u.name AS customer_name,
    u.mobile,
    u.email,

    e.title AS event_name,
    e.category,
    e.city,
    e.venue AS event_venue,

    s.show_date,
    s.show_time,
    s.venue AS show_venue,

    tt.ticket_name,
    tt.price,

    b.quantity,
    b.total_amount,

    b.payment_status,
    b.booking_status,

    b.qr_code,
    b.booked_at

FROM bookings b

JOIN users u
    ON b.user_id = u.user_id

JOIN events e
    ON b.event_id = e.event_id

JOIN shows s
    ON b.show_id = s.show_id

JOIN ticket_types tt
    ON b.ticket_type_id = tt.ticket_type_id

WHERE b.booking_code = 'BK20260001';


-- ============================================================
-- 9. USER BOOKING HISTORY
-- ============================================================

SELECT
    b.booking_code,
    e.title AS event_name,
    s.show_date,
    s.show_time,
    tt.ticket_name,
    b.quantity,
    b.total_amount,
    b.payment_status,
    b.booking_status,
    b.booked_at

FROM bookings b

JOIN events e
    ON b.event_id = e.event_id

JOIN shows s
    ON b.show_id = s.show_id

JOIN ticket_types tt
    ON b.ticket_type_id = tt.ticket_type_id

WHERE b.user_id = 1

ORDER BY b.booked_at DESC;


-- ============================================================
-- 10. EVENT BOOKING REPORT
-- ============================================================

SELECT
    e.event_id,
    e.title AS event_name,

    COUNT(b.booking_id) AS total_bookings,

    COALESCE(
        SUM(
            CASE
                WHEN b.booking_status = 'CONFIRMED'
                THEN b.quantity
                ELSE 0
            END
        ),
        0
    ) AS tickets_sold,

    COALESCE(
        SUM(
            CASE
                WHEN b.payment_status = 'PAID'
                 AND b.booking_status = 'CONFIRMED'
                THEN b.total_amount
                ELSE 0
            END
        ),
        0
    ) AS total_revenue

FROM events e

LEFT JOIN bookings b
    ON e.event_id = b.event_id

GROUP BY
    e.event_id,
    e.title

ORDER BY total_revenue DESC;


-- ============================================================
-- 11. REVENUE QUERIES
-- ============================================================

-- Total revenue
SELECT
    COALESCE(SUM(total_amount), 0) AS total_revenue
FROM bookings
WHERE payment_status = 'PAID'
  AND booking_status = 'CONFIRMED';


-- Revenue by event
SELECT
    e.event_id,
    e.title AS event_name,

    COALESCE(
        SUM(
            CASE
                WHEN b.payment_status = 'PAID'
                 AND b.booking_status = 'CONFIRMED'
                THEN b.total_amount
                ELSE 0
            END
        ),
        0
    ) AS revenue

FROM events e

LEFT JOIN bookings b
    ON e.event_id = b.event_id

GROUP BY
    e.event_id,
    e.title

ORDER BY revenue DESC;


-- Revenue by category
SELECT
    e.category,

    COALESCE(
        SUM(
            CASE
                WHEN b.payment_status = 'PAID'
                 AND b.booking_status = 'CONFIRMED'
                THEN b.total_amount
                ELSE 0
            END
        ),
        0
    ) AS revenue

FROM events e

LEFT JOIN bookings b
    ON e.event_id = b.event_id

GROUP BY e.category

ORDER BY revenue DESC;


-- ============================================================
-- 12. POPULAR EVENTS
-- ============================================================

SELECT
    e.event_id,
    e.title AS event_name,

    COALESCE(
        SUM(
            CASE
                WHEN b.booking_status = 'CONFIRMED'
                THEN b.quantity
                ELSE 0
            END
        ),
        0
    ) AS tickets_sold

FROM events e

LEFT JOIN bookings b
    ON e.event_id = b.event_id

GROUP BY
    e.event_id,
    e.title

ORDER BY tickets_sold DESC;


-- ============================================================
-- 13. USER BOOKING STATISTICS
-- ============================================================

SELECT
    u.user_id,
    u.name,

    COUNT(b.booking_id) AS total_bookings,

    COALESCE(
        SUM(
            CASE
                WHEN b.booking_status = 'CONFIRMED'
                THEN b.total_amount
                ELSE 0
            END
        ),
        0
    ) AS total_spent

FROM users u

LEFT JOIN bookings b
    ON u.user_id = b.user_id

GROUP BY
    u.user_id,
    u.name

ORDER BY total_spent DESC;


-- ============================================================
-- 14. INVENTORY QUERIES
-- ============================================================

-- Get all inventory
SELECT *
FROM inventory
ORDER BY item_name;


-- Get available inventory
SELECT
    inventory_id,
    item_name,
    category,
    quantity,
    available_quantity,
    supplier,
    unit_price,
    status

FROM inventory

WHERE available_quantity > 0
  AND status = 'AVAILABLE';


-- Get inventory by category
SELECT *
FROM inventory
WHERE category = 'Furniture';


-- Get inventory by status
SELECT *
FROM inventory
WHERE status = 'AVAILABLE';


-- Search inventory by item name
SELECT *
FROM inventory
WHERE item_name LIKE '%Chair%';


-- Find low-stock inventory
SELECT
    inventory_id,
    item_name,
    quantity,
    available_quantity

FROM inventory

WHERE available_quantity <= 10

ORDER BY available_quantity ASC;


-- Calculate total inventory value
SELECT
    COALESCE(
        SUM(quantity * unit_price),
        0
    ) AS total_inventory_value

FROM inventory;


-- Calculate available inventory value
SELECT
    COALESCE(
        SUM(available_quantity * unit_price),
        0
    ) AS available_inventory_value

FROM inventory;


-- ============================================================
-- 15. EVENT INVENTORY QUERIES
-- ============================================================

-- Get inventory assigned to one event
SELECT

    e.event_id,
    e.title AS event_name,

    i.inventory_id,
    i.item_name,
    i.category,

    ei.assigned_quantity,
    ei.returned_quantity,

    (
        ei.assigned_quantity
        - ei.returned_quantity
    ) AS pending_return,

    ei.remarks

FROM event_inventory ei

JOIN events e
    ON ei.event_id = e.event_id

JOIN inventory i
    ON ei.inventory_id = i.inventory_id

WHERE ei.event_id = 1;


-- Get all event inventory assignments
SELECT

    e.title AS event_name,

    i.item_name,
    i.category,

    ei.assigned_quantity,
    ei.returned_quantity,

    (
        ei.assigned_quantity
        - ei.returned_quantity
    ) AS pending_return

FROM event_inventory ei

JOIN events e
    ON ei.event_id = e.event_id

JOIN inventory i
    ON ei.inventory_id = i.inventory_id

ORDER BY e.title, i.item_name;


-- Get inventory which has not been completely returned
SELECT

    e.title AS event_name,

    i.item_name,

    ei.assigned_quantity,

    ei.returned_quantity,

    (
        ei.assigned_quantity
        - ei.returned_quantity
    ) AS pending_return

FROM event_inventory ei

JOIN events e
    ON ei.event_id = e.event_id

JOIN inventory i
    ON ei.inventory_id = i.inventory_id

WHERE ei.returned_quantity < ei.assigned_quantity;


-- ============================================================
-- 16. ADMIN DASHBOARD
-- ============================================================

SELECT

    (
        SELECT COUNT(*)
        FROM users
        WHERE role = 'USER'
    ) AS total_users,

    (
        SELECT COUNT(*)
        FROM events
        WHERE status = 'PUBLISHED'
    ) AS published_events,

    (
        SELECT COUNT(*)
        FROM bookings
        WHERE booking_status = 'CONFIRMED'
    ) AS confirmed_bookings,

    (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM bookings
        WHERE payment_status = 'PAID'
          AND booking_status = 'CONFIRMED'
    ) AS total_revenue,

    (
        SELECT COUNT(*)
        FROM inventory
    ) AS total_inventory_items;


-- ============================================================
-- 17. UPCOMING EVENTS
-- ============================================================

SELECT DISTINCT

    e.event_id,
    e.title,
    e.category,
    e.city,

    MIN(s.show_date) AS next_show_date

FROM events e

JOIN shows s
    ON e.event_id = s.event_id

WHERE e.status = 'PUBLISHED'

  AND s.status = 'ACTIVE'

  AND s.show_date >= CURDATE()

GROUP BY
    e.event_id,
    e.title,
    e.category,
    e.city

ORDER BY next_show_date;


-- ============================================================
-- 18. EVENT DETAILS WITH SHOWS AND TICKETS
-- ============================================================

SELECT

    e.event_id,
    e.title AS event_name,
    e.category,
    e.city,

    s.show_id,
    s.show_date,
    s.show_time,
    s.available_seats,

    tt.ticket_type_id,
    tt.ticket_name,
    tt.price,
    tt.available_tickets

FROM events e

JOIN shows s
    ON e.event_id = s.event_id

JOIN ticket_types tt
    ON s.show_id = tt.show_id

WHERE e.event_id = 1

ORDER BY
    s.show_date,
    s.show_time,
    tt.price;


-- ============================================================
-- 19. BOOKING COUNT BY EVENT
-- ============================================================

SELECT

    e.title AS event_name,

    COUNT(b.booking_id) AS booking_count

FROM events e

LEFT JOIN bookings b
    ON e.event_id = b.event_id

GROUP BY
    e.event_id,
    e.title

ORDER BY booking_count DESC;


-- ============================================================
-- 20. TICKETS SOLD BY TICKET TYPE
-- ============================================================

SELECT

    e.title AS event_name,

    tt.ticket_name,

    SUM(
        CASE
            WHEN b.booking_status = 'CONFIRMED'
            THEN b.quantity
            ELSE 0
        END
    ) AS tickets_sold

FROM bookings b

JOIN events e
    ON b.event_id = e.event_id

JOIN ticket_types tt
    ON b.ticket_type_id = tt.ticket_type_id

GROUP BY
    e.event_id,
    e.title,
    tt.ticket_type_id,
    tt.ticket_name

ORDER BY tickets_sold DESC;


-- ============================================================
-- 21. PAYMENT STATUS REPORT
-- ============================================================

SELECT

    payment_status,

    COUNT(*) AS total_bookings,

    COALESCE(
        SUM(total_amount),
        0
    ) AS total_amount

FROM bookings

GROUP BY payment_status

ORDER BY total_amount DESC;


-- ============================================================
-- 22. BOOKING STATUS REPORT
-- ============================================================

SELECT

    booking_status,

    COUNT(*) AS total_bookings

FROM bookings

GROUP BY booking_status;


-- ============================================================
-- 23. MOST ACTIVE USERS
-- ============================================================

SELECT

    u.user_id,
    u.name,
    u.email,

    COUNT(b.booking_id) AS total_bookings

FROM users u

JOIN bookings b
    ON u.user_id = b.user_id

GROUP BY
    u.user_id,
    u.name,
    u.email

ORDER BY total_bookings DESC;


-- ============================================================
-- 24. EVENT INVENTORY SUMMARY
-- ============================================================

SELECT

    e.event_id,
    e.title AS event_name,

    COUNT(ei.event_inventory_id)
        AS inventory_items_assigned,

    COALESCE(
        SUM(ei.assigned_quantity),
        0
    ) AS total_items_assigned,

    COALESCE(
        SUM(ei.returned_quantity),
        0
    ) AS total_items_returned

FROM events e

LEFT JOIN event_inventory ei
    ON e.event_id = ei.event_id

GROUP BY
    e.event_id,
    e.title

ORDER BY e.event_id;


-- ============================================================
-- 25. DATABASE RELATIONSHIP CHECK
-- ============================================================

SELECT

    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME

FROM information_schema.KEY_COLUMN_USAGE

WHERE TABLE_SCHEMA = 'event_booking_db'

  AND REFERENCED_TABLE_NAME IS NOT NULL

ORDER BY TABLE_NAME;


-- ============================================================
-- END OF queries.sql
-- ============================================================
```
