-- Car Show App Database Schema for Neon
-- This script creates all the necessary tables for the car show application

-- Categories table for award categories
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table for car registrations
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    owner_name VARCHAR(255) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    owner_phone VARCHAR(50),
    vehicle_year INTEGER,
    vehicle_make VARCHAR(100) NOT NULL,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_color VARCHAR(50),
    vehicle_description TEXT,
    image_url_1 TEXT,
    image_url_2 TEXT,
    image_url_3 TEXT,
    image_url_4 TEXT,
    image_url_5 TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    qr_code TEXT,
    checked_in BOOLEAN DEFAULT FALSE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table for public voting
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    voter_ip VARCHAR(45),
    voter_session VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vehicle_id, category_id, voter_ip, voter_session)
);

-- Admin awards table for admin-assigned awards
CREATE TABLE IF NOT EXISTS admin_awards (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    award_name VARCHAR(255) NOT NULL,
    notes TEXT,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voting schedule table to control voting periods
CREATE TABLE IF NOT EXISTS voting_schedule (
    id SERIAL PRIMARY KEY,
    voting_open BOOLEAN DEFAULT FALSE,
    voting_start_time TIMESTAMP WITH TIME ZONE,
    voting_end_time TIMESTAMP WITH TIME ZONE,
    results_published BOOLEAN DEFAULT FALSE,
    results_publish_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Best in Show', 'Overall best vehicle at the show'),
    ('Best Classic', 'Best classic/vintage vehicle'),
    ('Best Modern', 'Best modern vehicle'),
    ('Best Custom', 'Best custom modified vehicle'),
    ('People''s Choice', 'Voted by the public')
ON CONFLICT (name) DO NOTHING;

-- Insert default voting schedule (voting closed initially)
INSERT INTO voting_schedule (voting_open, results_published) VALUES (FALSE, FALSE)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_email ON vehicles(owner_email);
CREATE INDEX IF NOT EXISTS idx_vehicles_checked_in ON vehicles(checked_in);
CREATE INDEX IF NOT EXISTS idx_votes_vehicle_category ON votes(vehicle_id, category_id);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_awards_published ON admin_awards(published);
