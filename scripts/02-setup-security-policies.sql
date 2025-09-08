-- Enable Row Level Security on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_schedule ENABLE ROW LEVEL SECURITY;

-- Create a simple role-based security system
-- For now, we'll use email-based admin identification
-- In production, you'd want proper user authentication

-- VEHICLES TABLE POLICIES
-- Allow public read access to approved vehicles
CREATE POLICY "Public can view approved vehicles" ON vehicles
    FOR SELECT USING (approved = true);

-- Allow vehicle owners to view their own vehicles (approved or not)
CREATE POLICY "Owners can view their own vehicles" ON vehicles
    FOR SELECT USING (email = current_setting('app.current_user_email', true));

-- Allow public insert for vehicle registration
CREATE POLICY "Public can register vehicles" ON vehicles
    FOR INSERT WITH CHECK (true);

-- Allow vehicle owners to update their own vehicles (before approval)
CREATE POLICY "Owners can update their own vehicles" ON vehicles
    FOR UPDATE USING (
        email = current_setting('app.current_user_email', true) 
        AND approved = false
    );

-- Allow admins to update any vehicle
CREATE POLICY "Admins can update any vehicle" ON vehicles
    FOR UPDATE USING (
        current_setting('app.current_user_email', true) IN (
            'admin@cruiserfest.com',
            'organizer@cruiserfest.com'
        )
    );

-- VOTES TABLE POLICIES
-- Allow public read access to votes (for results)
CREATE POLICY "Public can view votes" ON votes
    FOR SELECT USING (true);

-- Allow public insert for voting (with email verification)
CREATE POLICY "Public can vote" ON votes
    FOR INSERT WITH CHECK (
        voter_email IS NOT NULL 
        AND voter_email != ''
        AND vehicle_id IS NOT NULL
    );

-- Prevent duplicate votes (handled at application level, but extra protection)
CREATE POLICY "Prevent duplicate votes" ON votes
    FOR INSERT WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM votes 
            WHERE voter_email = NEW.voter_email 
            AND category = NEW.category
        )
    );

-- CATEGORIES TABLE POLICIES
-- Allow public read access to categories
CREATE POLICY "Public can view categories" ON categories
    FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        current_setting('app.current_user_email', true) IN (
            'admin@cruiserfest.com',
            'organizer@cruiserfest.com'
        )
    );

-- ADMIN_AWARDS TABLE POLICIES
-- Allow public read access to published awards
CREATE POLICY "Public can view published awards" ON admin_awards
    FOR SELECT USING (is_published = true);

-- Allow admins to view all awards
CREATE POLICY "Admins can view all awards" ON admin_awards
    FOR SELECT USING (
        current_setting('app.current_user_email', true) IN (
            'admin@cruiserfest.com',
            'organizer@cruiserfest.com'
        )
    );

-- Only admins can manage awards
CREATE POLICY "Admins can manage awards" ON admin_awards
    FOR ALL USING (
        current_setting('app.current_user_email', true) IN (
            'admin@cruiserfest.com',
            'organizer@cruiserfest.com'
        )
    );

-- VOTING_SCHEDULE TABLE POLICIES
-- Allow public read access to voting schedule
CREATE POLICY "Public can view voting schedule" ON voting_schedule
    FOR SELECT USING (true);

-- Only admins can manage voting schedule
CREATE POLICY "Admins can manage voting schedule" ON voting_schedule
    FOR ALL USING (
        current_setting('app.current_user_email', true) IN (
            'admin@cruiserfest.com',
            'organizer@cruiserfest.com'
        )
    );

-- Create indexes for better performance with RLS
CREATE INDEX IF NOT EXISTS idx_vehicles_email ON vehicles(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_approved ON vehicles(approved);
CREATE INDEX IF NOT EXISTS idx_votes_voter_email ON votes(voter_email);
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category);
CREATE INDEX IF NOT EXISTS idx_admin_awards_published ON admin_awards(is_published);

-- Grant necessary permissions to public role
GRANT SELECT ON vehicles TO PUBLIC;
GRANT INSERT ON vehicles TO PUBLIC;
GRANT UPDATE ON vehicles TO PUBLIC;
GRANT SELECT, INSERT ON votes TO PUBLIC;
GRANT SELECT ON categories TO PUBLIC;
GRANT SELECT ON admin_awards TO PUBLIC;
GRANT SELECT ON voting_schedule TO PUBLIC;

-- Create a function to set the current user context
CREATE OR REPLACE FUNCTION set_current_user(user_email TEXT)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_email', user_email, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION set_current_user(TEXT) TO PUBLIC;

COMMIT;
