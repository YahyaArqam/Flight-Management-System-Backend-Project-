-- Flight Management System Core SQL Schema
-- Run this in your Supabase SQL Editor

-- Disable notice for clean setup
SET client_min_messages TO WARNING;

-- 1. ENUMS for state management
CREATE TYPE flight_status AS ENUM ('SCHEDULED', 'DELAYED', 'CANCELLED', 'DEPARTED');
CREATE TYPE booking_status AS ENUM ('HOLD', 'CONFIRMED', 'CANCELLED');
CREATE TYPE refund_status AS ENUM ('NONE', 'PENDING', 'PROCESSED', 'FAILED', 'MANUAL_REVIEW');
CREATE TYPE waitlist_status AS ENUM ('WAITING', 'PROMOTED', 'EXPIRED');
CREATE TYPE fare_type AS ENUM ('BASIC_ECONOMY', 'FLEXIBLE', 'BUSINESS', 'FIRST');

-- 2. FLIGHTS TABLE
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    status flight_status NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Postgres Invariant: departure must be before arrival
    CONSTRAINT valid_times CHECK (departure_time < arrival_time),
    -- Approximation invariant: prevent duplicate flight number on same datetime
    CONSTRAINT unique_daily_flight UNIQUE (flight_number, departure_time) 
);

-- 3. SEAT CLASSES / INVENTORY TABLE
CREATE TABLE flight_seat_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    fare_type fare_type NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats >= 0),
    booked_seats INT NOT NULL DEFAULT 0 CHECK (booked_seats >= 0),
    held_seats INT NOT NULL DEFAULT 0 CHECK (held_seats >= 0),
    overbook_buffer INT NOT NULL DEFAULT 0 CHECK (overbook_buffer >= 0),
    
    -- CRITICAL Postgres Invariant: Prevents overselling at the database level!
    -- Even under massive load, the DB will reject concurrent requests that exceed this.
    CONSTRAINT no_oversell CHECK ((booked_seats + held_seats) <= (total_seats + overbook_buffer)),
    UNIQUE (flight_id, fare_type)
);

-- 4. PASSENGERS TABLE (simplified representation of customers)
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    loyalty_tier INT DEFAULT 0
);

-- 5. BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES passengers(id),
    fare_type fare_type NOT NULL,
    status booking_status NOT NULL DEFAULT 'HOLD',
    idempotency_key TEXT UNIQUE, -- Prevents duplicate booking requests/payments
    hold_expires_at TIMESTAMPTZ, -- Checked by an automated process (or upon query)
    price_paid DECIMAL(10, 2),
    refund_status refund_status DEFAULT 'NONE',
    refund_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: If it's a HOLD, it must have an expiration
    CONSTRAINT valid_hold CHECK (status != 'HOLD' OR hold_expires_at IS NOT NULL)
);

-- 6. WAITLISTS TABLE
CREATE TABLE waitlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES passengers(id),
    fare_type fare_type NOT NULL,
    status waitlist_status NOT NULL DEFAULT 'WAITING',
    priority_score INT DEFAULT 0, -- Loyalty tier + fare type score
    created_at TIMESTAMPTZ DEFAULT NOW(),
    promoted_at TIMESTAMPTZ,
    -- Prevent duplicate waitlist entries for same flight
    UNIQUE (flight_id, passenger_id)
);

-- 7. AUDIT LOGS (Captures who changed what on the flight)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL, -- e.g., 'flights', 'flight_seat_classes'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT, -- email or ID of admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Utilities (Trigger to auto-update 'updated_at')
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flights_updated_at BEFORE UPDATE ON flights FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Note on Row Level Security (RLS)
-- Since both FastAPI and n8n act as backend services, they will utilize the Postgres Service Role Key
-- which inherently bypasses RLS rules, leaving the control securely in our application logic.
