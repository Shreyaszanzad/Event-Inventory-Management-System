-- ============================================================================
-- Event & Inventory Management System
-- queries.sql
-- Database: event_inventory
-- ============================================================================

USE event_inventory;


-- ============================================================================
-- 1. BASIC DATABASE QUERIES
-- ============================================================================

-- Show all users
SELECT *
FROM users;

-- Show all events
SELECT *
FROM events;

-- Show all shows
SELECT *
FROM shows;

-- Show all ticket types
SELECT *
FROM ticket_types;

-- Show all bookings
SELECT *
FROM bookings;

-- Show all invoices
SELECT *
FROM invoices;

-- Show all payments
SELECT *
FROM payments;


-- ============================================================================
-- 2. USER QUERIES
-- ============================================================================

-- Get all active users
SELECT
    id,
    name,
    phone,
    email,
    role,
    status,
    created_at
FROM users
WHERE status = 'ACTIVE';


-- Get all admins
SELECT
    id,
    name,
    email,
    phone
FROM users
WHERE role = 'ADMIN';


-- Get all normal users
SELECT
    id,
    name,
    email,
    phone
FROM users
WHERE role = 'USER';


-- Find user by email
SELECT *
FROM users
WHERE email = 'achal@example.com';


-- Find user by phone
SELECT *
FROM users
WHERE phone = '9876543211';


-- ============================================================================
-- 3. EVENT QUERIES
-- ============================================================================

-- Get all active events
SELECT
    id,
    title,
    type,
    category,
    venue_name,
    city,
    start_time,
    status
FROM events
WHERE status = 'ACTIVE';


-- Get only ticketed events
SELECT
    id,
    title,
    category,
    venue_name,
    city,
    start_time
FROM events
WHERE type = 'TICKETED';


-- Get only inventory events
SELECT
    id,
    title,
    category,
    venue_name,
    city,
    start_time
FROM events
WHERE type = 'INVENTORY';


-- Get events by category
SELECT *
FROM events
WHERE category = 'COMEDY';


-- Get events by city
SELECT *
FROM events
WHERE city = 'Pune';


-- Search events by title
SELECT *
FROM events
WHERE title LIKE '%Music%';


-- Search events by title or city
SELECT *
FROM events
WHERE title LIKE '%Music%'
   OR city LIKE '%Pune%';


-- ============================================================================
-- 4. SHOW QUERIES
-- ============================================================================

-- Get all shows
SELECT *
FROM shows;


-- Get shows for a particular event
SELECT
    s.id,
    s.event_id,
    e.title AS event_name,
    s.show_datetime,
    s.status
FROM shows s
JOIN events e
    ON s.event_id = e.id
WHERE s.event_id = 1;


-- Get all active shows with event information
SELECT
    s.id AS show_id,
    e.id AS event_id,
    e.title AS event_name,
    e.category,
    e.venue_name,
    e.city,
    s.show_datetime,
    s.status
FROM shows s
JOIN events e
    ON s.event_id = e.id
WHERE s.status = 'ACTIVE';


-- ============================================================================
-- 5. TICKET TYPE QUERIES
-- ============================================================================

-- Get all ticket types
SELECT *
FROM ticket_types;


-- Get ticket types for a particular show
SELECT
    tt.id,
    tt.show_id,
    tt.name,
    tt.price,
    tt.total_qty,
    tt.available_qty
FROM ticket_types tt
WHERE tt.show_id = 1;


-- Get ticket types with available tickets
SELECT
    id,
    show_id,
    name,
    price,
    total_qty,
    available_qty
FROM ticket_types
WHERE available_qty > 0;


-- Get sold quantity
SELECT
    id,
    name,
    total_qty,
    available_qty,
    (total_qty - available_qty) AS sold_qty
FROM ticket_types;


-- Get ticket availability percentage
SELECT
    id,
    name,
    total_qty,
    available_qty,
    ROUND(
        (available_qty / NULLIF(total_qty, 0)) * 100,
        2
    ) AS availability_percentage
FROM ticket_types;


-- ============================================================================
-- 6. EVENT + SHOW + TICKET INFORMATION
-- ============================================================================

-- Complete ticket catalog
SELECT
    e.id AS event_id,
    e.title AS event_name,
    e.category,
    e.city,
    e.venue_name,
    s.id AS show_id,
    s.show_datetime,
    tt.id AS ticket_type_id,
    tt.name AS ticket_type,
    tt.price,
    tt.total_qty,
    tt.available_qty
FROM events e
JOIN shows s
    ON e.id = s.event_id
JOIN ticket_types tt
    ON s.id = tt.show_id
WHERE e.status = 'ACTIVE'
  AND s.status = 'ACTIVE';


-- ============================================================================
-- 7. BOOKING QUERIES
-- ============================================================================

-- Get all bookings
SELECT *
FROM bookings;


-- Get confirmed bookings
SELECT
    id,
    booking_reference,
    user_id,
    show_id,
    booking_date,
    total_amount,
    payment_status,
    status
FROM bookings
WHERE status = 'CONFIRMED';


-- Get pending bookings
SELECT
    id,
    booking_reference,
    user_id,
    show_id,
    booking_date,
    expires_at,
    total_amount,
    payment_status,
    status
FROM bookings
WHERE status = 'PENDING';


-- Get cancelled bookings
SELECT *
FROM bookings
WHERE status = 'CANCELLED';


-- Get bookings of a particular user
SELECT
    b.id,
    b.booking_reference,
    b.booking_date,
    b.total_amount,
    b.payment_status,
    b.status
FROM bookings b
WHERE b.user_id = 2;


-- Find booking by booking reference
SELECT *
FROM bookings
WHERE booking_reference = 'BK20260001';


-- ============================================================================
-- 8. BOOKING + USER INFORMATION
-- ============================================================================

SELECT
    b.id AS booking_id,
    b.booking_reference,
    u.id AS user_id,
    u.name AS customer_name,
    u.email,
    u.phone,
    b.booking_date,
    b.total_amount,
    b.payment_status,
    b.status
FROM bookings b
JOIN users u
    ON b.user_id = u.id;


-- ============================================================================
-- 9. BOOKING + EVENT + SHOW INFORMATION
-- ============================================================================

SELECT
    b.id AS booking_id,
    b.booking_reference,
    u.name AS customer_name,
    e.title AS event_name,
    e.category,
    e.venue_name,
    e.city,
    s.show_datetime,
    b.booking_date,
    b.total_amount,
    b.payment_status,
    b.status
FROM bookings b
JOIN users u
    ON b.user_id = u.id
JOIN shows s
    ON b.show_id = s.id
JOIN events e
    ON s.event_id = e.id;


-- ============================================================================
-- 10. COMPLETE BOOKING DETAILS
-- ============================================================================

SELECT
    b.booking_reference,
    u.name AS customer_name,
    u.email,
    e.title AS event_name,
    e.category,
    e.venue_name,
    e.city,
    s.show_datetime,
    tt.name AS ticket_type,
    bi.quantity,
    bi.unit_price,
    (bi.quantity * bi.unit_price) AS item_total,
    b.total_amount,
    b.payment_status,
    b.status
FROM booking_items bi
JOIN bookings b
    ON bi.booking_id = b.id
JOIN users u
    ON b.user_id = u.id
JOIN ticket_types tt
    ON bi.ticket_type_id = tt.id
JOIN shows s
    ON b.show_id = s.id
JOIN events e
    ON s.event_id = e.id
ORDER BY b.booking_date DESC;


-- ============================================================================
-- 11. BOOKING ITEM QUERIES
-- ============================================================================

-- Get booking items
SELECT *
FROM booking_items;


-- Get items for a specific booking
SELECT
    bi.id,
    bi.booking_id,
    tt.name AS ticket_type,
    bi.quantity,
    bi.unit_price,
    (bi.quantity * bi.unit_price) AS total
FROM booking_items bi
JOIN ticket_types tt
    ON bi.ticket_type_id = tt.id
WHERE bi.booking_id = 1;


-- Calculate total from booking items
SELECT
    booking_id,
    SUM(quantity * unit_price) AS calculated_total
FROM booking_items
GROUP BY booking_id;


-- ============================================================================
-- 12. INVOICE QUERIES
-- ============================================================================

-- Get all invoices
SELECT *
FROM invoices;


-- Get paid invoices
SELECT
    invoice_number,
    booking_id,
    user_id,
    subtotal,
    discount,
    total_amount,
    paid_amount,
    balance_amount,
    status,
    invoice_date
FROM invoices
WHERE status = 'PAID';


-- Get unpaid invoices
SELECT
    invoice_number,
    booking_id,
    user_id,
    total_amount,
    paid_amount,
    balance_amount,
    status
FROM invoices
WHERE status = 'UNPAID';


-- Get invoice by invoice number
SELECT *
FROM invoices
WHERE invoice_number = 'INV20260001';


-- ============================================================================
-- 13. INVOICE + USER + BOOKING INFORMATION
-- ============================================================================

SELECT
    i.invoice_number,
    u.name AS customer_name,
    u.email,
    b.booking_reference,
    i.subtotal,
    i.discount,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.status,
    i.invoice_date
FROM invoices i
JOIN users u
    ON i.user_id = u.id
JOIN bookings b
    ON i.booking_id = b.id;


-- ============================================================================
-- 14. PAYMENT QUERIES
-- ============================================================================

-- Get all payments
SELECT *
FROM payments;


-- Get payments by mode
SELECT *
FROM payments
WHERE mode = 'UPI';


-- Payment history for an invoice
SELECT
    p.id,
    i.invoice_number,
    p.amount,
    p.mode,
    p.payment_date
FROM payments p
JOIN invoices i
    ON p.invoice_id = i.id
WHERE p.invoice_id = 1;


-- ============================================================================
-- 15. PAYMENT SUMMARY
-- ============================================================================

SELECT
    mode,
    COUNT(*) AS number_of_payments,
    SUM(amount) AS total_amount
FROM payments
GROUP BY mode
ORDER BY total_amount DESC;


-- ============================================================================
-- 16. DASHBOARD QUERIES
-- ============================================================================

-- Total users
SELECT COUNT(*) AS total_users
FROM users;


-- Total events
SELECT COUNT(*) AS total_events
FROM events;


-- Total ticketed events
SELECT COUNT(*) AS total_ticketed_events
FROM events
WHERE type = 'TICKETED';


-- Total inventory events
SELECT COUNT(*) AS total_inventory_events
FROM events
WHERE type = 'INVENTORY';


-- Total bookings
SELECT COUNT(*) AS total_bookings
FROM bookings;


-- Confirmed bookings
SELECT COUNT(*) AS confirmed_bookings
FROM bookings
WHERE status = 'CONFIRMED';


-- Pending bookings
SELECT COUNT(*) AS pending_bookings
FROM bookings
WHERE status = 'PENDING';


-- Total revenue from confirmed bookings
SELECT
    COALESCE(SUM(total_amount), 0) AS total_revenue
FROM bookings
WHERE status = 'CONFIRMED';


-- Total amount received
SELECT
    COALESCE(SUM(amount), 0) AS total_payments
FROM payments;


-- Total outstanding balance
SELECT
    COALESCE(SUM(balance_amount), 0) AS total_outstanding
FROM invoices
WHERE balance_amount > 0;


-- ============================================================================
-- 17. EVENT-WISE BOOKING REPORT
-- ============================================================================

SELECT
    e.id AS event_id,
    e.title AS event_name,
    COUNT(b.id) AS total_bookings,
    COALESCE(SUM(b.total_amount), 0) AS total_revenue
FROM events e
LEFT JOIN shows s
    ON e.id = s.event_id
LEFT JOIN bookings b
    ON s.id = b.show_id
GROUP BY e.id, e.title
ORDER BY total_revenue DESC;


-- ============================================================================
-- 18. CITY-WISE EVENT REPORT
-- ============================================================================

SELECT
    city,
    COUNT(*) AS total_events
FROM events
GROUP BY city
ORDER BY total_events DESC;


-- ============================================================================
-- 19. CATEGORY-WISE EVENT REPORT
-- ============================================================================

SELECT
    category,
    COUNT(*) AS total_events
FROM events
WHERE category IS NOT NULL
GROUP BY category
ORDER BY total_events DESC;


-- ============================================================================
-- 20. CATEGORY-WISE REVENUE
-- ============================================================================

SELECT
    e.category,
    COUNT(b.id) AS total_bookings,
    COALESCE(SUM(b.total_amount), 0) AS total_revenue
FROM events e
JOIN shows s
    ON e.id = s.event_id
JOIN bookings b
    ON s.id = b.show_id
WHERE b.status = 'CONFIRMED'
GROUP BY e.category
ORDER BY total_revenue DESC;


-- ============================================================================
-- 21. MOST POPULAR EVENTS
-- ============================================================================

SELECT
    e.id,
    e.title,
    COUNT(b.id) AS booking_count
FROM events e
JOIN shows s
    ON e.id = s.event_id
JOIN bookings b
    ON s.id = b.show_id
GROUP BY e.id, e.title
ORDER BY booking_count DESC;


-- ============================================================================
-- 22. TOP SELLING TICKET TYPES
-- ============================================================================

SELECT
    tt.id,
    tt.name AS ticket_type,
    SUM(bi.quantity) AS tickets_sold,
    SUM(bi.quantity * bi.unit_price) AS revenue
FROM booking_items bi
JOIN ticket_types tt
    ON bi.ticket_type_id = tt.id
JOIN bookings b
    ON bi.booking_id = b.id
WHERE b.status = 'CONFIRMED'
GROUP BY tt.id, tt.name
ORDER BY tickets_sold DESC;


-- ============================================================================
-- 23. LOW TICKET AVAILABILITY
-- ============================================================================

SELECT
    tt.id,
    e.title AS event_name,
    s.show_datetime,
    tt.name AS ticket_type,
    tt.available_qty,
    tt.total_qty
FROM ticket_types tt
JOIN shows s
    ON tt.show_id = s.id
JOIN events e
    ON s.event_id = e.id
WHERE tt.available_qty <= 50
ORDER BY tt.available_qty ASC;


-- ============================================================================
-- 24. CUSTOMER BOOKING HISTORY
-- ============================================================================

SELECT
    u.name AS customer_name,
    u.email,
    b.booking_reference,
    e.title AS event_name,
    s.show_datetime,
    b.total_amount,
    b.payment_status,
    b.status
FROM users u
JOIN bookings b
    ON u.id = b.user_id
JOIN shows s
    ON b.show_id = s.id
JOIN events e
    ON s.event_id = e.id
WHERE u.id = 2
ORDER BY b.booking_date DESC;


-- ============================================================================
-- 25. CUSTOMERS WITH MULTIPLE BOOKINGS
-- ============================================================================

SELECT
    u.id,
    u.name,
    u.email,
    COUNT(b.id) AS booking_count
FROM users u
JOIN bookings b
    ON u.id = b.user_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(b.id) > 1
ORDER BY booking_count DESC;


-- ============================================================================
-- 26. DAILY BOOKING REPORT
-- ============================================================================

SELECT
    DATE(booking_date) AS booking_day,
    COUNT(*) AS total_bookings,
    SUM(total_amount) AS total_amount
FROM bookings
GROUP BY DATE(booking_date)
ORDER BY booking_day DESC;


-- ============================================================================
-- 27. DAILY PAYMENT REPORT
-- ============================================================================

SELECT
    DATE(payment_date) AS payment_day,
    COUNT(*) AS payment_count,
    SUM(amount) AS total_payment
FROM payments
GROUP BY DATE(payment_date)
ORDER BY payment_day DESC;


-- ============================================================================
-- 28. MONTHLY REVENUE
-- ============================================================================

SELECT
    YEAR(booking_date) AS year,
    MONTH(booking_date) AS month,
    COUNT(*) AS total_bookings,
    SUM(total_amount) AS revenue
FROM bookings
WHERE status = 'CONFIRMED'
GROUP BY YEAR(booking_date), MONTH(booking_date)
ORDER BY year DESC, month DESC;


-- ============================================================================
-- 29. PAYMENT STATUS SUMMARY
-- ============================================================================

SELECT
    payment_status,
    COUNT(*) AS booking_count,
    SUM(total_amount) AS total_amount
FROM bookings
GROUP BY payment_status
ORDER BY booking_count DESC;


-- ============================================================================
-- 30. BOOKING STATUS SUMMARY
-- ============================================================================

SELECT
    status,
    COUNT(*) AS booking_count,
    COALESCE(SUM(total_amount), 0) AS total_amount
FROM bookings
GROUP BY status
ORDER BY booking_count DESC;


-- ============================================================================
-- 31. UPCOMING EVENTS
-- ============================================================================

SELECT
    id,
    title,
    category,
    venue_name,
    city,
    start_time,
    status
FROM events
WHERE start_time IS NOT NULL
  AND start_time >= NOW()
  AND status = 'ACTIVE'
ORDER BY start_time ASC;


-- ============================================================================
-- 32. UPCOMING SHOWS
-- ============================================================================

SELECT
    s.id AS show_id,
    e.title AS event_name,
    e.category,
    e.venue_name,
    e.city,
    s.show_datetime
FROM shows s
JOIN events e
    ON s.event_id = e.id
WHERE s.show_datetime >= NOW()
  AND s.status = 'ACTIVE'
ORDER BY s.show_datetime ASC;


-- ============================================================================
-- 33. EVENT DETAILS BY EVENT ID
-- ============================================================================

SELECT
    e.id AS event_id,
    e.title,
    e.description,
    e.type,
    e.category,
    e.venue_name,
    e.city,
    e.start_time,
    e.status,
    s.id AS show_id,
    s.show_datetime,
    s.status AS show_status
FROM events e
LEFT JOIN shows s
    ON e.id = s.event_id
WHERE e.id = 1;


-- ============================================================================
-- 34. FULL CUSTOMER INVOICE REPORT
-- ============================================================================

SELECT
    u.name AS customer_name,
    u.email,
    b.booking_reference,
    e.title AS event_name,
    i.invoice_number,
    i.subtotal,
    i.discount,
    i.total_amount,
    i.paid_amount,
    i.balance_amount,
    i.status AS invoice_status,
    i.invoice_date
FROM invoices i
JOIN users u
    ON i.user_id = u.id
JOIN bookings b
    ON i.booking_id = b.id
JOIN shows s
    ON b.show_id = s.id
JOIN events e
    ON s.event_id = e.id
ORDER BY i.invoice_date DESC;


-- ============================================================================
-- 35. REVENUE BY PAYMENT MODE
-- ============================================================================

SELECT
    p.mode,
    COUNT(p.id) AS transaction_count,
    SUM(p.amount) AS total_revenue
FROM payments p
GROUP BY p.mode
ORDER BY total_revenue DESC;


-- ============================================================================
-- END OF QUERIES
-- ============================================================================