# Event & Inventory Management System
## Database Backup & Restore Guide

Database Name:

`event_inventory`

Database Engine:

`MySQL`

---

## 1. Database Structure

The database contains the following tables:

1. `users`
2. `otp_tokens`
3. `events`
4. `shows`
5. `ticket_types`
6. `bookings`
7. `booking_items`
8. `invoices`
9. `payments`

---

## 2. Prerequisites

Before restoring the database, make sure:

- MySQL Server is installed and running.
- MySQL username and password are available.
- The project database scripts are available.
- MySQL Workbench or MySQL CLI can be used.

---

## 3. Create Database

Run:

```sql
CREATE DATABASE IF NOT EXISTS event_inventory;
USE event_inventory;