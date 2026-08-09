-- ============================================================================
-- Event & Inventory Management System
-- Authoritative Database Schema
-- Database: event_inventory
-- ============================================================================

CREATE DATABASE IF NOT EXISTS event_inventory;
USE event_inventory;

-- ============================================================================
-- AUTH
-- ============================================================================

CREATE TABLE users (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255),
    phone         VARCHAR(15),
    email         VARCHAR(255),
    password_hash VARCHAR(255),
    role          ENUM('ADMIN','USER') NOT NULL,
    status        ENUM('ACTIVE','INACTIVE') NOT NULL,
    created_at    DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT uk_users_phone UNIQUE (phone),
    CONSTRAINT uk_users_email UNIQUE (email),

    CONSTRAINT chk_users_phone_length
        CHECK (phone IS NULL OR CHAR_LENGTH(phone) BETWEEN 10 AND 15)
) ENGINE=InnoDB;


CREATE TABLE otp_tokens (
    id         BIGINT NOT NULL AUTO_INCREMENT,
    phone      VARCHAR(15) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    used       BIT NOT NULL,
    attempts   INTEGER NOT NULL,
    created_at DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT chk_otp_attempts
        CHECK (attempts >= 0)
) ENGINE=InnoDB;


-- ============================================================================
-- CATALOG
-- ============================================================================

CREATE TABLE events (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    type         ENUM('INVENTORY','TICKETED') NOT NULL,
    category     ENUM('AMUSEMENT','COMEDY','EVENT','MOVIE'),
    venue_name   VARCHAR(255),
    city         VARCHAR(255),
    poster_url   VARCHAR(255),
    start_time   DATETIME(6),
    status       VARCHAR(20) NOT NULL,
    created_by   BIGINT,
    created_at   DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT chk_events_title
        CHECK (CHAR_LENGTH(TRIM(title)) > 0)
) ENGINE=InnoDB;


CREATE TABLE shows (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    event_id      BIGINT NOT NULL,
    show_datetime DATETIME(6) NOT NULL,
    status        VARCHAR(20) NOT NULL,
    created_at    DATETIME(6) NOT NULL,

    PRIMARY KEY (id)
) ENGINE=InnoDB;


CREATE TABLE ticket_types (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    show_id        BIGINT NOT NULL,
    name           VARCHAR(255) NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    total_qty      INTEGER NOT NULL,
    available_qty  INTEGER NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT chk_ticket_price
        CHECK (price >= 0),

    CONSTRAINT chk_ticket_total_qty
        CHECK (total_qty >= 0),

    CONSTRAINT chk_ticket_available_qty
        CHECK (available_qty >= 0),

    CONSTRAINT chk_ticket_available_not_greater
        CHECK (available_qty <= total_qty)
) ENGINE=InnoDB;


-- ============================================================================
-- BOOKING
-- ============================================================================

CREATE TABLE bookings (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    booking_reference VARCHAR(20) NOT NULL,
    user_id           BIGINT NOT NULL,
    show_id           BIGINT NOT NULL,
    booking_date      DATETIME(6) NOT NULL,
    expires_at        DATETIME(6),
    total_amount      DECIMAL(10,2) NOT NULL,
    payment_status    ENUM('PAID','PENDING','REFUNDED') NOT NULL,
    status            ENUM('CANCELLED','CONFIRMED','EXPIRED','PENDING') NOT NULL,
    version           BIGINT,

    PRIMARY KEY (id),

    CONSTRAINT uk_bookings_reference
        UNIQUE (booking_reference),

    CONSTRAINT chk_booking_total_amount
        CHECK (total_amount >= 0),

    CONSTRAINT chk_booking_version
        CHECK (version IS NULL OR version >= 0)
) ENGINE=InnoDB;


CREATE TABLE booking_items (
    id             BIGINT NOT NULL AUTO_INCREMENT,
    booking_id     BIGINT NOT NULL,
    ticket_type_id BIGINT NOT NULL,
    quantity       INTEGER NOT NULL,
    unit_price     DECIMAL(10,2) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT chk_booking_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_booking_item_unit_price
        CHECK (unit_price >= 0)
) ENGINE=InnoDB;


-- ============================================================================
-- BILLING
-- ============================================================================

CREATE TABLE invoices (
    id               BIGINT NOT NULL AUTO_INCREMENT,
    invoice_number   VARCHAR(20) NOT NULL,
    booking_id       BIGINT NOT NULL,
    user_id          BIGINT NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
    discount         DECIMAL(10,2) NOT NULL,
    total_amount     DECIMAL(10,2) NOT NULL,
    paid_amount      DECIMAL(10,2) NOT NULL,
    balance_amount   DECIMAL(10,2) NOT NULL,
    status           ENUM('PAID','PARTIALLY_PAID','UNPAID') NOT NULL,
    invoice_date     DATETIME(6) NOT NULL,
    gateway_order_id VARCHAR(255),
    version          BIGINT,

    PRIMARY KEY (id),

    CONSTRAINT uk_invoices_number
        UNIQUE (invoice_number),

    CONSTRAINT uk_invoices_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_invoice_subtotal
        CHECK (subtotal >= 0),

    CONSTRAINT chk_invoice_discount
        CHECK (discount >= 0),

    CONSTRAINT chk_invoice_total
        CHECK (total_amount >= 0),

    CONSTRAINT chk_invoice_paid
        CHECK (paid_amount >= 0),

    CONSTRAINT chk_invoice_balance
        CHECK (balance_amount >= 0),

    CONSTRAINT chk_invoice_amounts
        CHECK (paid_amount + balance_amount = total_amount),

    CONSTRAINT chk_invoice_version
        CHECK (version IS NULL OR version >= 0)
) ENGINE=InnoDB;


CREATE TABLE payments (
    id           BIGINT NOT NULL AUTO_INCREMENT,
    invoice_id   BIGINT NOT NULL,
    amount       DECIMAL(10,2) NOT NULL,
    mode         ENUM('CARD','CASH','NETBANKING','ONLINE','UPI') NOT NULL,
    payment_date DATETIME(6) NOT NULL,

    PRIMARY KEY (id),

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0)
) ENGINE=InnoDB;


-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

ALTER TABLE shows
    ADD CONSTRAINT fk_shows_event
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE ticket_types
    ADD CONSTRAINT fk_tickets_show
    FOREIGN KEY (show_id)
    REFERENCES shows(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_show
    FOREIGN KEY (show_id)
    REFERENCES shows(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE booking_items
    ADD CONSTRAINT fk_bookingitems_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;


ALTER TABLE booking_items
    ADD CONSTRAINT fk_bookingitems_ticket
    FOREIGN KEY (ticket_type_id)
    REFERENCES ticket_types(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE invoices
    ADD CONSTRAINT fk_invoices_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE payments
    ADD CONSTRAINT fk_payments_invoice
    FOREIGN KEY (invoice_id)
    REFERENCES invoices(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;


-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_otp_phone
    ON otp_tokens (phone);

CREATE INDEX idx_events_type
    ON events (type);

CREATE INDEX idx_events_category
    ON events (category);

CREATE INDEX idx_shows_event
    ON shows (event_id);

CREATE INDEX idx_ticket_types_show
    ON ticket_types (show_id);

CREATE INDEX idx_bookings_user
    ON bookings (user_id);

CREATE INDEX idx_bookings_show
    ON bookings (show_id);

CREATE INDEX idx_bookings_status
    ON bookings (status);

CREATE INDEX idx_booking_items_booking
    ON booking_items (booking_id);

CREATE INDEX idx_invoices_booking
    ON invoices (booking_id);

CREATE INDEX idx_invoices_gateway_order
    ON invoices (gateway_order_id);

CREATE INDEX idx_payments_invoice
    ON payments (invoice_id);


-- ============================================================================
-- INVENTORY
-- ----------------------------------------------------------------------------
-- Physical assets the company owns (chairs, speakers, drapes) and their
-- allocation to events. Stock works exactly like ticket_types: total_qty is
-- what we own, available_qty is what is not currently out on an event.
-- ============================================================================

CREATE TABLE inventory_items (
    id            BIGINT NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255) NOT NULL,
    description   TEXT,
    category      ENUM('AUDIO_VISUAL','CATERING','DECOR','FURNITURE','LIGHTING','OTHER') NOT NULL,
    total_qty     INTEGER NOT NULL,
    available_qty INTEGER NOT NULL,
    unit_price    DECIMAL(10,2) NOT NULL,
    status        ENUM('ACTIVE','RETIRED') NOT NULL,
    created_at    DATETIME(6) NOT NULL,
    version       BIGINT,

    PRIMARY KEY (id),

    CONSTRAINT chk_inventory_name
        CHECK (CHAR_LENGTH(TRIM(name)) > 0),

    CONSTRAINT chk_inventory_total_qty
        CHECK (total_qty >= 0),

    CONSTRAINT chk_inventory_available_qty
        CHECK (available_qty >= 0),

    CONSTRAINT chk_inventory_available_not_greater
        CHECK (available_qty <= total_qty),

    CONSTRAINT chk_inventory_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_inventory_version
        CHECK (version IS NULL OR version >= 0)
) ENGINE=InnoDB;


CREATE TABLE event_inventory (
    id                BIGINT NOT NULL AUTO_INCREMENT,
    event_id          BIGINT NOT NULL,
    inventory_item_id BIGINT NOT NULL,
    allocated_qty     INTEGER NOT NULL,
    status            ENUM('ALLOCATED','CANCELLED','RETURNED') NOT NULL,
    notes             VARCHAR(500),
    allocated_at      DATETIME(6) NOT NULL,
    released_at       DATETIME(6),

    PRIMARY KEY (id),

    -- One row per item per event: raising the quantity is an UPDATE, not a
    -- second allocation. Keeps "what does this event hold?" a lookup, not a SUM.
    CONSTRAINT uk_event_inventory_item
        UNIQUE (event_id, inventory_item_id),

    CONSTRAINT chk_event_inventory_qty
        CHECK (allocated_qty > 0),

    -- A released row must carry its timestamp, and a live one must not.
    CONSTRAINT chk_event_inventory_released_at
        CHECK ((status = 'ALLOCATED' AND released_at IS NULL)
               OR (status <> 'ALLOCATED' AND released_at IS NOT NULL))
) ENGINE=InnoDB;


ALTER TABLE event_inventory
    ADD CONSTRAINT fk_event_inventory_event
    FOREIGN KEY (event_id)
    REFERENCES events(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


ALTER TABLE event_inventory
    ADD CONSTRAINT fk_event_inventory_item
    FOREIGN KEY (inventory_item_id)
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;


CREATE INDEX idx_inventory_category
    ON inventory_items (category);

CREATE INDEX idx_inventory_status
    ON inventory_items (status);

CREATE INDEX idx_event_inventory_event
    ON event_inventory (event_id);

CREATE INDEX idx_event_inventory_item
    ON event_inventory (inventory_item_id);


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================