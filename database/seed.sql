-- ============================================================================
-- Event & Inventory Management System
-- Seed Data
-- Database: event_inventory
-- ============================================================================

USE event_inventory;


-- ============================================================================
-- 1. USERS
-- ============================================================================

INSERT INTO users
(
    name,
    phone,
    email,
    password_hash,
    role,
    status,
    created_at
)
VALUES
(
    'Admin User',
    '9876543210',
    'admin@eventinventory.com',
    '$2a$10$c7jYVcUAEJoX5297CJmZu.Ex554Pt5R9Wfn7Blyiu4CsvgvTnGXe6',
    'ADMIN',
    'ACTIVE',
    NOW(6)
),
(
    'Achal Chopade',
    '9876543211',
    'achal@example.com',
    '$2a$10$KQ7rfg9SiIUrUl3SXiQXPuAf8Ss9oY9XOZ2.J75BtnQ1lIog14BXS',
    'USER',
    'ACTIVE',
    NOW(6)
),
(
    'Tanmay Kohad',
    '9876543212',
    'tanmay@example.com',
    '$2a$10$KQ7rfg9SiIUrUl3SXiQXPuAf8Ss9oY9XOZ2.J75BtnQ1lIog14BXS',
    'USER',
    'ACTIVE',
    NOW(6)
);


-- ============================================================================
-- 2. OTP TOKENS
-- ============================================================================

INSERT INTO otp_tokens
(
    phone,
    otp_hash,
    expires_at,
    used,
    attempts,
    created_at
)
VALUES
(
    '9876543211',
    'dummy_otp_hash_001',
    DATE_ADD(NOW(6), INTERVAL 10 MINUTE),
    b'0',
    0,
    NOW(6)
),
(
    '9876543212',
    'dummy_otp_hash_002',
    DATE_ADD(NOW(6), INTERVAL 10 MINUTE),
    b'0',
    0,
    NOW(6)
);


-- ============================================================================
-- 3. EVENTS
-- ============================================================================

INSERT INTO events
(
    title,
    description,
    type,
    category,
    venue_name,
    city,
    poster_url,
    start_time,
    status,
    created_by,
    created_at
)
VALUES
(
    'Comedy Night Live',
    'A live stand-up comedy event featuring popular comedians.',
    'TICKETED',
    'COMEDY',
    'Grand Convention Hall',
    'Nagpur',
    'https://example.com/posters/comedy-night.jpg',
    DATE_ADD(NOW(6), INTERVAL 15 DAY),
    'ACTIVE',
    1,
    NOW(6)
),
(
    'Summer Music Festival',
    'Live music festival with multiple artists and performances.',
    'TICKETED',
    'EVENT',
    'Central Ground',
    'Pune',
    'https://example.com/posters/music-festival.jpg',
    DATE_ADD(NOW(6), INTERVAL 30 DAY),
    'ACTIVE',
    1,
    NOW(6)
),
(
    'Adventure Park Day',
    'Full-day amusement and adventure park experience.',
    'TICKETED',
    'AMUSEMENT',
    'Adventure World',
    'Mumbai',
    'https://example.com/posters/adventure-park.jpg',
    DATE_ADD(NOW(6), INTERVAL 20 DAY),
    'ACTIVE',
    1,
    NOW(6)
),
(
    'Movie Premiere Night',
    'Special premiere screening with premium seating.',
    'TICKETED',
    'MOVIE',
    'CityPlex Cinema',
    'Nagpur',
    'https://example.com/posters/movie-premiere.jpg',
    DATE_ADD(NOW(6), INTERVAL 7 DAY),
    'ACTIVE',
    1,
    NOW(6)
),
(
    'Corporate Annual Event',
    'Private corporate event requiring managed inventory.',
    'INVENTORY',
    'EVENT',
    'Corporate Convention Center',
    'Pune',
    NULL,
    DATE_ADD(NOW(6), INTERVAL 45 DAY),
    'ACTIVE',
    1,
    NOW(6)
);


-- ============================================================================
-- 4. SHOWS
-- ============================================================================

INSERT INTO shows
(
    event_id,
    show_datetime,
    status,
    created_at
)
VALUES
(
    1,
    DATE_ADD(NOW(6), INTERVAL 15 DAY),
    'ACTIVE',
    NOW(6)
),
(
    2,
    DATE_ADD(NOW(6), INTERVAL 30 DAY),
    'ACTIVE',
    NOW(6)
),
(
    3,
    DATE_ADD(NOW(6), INTERVAL 20 DAY),
    'ACTIVE',
    NOW(6)
),
(
    4,
    DATE_ADD(NOW(6), INTERVAL 7 DAY),
    'ACTIVE',
    NOW(6)
);


-- ============================================================================
-- 5. TICKET TYPES
-- ============================================================================
INSERT INTO ticket_types
(
    show_id,
    name,
    price,
    total_qty,
    available_qty
)
VALUES
(
    1,
    'General',
    499.00,
    500,
    498
),
(
    1,
    'VIP',
    999.00,
    100,
    100
),
(
    1,
    'Premium',
    1499.00,
    50,
    50
),
(
    2,
    'General',
    799.00,
    1000,
    1000
),
(
    2,
    'VIP',
    1499.00,
    200,
    199   -- Changed from 200 (1 ticket booked)
),
(
    3,
    'Regular',
    699.00,
    800,
    799   -- Changed from 800 (1 ticket booked)
),
(
    3,
    'Fast Track',
    1299.00,
    200,
    200
),
(
    4,
    'Regular',
    299.00,
    300,
    300
),
(
    4,
    'Premium',
    599.00,
    100,
    100
);

-- ============================================================================
-- 6. BOOKINGS
-- ============================================================================

INSERT INTO bookings
(
    booking_reference,
    user_id,
    show_id,
    booking_date,
    expires_at,
    total_amount,
    payment_status,
    status,
    version
)
VALUES
(
    'BK20260001',
    2,
    1,
    NOW(6),
    NULL,
    998.00,
    'PAID',
    'CONFIRMED',
    0
),
(
    'BK20260002',
    3,
    2,
    NOW(6),
    NULL,
    1499.00,
    'PAID',
    'CONFIRMED',
    0
),
(
    'BK20260003',
    2,
    3,
    NOW(6),
    DATE_ADD(NOW(6), INTERVAL 10 MINUTE),
    699.00,
    'PENDING',
    'PENDING',
    0
);


-- ============================================================================
-- 7. BOOKING ITEMS
-- ============================================================================

INSERT INTO booking_items
(
    booking_id,
    ticket_type_id,
    quantity,
    unit_price
)
VALUES
(
    1,
    1,
    2,
    499.00
),
(
    2,
    5,
    1,
    1499.00
),
(
    3,
    6,
    1,
    699.00
);


-- ============================================================================
-- 8. INVOICES
-- ============================================================================

INSERT INTO invoices
(
    invoice_number,
    booking_id,
    user_id,
    subtotal,
    discount,
    total_amount,
    paid_amount,
    balance_amount,
    status,
    invoice_date,
    gateway_order_id,
    version
)
VALUES
(
    'INV20260001',
    1,
    2,
    998.00,
    0.00,
    998.00,
    998.00,
    0.00,
    'PAID',
    NOW(6),
    NULL,
    0
),
(
    'INV20260002',
    2,
    3,
    1499.00,
    0.00,
    1499.00,
    1499.00,
    0.00,
    'PAID',
    NOW(6),
    NULL,
    0
),
(
    'INV20260003',
    3,
    2,
    699.00,
    0.00,
    699.00,
    0.00,
    699.00,
    'UNPAID',
    NOW(6),
    NULL,
    0
);


-- ============================================================================
-- 9. PAYMENTS
-- ============================================================================

INSERT INTO payments
(
    invoice_id,
    amount,
    mode,
    payment_date
)
VALUES
(
    1,
    998.00,
    'UPI',
    NOW(6)
),
(
    2,
    1499.00,
    'CARD',
    NOW(6)
);


-- ============================================================================
-- 10. INVENTORY ITEMS
-- ----------------------------------------------------------------------------
-- available_qty is deliberately total_qty minus whatever section 11 allocates
-- below, so the seeded stock and the seeded allocations agree with each other.
-- ============================================================================

INSERT INTO inventory_items
(
    name,
    description,
    category,
    total_qty,
    available_qty,
    unit_price,
    status,
    created_at,
    version
)
VALUES
(
    'Banquet Chair',
    'Stackable padded banquet chair with fabric cover.',
    'FURNITURE',
    500,
    300,           -- 200 allocated to the corporate event
    45.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Round Table (6 seater)',
    'Foldable 5-foot round table seating six.',
    'FURNITURE',
    80,
    55,            -- 25 allocated
    250.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Line Array Speaker',
    'Powered line-array speaker cabinet, 1000W.',
    'AUDIO_VISUAL',
    24,
    16,            -- 8 allocated
    3500.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Wireless Microphone',
    'Handheld UHF wireless microphone with receiver.',
    'AUDIO_VISUAL',
    40,
    40,
    900.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'LED Par Light',
    'RGBW LED par can with DMX control.',
    'LIGHTING',
    60,
    60,
    650.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Stage Backdrop Drape',
    'Pleated velvet backdrop drape, 3m x 6m.',
    'DECOR',
    20,
    20,
    1200.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Chafing Dish',
    'Stainless steel chafing dish with fuel holder.',
    'CATERING',
    50,
    50,
    400.00,
    'ACTIVE',
    NOW(6),
    0
),
(
    'Fog Machine (retired)',
    'Withdrawn from service after a fault; kept for allocation history.',
    'OTHER',
    4,
    4,
    2200.00,
    'RETIRED',
    NOW(6),
    0
);


-- ============================================================================
-- 11. EVENT INVENTORY ALLOCATIONS
-- ----------------------------------------------------------------------------
-- Event 5 is the INVENTORY-type "Corporate Annual Event" — and inventory may
-- only be allocated to INVENTORY-type events, so every row below points at it.
-- The three ALLOCATED rows match the reduced available_qty values above; the
-- RETURNED row is history and holds no stock, so it does not affect
-- availability.
-- ============================================================================

INSERT INTO event_inventory
(
    event_id,
    inventory_item_id,
    allocated_qty,
    status,
    notes,
    allocated_at,
    released_at
)
VALUES
(
    5,
    1,
    200,
    'ALLOCATED',
    'Main hall seating.',
    NOW(6),
    NULL
),
(
    5,
    2,
    25,
    'ALLOCATED',
    'Dining layout, 6 guests per table.',
    NOW(6),
    NULL
),
(
    5,
    3,
    8,
    'ALLOCATED',
    'Left and right stacks for the main stage.',
    NOW(6),
    NULL
),
(
    5,
    4,
    4,
    'RETURNED',
    'Hand-held mics for the AGM address — returned the same evening.',
    DATE_SUB(NOW(6), INTERVAL 2 DAY),
    DATE_SUB(NOW(6), INTERVAL 1 DAY)
);


-- ============================================================================
-- END OF SEED DATA
-- ============================================================================