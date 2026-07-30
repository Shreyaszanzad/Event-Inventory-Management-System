```sql
-- ============================================================
-- EVENT & INVENTORY MANAGEMENT SYSTEM
-- schema.sql
-- MySQL 8+
-- ============================================================


-- ============================================================
-- 1. CREATE DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_booking_db;

USE event_booking_db;


-- ============================================================
-- 2. REMOVE OLD TABLES
-- ============================================================
-- This allows you to run schema.sql again during development.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS event_inventory;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS ticket_types;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS otp;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 3. USERS TABLE
-- ============================================================

CREATE TABLE users (

    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    name VARCHAR(100) NOT NULL,

    mobile VARCHAR(15) NOT NULL UNIQUE,

    email VARCHAR(100) UNIQUE,

    profile_image VARCHAR(255),

    role ENUM('USER', 'ADMIN')
        NOT NULL DEFAULT 'USER',

    is_verified BOOLEAN
        NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

);


-- ============================================================
-- 4. OTP TABLE
-- ============================================================

CREATE TABLE otp (

    otp_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    mobile VARCHAR(15) NOT NULL,

    otp VARCHAR(6) NOT NULL,

    expires_at DATETIME NOT NULL,

    verified BOOLEAN
        NOT NULL DEFAULT FALSE,

    INDEX idx_otp_mobile (mobile),

    INDEX idx_otp_expires_at (expires_at)

);


-- ============================================================
-- 5. EVENTS TABLE
-- ============================================================

CREATE TABLE events (

    event_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    category VARCHAR(100) NOT NULL,

    organizer_name VARCHAR(100) NOT NULL,

    banner_image VARCHAR(255),

    venue VARCHAR(200) NOT NULL,

    city VARCHAR(100) NOT NULL,

    address TEXT,

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    status ENUM(
        'DRAFT',
        'PUBLISHED',
        'CANCELLED',
        'COMPLETED'
    )
    NOT NULL DEFAULT 'DRAFT',

    created_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_events_category (category),

    INDEX idx_events_city (city),

    INDEX idx_events_status (status)

);


-- ============================================================
-- 6. SHOWS TABLE
-- ============================================================

CREATE TABLE shows (

    show_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    event_id BIGINT NOT NULL,

    show_date DATE NOT NULL,

    show_time TIME NOT NULL,

    venue VARCHAR(200),

    total_seats INT NOT NULL,

    available_seats INT NOT NULL,

    status ENUM(
        'ACTIVE',
        'CANCELLED',
        'COMPLETED'
    )
    NOT NULL DEFAULT 'ACTIVE',


    -- Foreign Key
    CONSTRAINT fk_shows_event

        FOREIGN KEY (event_id)

        REFERENCES events(event_id)

        ON DELETE CASCADE

        ON UPDATE CASCADE,


    -- Seat validation
    CONSTRAINT chk_shows_total_seats

        CHECK (total_seats >= 0),


    CONSTRAINT chk_shows_available_seats

        CHECK (
            available_seats >= 0
            AND available_seats <= total_seats
        ),


    INDEX idx_shows_event_id (event_id),

    INDEX idx_shows_date (show_date),

    INDEX idx_shows_status (status)

);


-- ============================================================
-- 7. TICKET TYPES TABLE
-- ============================================================

CREATE TABLE ticket_types (

    ticket_type_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    show_id BIGINT NOT NULL,

    ticket_name VARCHAR(50) NOT NULL,

    price DECIMAL(10,2)
        NOT NULL DEFAULT 0.00,

    total_tickets INT NOT NULL,

    available_tickets INT NOT NULL,

    description TEXT,


    -- Foreign Key
    CONSTRAINT fk_ticket_types_show

        FOREIGN KEY (show_id)

        REFERENCES shows(show_id)

        ON DELETE CASCADE

        ON UPDATE CASCADE,


    -- Price validation
    CONSTRAINT chk_ticket_price

        CHECK (price >= 0),


    -- Total ticket validation
    CONSTRAINT chk_ticket_total

        CHECK (total_tickets >= 0),


    -- Available ticket validation
    CONSTRAINT chk_ticket_available

        CHECK (
            available_tickets >= 0
            AND available_tickets <= total_tickets
        ),


    INDEX idx_ticket_types_show_id (show_id)

);


-- ============================================================
-- 8. BOOKINGS TABLE
-- ============================================================

CREATE TABLE bookings (

    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    booking_code VARCHAR(30)
        NOT NULL UNIQUE,

    user_id BIGINT NOT NULL,

    event_id BIGINT NOT NULL,

    show_id BIGINT NOT NULL,

    ticket_type_id BIGINT NOT NULL,

    quantity INT NOT NULL,

    total_amount DECIMAL(10,2)
        NOT NULL DEFAULT 0.00,


    payment_status ENUM(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
    )
    NOT NULL DEFAULT 'PENDING',


    booking_status ENUM(
        'PENDING',
        'CONFIRMED',
        'CANCELLED'
    )
    NOT NULL DEFAULT 'PENDING',


    qr_code VARCHAR(255),


    booked_at TIMESTAMP
        NOT NULL DEFAULT CURRENT_TIMESTAMP,


    -- User relationship
    CONSTRAINT fk_bookings_user

        FOREIGN KEY (user_id)

        REFERENCES users(user_id)

        ON DELETE RESTRICT

        ON UPDATE CASCADE,


    -- Event relationship
    CONSTRAINT fk_bookings_event

        FOREIGN KEY (event_id)

        REFERENCES events(event_id)

        ON DELETE RESTRICT

        ON UPDATE CASCADE,


    -- Show relationship
    CONSTRAINT fk_bookings_show

        FOREIGN KEY (show_id)

        REFERENCES shows(show_id)

        ON DELETE RESTRICT

        ON UPDATE CASCADE,


    -- Ticket relationship
    CONSTRAINT fk_bookings_ticket_type

        FOREIGN KEY (ticket_type_id)

        REFERENCES ticket_types(ticket_type_id)

        ON DELETE RESTRICT

        ON UPDATE CASCADE,


    -- Quantity validation
    CONSTRAINT chk_booking_quantity

        CHECK (quantity > 0),


    -- Amount validation
    CONSTRAINT chk_booking_amount

        CHECK (total_amount >= 0),


    INDEX idx_bookings_user_id (user_id),

    INDEX idx_bookings_event_id (event_id),

    INDEX idx_bookings_show_id (show_id),

    INDEX idx_bookings_ticket_type_id (ticket_type_id),

    INDEX idx_bookings_payment_status (payment_status),

    INDEX idx_bookings_booking_status (booking_status),

    INDEX idx_bookings_booked_at (booked_at)

);


-- ============================================================
-- 9. INVENTORY TABLE
-- ============================================================

CREATE TABLE inventory (

    inventory_id BIGINT PRIMARY KEY AUTO_INCREMENT,

    item_name VARCHAR(100) NOT NULL,

    category VARCHAR(100) NOT NULL,

    quantity INT NOT NULL DEFAULT 0,

    available_quantity INT NOT NULL DEFAULT 0,

    supplier VARCHAR(100),

    unit_price DECIMAL(10,2)
        NOT NULL DEFAULT 0.00,


    status ENUM(
        'AVAILABLE',
        'ASSIGNED',
        'MAINTENANCE',
        'DAMAGED'
    )
    NOT NULL DEFAULT 'AVAILABLE',


    -- Quantity validation
    CONSTRAINT chk_inventory_quantity

        CHECK (quantity >= 0),


    -- Available quantity validation
    CONSTRAINT chk_inventory_available_quantity

        CHECK (
            available_quantity >= 0
            AND available_quantity <= quantity
        ),


    -- Price validation
    CONSTRAINT chk_inventory_unit_price

        CHECK (unit_price >= 0),


    INDEX idx_inventory_category (category),

    INDEX idx_inventory_status (status)

);


-- ============================================================
-- 10. EVENT INVENTORY TABLE
-- ============================================================

CREATE TABLE event_inventory (

    event_inventory_id BIGINT
        PRIMARY KEY AUTO_INCREMENT,

    event_id BIGINT NOT NULL,

    inventory_id BIGINT NOT NULL,

    assigned_quantity INT NOT NULL,

    returned_quantity INT
        NOT NULL DEFAULT 0,

    remarks TEXT,


    -- Event relationship
    CONSTRAINT fk_event_inventory_event

        FOREIGN KEY (event_id)

        REFERENCES events(event_id)

        ON DELETE CASCADE

        ON UPDATE CASCADE,


    -- Inventory relationship
    CONSTRAINT fk_event_inventory_inventory

        FOREIGN KEY (inventory_id)

        REFERENCES inventory(inventory_id)

        ON DELETE RESTRICT

        ON UPDATE CASCADE,


    -- Assigned quantity validation
    CONSTRAINT chk_event_inventory_assigned

        CHECK (assigned_quantity > 0),


    -- Returned quantity validation
    CONSTRAINT chk_event_inventory_returned

        CHECK (
            returned_quantity >= 0
            AND returned_quantity <= assigned_quantity
        ),


    -- Same inventory cannot be assigned twice
    -- to the same event
    CONSTRAINT uq_event_inventory

        UNIQUE (event_id, inventory_id),


    INDEX idx_event_inventory_event_id (event_id),

    INDEX idx_event_inventory_inventory_id (inventory_id)

);


-- ============================================================
-- 11. VERIFY TABLES
-- ============================================================

SHOW TABLES;


-- ============================================================
-- 12. VERIFY RELATIONSHIPS
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
-- SCHEMA CREATION COMPLETE
-- ============================================================
```
