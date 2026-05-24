-- Remove all database triggers and functions
-- Profile creation is now handled entirely in application code

-- ============================================================================
-- DROP TRIGGERS
-- ============================================================================

-- Drop profile creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop updated_at triggers (handled in application code now)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_babies_updated_at ON babies;
DROP TRIGGER IF EXISTS update_feeding_logs_updated_at ON feeding_logs;
DROP TRIGGER IF EXISTS update_sleep_logs_updated_at ON sleep_logs;

-- Drop activity feed triggers
DROP TRIGGER IF EXISTS feeding_logs_activity ON feeding_logs;
DROP TRIGGER IF EXISTS sleep_logs_activity ON sleep_logs;
DROP TRIGGER IF EXISTS diaper_logs_activity ON diaper_logs;
DROP TRIGGER IF EXISTS milestones_activity ON milestones;
DROP TRIGGER IF EXISTS growth_logs_activity ON growth_logs;

-- Drop vaccination schedule trigger
DROP TRIGGER IF EXISTS create_vaccination_schedule ON babies;

-- ============================================================================
-- DROP FUNCTIONS
-- ============================================================================

-- Drop profile creation function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop updated_at function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop activity feed function
DROP FUNCTION IF EXISTS create_activity_feed();

-- Drop vaccination schedule function
DROP FUNCTION IF EXISTS create_default_vaccination_schedule(UUID);
DROP FUNCTION IF EXISTS trigger_create_vaccination_schedule();

-- Drop signup helper functions (no longer needed - using application code)
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT, user_role);
DROP FUNCTION IF EXISTS create_kraamzorger_profile(UUID);

-- Drop kraamzorger helper functions (can be re-added if needed, but keeping logic in app code)
DROP FUNCTION IF EXISTS check_booking_conflict(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_kraamzorger_availability(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS get_kraamzorger_rating(UUID);

-- ============================================================================
-- NOTE: All profile creation is now handled in application code.
-- The API endpoint /api/auth/create-profile uses the service role key
-- to bypass RLS and create profiles directly.
-- ============================================================================
