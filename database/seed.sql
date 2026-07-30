```sql
-- ============================================================
-- Event & Inventory Management System
-- seed.sql
-- Sample / Test Data
-- ============================================================

USE event_booking_db;


-- ============================================================
-- 1. USERS
-- ============================================================

INSERT INTO users
(
    name,
    mobile,
    email,
    profile_image,
    role,
    is_verified
)
VALUES
(
    'Achal Chopade',
    '9876543210',
    'achal@gmail.com',
    NULL,
    'USER',
    TRUE
),
(
    'Tanmay Kohad',
    '9876543211',
    'tanmay@gmail.com',
    NULL,
    'USER',
    TRUE
),
(
    'Yugam Deogade',
    '9876543212',
    'yugam@gmail.com',
    NULL,
    'USER',
    TRUE
),
(
    'Admin User',
    '9876543213',
    'admin@eventsystem.com',
    NULL,
    'ADMIN',
    TRUE
),
(
    'Shreyash Zanzad',
    '9876543214',
    'shreyash@gmail.com',
    NULL,
    'USER',
    TRUE
);


-- ============================================================
-- 2. OTP
-- ============================================================

INSERT INTO otp
(
    mobile,
    otp,
    expires_at,
    verified
)
VALUES
(
    '9876543210',
    '123456',
    DATE_ADD(NOW(), INTERVAL 10 MINUTE),
    TRUE
),
(
    '9876543211',
    '456789',
    DATE_ADD(NOW(), INTERVAL 10 MINUTE),
    FALSE
);


-- ============================================================
-- 3. EVENTS
-- ============================================================

INSERT INTO events
(
    title,
    description,
    category,
    organizer_name,
    banner_image,
    venue,
    city,
    address,
    latitude,
    longitude,
    status
)
VALUES
(
    'Pune Music Festival 2026',
    'A grand live music festival featuring popular artists.',
    'Music',
    'Event Management Pvt Ltd',
    'music-festival.jpg',
    'Grand Arena',
    'Pune',
    'Baner Road, Pune, Maharashtra',
    18.5590,
    73.7868,
    'PUBLISHED'
),
(
    'Tech Conference 2026',
    'Technology conference covering AI, Cloud and Software Development.',
    'Technology',
    'Tech Events India',
    'tech-conference.jpg',
    'Convention Centre',
    'Pune',
    'Hinjewadi, Pune, Maharashtra',
    18.5913,
    73.7389,
    'PUBLISHED'
),
(
    'Stand-Up Comedy Night',
    'An entertaining comedy night with popular stand-up comedians.',
    'Comedy',
    'Laugh Factory',
    'comedy-night.jpg',
    'Phoenix Arena',
    'Pune',
    'Viman Nagar, Pune, Maharashtra',
    18.5679,
    73.9143,
    'PUBLISHED'
),
(
    'Corporate Sports Day',
    'Inter-company sports and recreational event.',
    'Sports',
    'Corporate Events India',
    'sports-day.jpg',
    'Sports Complex',
    'Nagpur',
    'Wardha Road, Nagpur, Maharashtra',
    21.1458,
    79.0882,
    'DRAFT'
);


-- ============================================================
-- 4. SHOWS
-- ============================================================

INSERT INTO shows
(
    event_id,
    show_date,
    show_time,
    venue,
    total_seats,
    available_seats,
    status
)
VALUES
(
    1,
    '2026-08-15',
    '18:00:00',
    'Grand Arena',
    1000,
    1000,
    'ACTIVE'
),
(
    1,
    '2026-08-16',
    '18:00:00',
    'Grand Arena',
    1000,
    1000,
    'ACTIVE'
),
(
    2,
    '2026-08-22',
    '09:30:00',
    'Convention Centre',
    500,
    500,
    'ACTIVE'
),
(
    3,
    '2026-08-30',
    '19:30:00',
    'Phoenix Arena',
    750,
    750,
    'ACTIVE'
),
(
    4,
    '2026-09-05',
    '10:00:00',
    'Sports Complex',
    1000,
    1000,
    'ACTIVE'
);


-- ============================================================
-- 5. TICKET TYPES
-- ============================================================

-- Show 1: Music Festival - VIP, Premium, Regular

INSERT INTO ticket_types
(
    show_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
)
VALUES
(
    1,
    'VIP',
    2500.00,
    100,
    100,
    'VIP seating with premium access.'
),
(
    1,
    'Premium',
    1500.00,
    200,
    200,
    'Premium seating area.'
),
(
    1,
    'Regular',
    1000.00,
    700,
    700,
    'Regular audience seating.'
);


-- Show 2: Music Festival

INSERT INTO ticket_types
(
    show_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
)
VALUES
(
    2,
    'VIP',
    2500.00,
    100,
    100,
    'VIP seating with premium access.'
),
(
    2,
    'Regular',
    1000.00,
    900,
    900,
    'Regular audience seating.'
);


-- Show 3: Tech Conference

INSERT INTO ticket_types
(
    show_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
)
VALUES
(
    3,
    'Early Bird',
    999.00,
    100,
    100,
    'Early bird conference pass.'
),
(
    3,
    'Standard',
    1499.00,
    300,
    300,
    'Standard conference pass.'
),
(
    3,
    'Premium',
    2499.00,
    100,
    100,
    'Premium conference pass with additional benefits.'
);


-- Show 4: Comedy Night

INSERT INTO ticket_types
(
    show_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
)
VALUES
(
    4,
    'VIP',
    1800.00,
    100,
    100,
    'VIP comedy show seating.'
),
(
    4,
    'Regular',
    800.00,
    650,
    650,
    'Regular comedy show seating.'
);


-- Show 5: Sports Day

INSERT INTO ticket_types
(
    show_id,
    ticket_name,
    price,
    total_tickets,
    available_tickets,
    description
)
VALUES
(
    5,
    'General',
    500.00,
    1000,
    1000,
    'General entry.'
);


-- ============================================================
-- 6. INVENTORY
-- ============================================================

INSERT INTO inventory
(
    item_name,
    category,
    quantity,
    available_quantity,
    supplier,
    unit_price,
    status
)
VALUES
(
    'Plastic Chair',
    'Furniture',
    1000,
    1000,
    'ABC Furniture Suppliers',
    150.00,
    'AVAILABLE'
),
(
    'Round Table',
    'Furniture',
    100,
    100,
    'XYZ Furniture Suppliers',
    800.00,
    'AVAILABLE'
),
(
    'Speaker',
    'Audio',
    30,
    30,
    'Sound Solutions',
    5000.00,
    'AVAILABLE'
),
(
    'Microphone',
    'Audio',
    20,
    20,
    'Sound Solutions',
    2500.00,
    'AVAILABLE'
),
(
    'Projector',
    'Electronics',
    10,
    10,
    'Tech Suppliers',
    25000.00,
    'AVAILABLE'
),
(
    'LED Display',
    'Electronics',
    5,
    5,
    'Digital Display Pvt Ltd',
    50000.00,
    'AVAILABLE'
),
(
    'Stage Light',
    'Lighting',
    50,
    50,
    'Light House Suppliers',
    3500.00,
    'AVAILABLE'
),
(
    'Tent',
    'Infrastructure',
    20,
    20,
    'Event Infrastructure Ltd',
    15000.00,
    'AVAILABLE'
);


-- ============================================================
-- 7. EVENT INVENTORY
-- ============================================================

INSERT INTO event_inventory
(
    event_id,
    inventory_id,
    assigned_quantity,
    returned_quantity,
    remarks
)
VALUES
(
    1,
    1,
    500,
    0,
    'Audience seating'
),
(
    1,
    2,
    30,
    0,
    'Food and refreshment area'
),
(
    1,
    3,
    10,
    0,
    'Main stage sound system'
),
(
    1,
    4,
    6,
    0,
    'Stage microphones'
),
(
    1,
    7,
    20,
    0,
    'Stage lighting'
),
(
    2,
    5,
    3,
    0,
    'Conference presentation'
),
(
    2,
    6,
    2,
    0,
    'Main presentation screens'
);


-- ============================================================
-- 8. BOOKINGS
-- ============================================================

INSERT INTO bookings
(
    booking_code,
    user_id,
    event_id,
    show_id,
    ticket_type_id,
    quantity,
    total_amount,
    payment_status,
    booking_status,
    qr_code
)
VALUES
(
    'BK20260001',
    1,
    1,
    1,
    1,
    2,
    5000.00,
    'PAID',
    'CONFIRMED',
    'QR-BK20260001'
),
(
    'BK20260002',
    2,
    1,
    1,
    3,
    3,
    3000.00,
    'PAID',
    'CONFIRMED',
    'QR-BK20260002'
),
(
    'BK20260003',
    3,
    2,
    3,
    6,
    1,
    999.00,
    'PAID',
    'CONFIRMED',
    'QR-BK20260003'
),
(
    'BK20260004',
    5,
    3,
    4,
    9,
    2,
    1600.00,
    'PENDING',
    'PENDING',
    NULL
);


-- ============================================================
-- 9. UPDATE TICKET AVAILABILITY
-- ============================================================

-- Booking 1:
-- 2 VIP tickets for Show 1

UPDATE ticket_types
SET available_tickets = available_tickets - 2
WHERE ticket_type_id = 1;

UPDATE shows
SET available_seats = available_seats - 2
WHERE show_id = 1;


-- Booking 2:
-- 3 Regular tickets for Show 1

UPDATE ticket_types
SET available_tickets = available_tickets - 3
WHERE ticket_type_id = 3;

UPDATE shows
SET available_seats = available_seats - 3
WHERE show_id = 1;


-- Booking 3:
-- 1 Early Bird ticket for Show 3

UPDATE ticket_types
SET available_tickets = available_tickets - 1
WHERE ticket_type_id = 6;

UPDATE shows
SET available_seats = available_seats - 1
WHERE show_id = 3;


-- Booking 4:
-- 2 VIP tickets for Show 4

UPDATE ticket_types
SET available_tickets = available_tickets - 2
WHERE ticket_type_id = 9;

UPDATE shows
SET available_seats = available_seats - 2
WHERE show_id = 4;


-- ============================================================
-- COMPLETE
-- ============================================================

SELECT 'Seed data inserted successfully!' AS message;

