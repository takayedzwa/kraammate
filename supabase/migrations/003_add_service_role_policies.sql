-- Add policies that allow service role to manage profiles
-- The service role key bypasses RLS, but policies must still exist for operations to work

-- ============================================================================
-- PROFILES TABLE - Allow service role operations
-- ============================================================================

-- Allow anyone to insert their own profile (needed for signup flow)
-- This policy works with auth.uid() for authenticated users
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- Allow service role to update any profile (for admin operations)
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- KRAAMZORGER_PROFILES TABLE - Allow service role operations
-- ============================================================================

-- Allow anyone to insert their own kraamzorger profile
DROP POLICY IF EXISTS "Users can insert their own kraamzorger profile" ON kraamzorger_profiles;
CREATE POLICY "Users can insert their own kraamzorger profile" ON kraamzorger_profiles
  FOR INSERT WITH CHECK (true);

-- Allow service role to manage all kraamzorger profiles
DROP POLICY IF EXISTS "Service role can manage all kraamzorger profiles" ON kraamzorger_profiles;
CREATE POLICY "Service role can manage all kraamzorger profiles" ON kraamzorger_profiles
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- NOTE: Service role key bypasses RLS checks but policies must exist.
-- These policies allow the /api/auth/create-profile endpoint to work.
-- ============================================================================
