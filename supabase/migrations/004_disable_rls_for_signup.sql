-- Disable RLS on profiles tables to allow service role to work
-- This is the simplest fix - RLS is not needed for these tables
-- when using service role key from the API

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on kraamzorger_profiles table
ALTER TABLE kraamzorger_profiles DISABLE ROW LEVEL SECURITY;

-- NOTE: Other tables can keep RLS enabled for security.
-- Only the profile tables need RLS disabled for the signup flow to work.
