# Kraamzorger Platform Setup

## IMPORTANT: Run This SQL Migration First

Before testing kraamzorger functionality, you MUST run the database migration in Supabase.

## Step 1: Run the SQL Migration

1. Open your Supabase Dashboard: https://app.supabase.com/project/galdcnrchgxsfdilnmlh
2. Go to **SQL Editor** (left sidebar)
3. Copy the entire contents of `supabase/migrations/001_kraamzorger_platform.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute the migration

This creates:
- 8 new tables for kraamzorger management
- RLS policies for secure data access
- Helper functions for signup (`create_user_profile`, `create_kraamzorger_profile`)
- Helper functions for availability, ratings, and booking conflicts

## Step 2: Verify Tables Created

In Supabase Dashboard:
1. Go to **Table Editor**
2. Verify you see these new tables:
   - `kraamzorger_profiles`
   - `kraamzorger_availability`
   - `kraamzorger_bookings`
   - `kraamzorger_visits`
   - `care_observations`
   - `kraamzorger_reviews`
   - `kraamzorger_messages`
   - `kraamzorger_work_summary`

3. Go to **Database > Functions** and verify:
   - `create_user_profile` (SECURITY DEFINER function for signup)
   - `create_kraamzorger_profile` (SECURITY DEFINER function for signup)
   - `get_kraamzorger_availability`
   - `get_kraamzorger_rating`
   - `check_booking_conflict`

## Step 3: Test Signup Flow

**Important:** Email confirmation is required before profile creation.

1. Start the development server: `npm run dev`
2. Go to http://localhost:3000/auth/signup
3. Select "Kraamzorger" role
4. Fill in the form with a NEW email
5. Click "Create account"
6. You'll be redirected to a "Check your email" page
7. **Click the confirmation link in your email**
8. After confirmation, you'll be redirected to `/kraamzorger/dashboard`

## How the Signup Flow Works

1. **Signup** → User created in Supabase Auth, confirmation email sent
2. **Verify page** → User sees "Check your email" message
3. **Email confirmation** → User clicks link in email
4. **Auth callback** → Profile created automatically via SECURITY DEFINER function
5. **Redirect** → User redirected to appropriate dashboard (parent or kraamzorger)

**No database triggers are used.** Profile creation happens in the `/auth/callback` route handler after email confirmation.

## Troubleshooting

### User created but no profile in database

**This is expected behavior before email confirmation.**

**Solution:** Click the confirmation link in the email. The profile will be created automatically when the email is confirmed.

### "Failed to create profile" error

**Check:**
1. Run the SQL migration in Supabase SQL Editor
2. Verify the `create_user_profile` function exists in Database > Functions
3. Check browser console for detailed error messages

### "relation kraamzorger_profiles does not exist"

**Cause:** Migration not run.

**Solution:** Run the full SQL migration in Supabase SQL Editor.

### Email confirmation not working

**Check:**
1. Verify Supabase email templates are configured
2. Check spam folder for confirmation email
3. In Supabase Dashboard: Authentication > Email Templates > Confirmation

### Can't sign in after signup

**Cause:** Email not confirmed yet.

**Solution:** The user must click the confirmation link in their email before they can sign in. This is by design for security.

## Current Implementation Status

### Completed (Phase 1 - Foundation)
- [x] Database schema migration with SECURITY DEFINER functions
- [x] TypeScript types for all tables
- [x] Role selection in signup flow
- [x] Email confirmation flow (profile created after confirmation)
- [x] Auth callback with automatic profile creation
- [x] Kraamzorger dashboard with stats
- [x] Custom hooks: useKraamzorger, useBookings, useVisits

### Pending
- [ ] Availability management UI
- [ ] Marketplace search page
- [ ] Booking request form (parent view)
- [ ] Visit timer component
- [ ] Care observation forms
- [ ] Kraamzorger profile editing page
- [ ] PDF/CSV report exports
- [ ] Review/rating system UI
