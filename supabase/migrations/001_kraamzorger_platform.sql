-- Kraamzorger Platform Schema
-- Migration: 001_kraamzorger_platform.sql
-- Creates tables for kraamzorger management, bookings, visits, and care observations

-- ============================================================================
-- KRAAMZORGER PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages TEXT[] DEFAULT ARRAY['nl'],
  years_experience INTEGER DEFAULT 0,
  service_regions JSONB DEFAULT '[]'::jsonb,
  max_simultaneous_families INTEGER DEFAULT 3,
  night_care_available BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'suspended')),
  verification_date TIMESTAMPTZ,
  hourly_rate DECIMAL(8,2) DEFAULT 35.00,
  profile_video_url TEXT,
  certificate_urls TEXT[],
  specializations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kraamzorger_profiles_verification ON kraamzorger_profiles(verification_status);
CREATE INDEX idx_kraamzorger_profiles_languages ON kraamzorger_profiles USING GIN(languages);

-- ============================================================================
-- AVAILABILITY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_vacation BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kraamzorger_availability_kraamzorger ON kraamzorger_availability(kraamzorger_id);
CREATE INDEX idx_kraamzorger_availability_date ON kraamzorger_availability(specific_date);
CREATE INDEX idx_kraamzorger_availability_dow ON kraamzorger_availability(day_of_week);

-- ============================================================================
-- BOOKINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id),
  parent_id UUID NOT NULL REFERENCES profiles(id),
  baby_id UUID NOT NULL REFERENCES babies(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_hours_estimated DECIMAL(6,2),
  hourly_rate DECIMAL(8,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
  parent_notes TEXT,
  kraamzorger_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_kraamzorger_bookings_status ON kraamzorger_bookings(status);
CREATE INDEX idx_kraamzorger_bookings_kraamzorger ON kraamzorger_bookings(kraamzorger_id);
CREATE INDEX idx_kraamzorger_bookings_parent ON kraamzorger_bookings(parent_id);
CREATE INDEX idx_kraamzorger_bookings_baby ON kraamzorger_bookings(baby_id);
CREATE INDEX idx_kraamzorger_bookings_dates ON kraamzorger_bookings(start_date, end_date);

-- ============================================================================
-- VISIT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES kraamzorger_bookings(id) ON DELETE CASCADE,
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id),
  baby_id UUID NOT NULL REFERENCES babies(id),
  visit_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  travel_time_minutes INTEGER DEFAULT 0,
  activities_performed JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'pending_approval', 'approved', 'disputed')),
  parent_approved_at TIMESTAMPTZ,
  parent_signature TEXT,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kraamzorger_visits_booking ON kraamzorger_visits(booking_id);
CREATE INDEX idx_kraamzorger_visits_status ON kraamzorger_visits(status);
CREATE INDEX idx_kraamzorger_visits_kraamzorger ON kraamzorger_visits(kraamzorger_id);
CREATE INDEX idx_kraamzorger_visits_date ON kraamzorger_visits(visit_date);

-- ============================================================================
-- CARE OBSERVATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS care_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES kraamzorger_visits(id) ON DELETE SET NULL,
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id),
  baby_id UUID NOT NULL REFERENCES babies(id),
  observation_type TEXT NOT NULL CHECK (observation_type IN ('feeding', 'sleep', 'wellness', 'health_concern', 'recommendation', 'development', 'parent_support')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('normal', 'watch', 'concern', 'urgent')),
  requires_followup BOOLEAN DEFAULT false,
  followup_date TIMESTAMPTZ,
  parent_acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_care_observations_baby ON care_observations(baby_id);
CREATE INDEX idx_care_observations_kraamzorger ON care_observations(kraamzorger_id);
CREATE INDEX idx_care_observations_type ON care_observations(observation_type);
CREATE INDEX idx_care_observations_severity ON care_observations(severity);

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES kraamzorger_bookings(id),
  parent_id UUID NOT NULL REFERENCES profiles(id),
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  ratings_breakdown JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT true,
  parent_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

CREATE INDEX idx_kraamzorger_reviews_kraamzorger ON kraamzorger_reviews(kraamzorger_id);
CREATE INDEX idx_kraamzorger_reviews_parent ON kraamzorger_reviews(parent_id);
CREATE INDEX idx_kraamzorger_reviews_rating ON kraamzorger_reviews(rating);

-- ============================================================================
-- MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES kraamzorger_bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kraamzorger_messages_booking ON kraamzorger_messages(booking_id);
CREATE INDEX idx_kraamzorger_messages_unread ON kraamzorger_messages(booking_id, is_read) WHERE is_read = false;

-- ============================================================================
-- WORK HOURS SUMMARY
-- ============================================================================

CREATE TABLE IF NOT EXISTS kraamzorger_work_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kraamzorger_id UUID NOT NULL REFERENCES kraamzorger_profiles(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_hours DECIMAL(6,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_families INTEGER DEFAULT 0,
  total_travel_hours DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kraamzorger_id, week_start)
);

CREATE INDEX idx_kraamzorger_work_summary_kraamzorger ON kraamzorger_work_summary(kraamzorger_id);
CREATE INDEX idx_kraamzorger_work_summary_dates ON kraamzorger_work_summary(week_start, week_end);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE kraamzorger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_work_summary ENABLE ROW LEVEL SECURITY;

-- Kraamzorger profiles
CREATE POLICY "Public profiles are viewable by everyone" ON kraamzorger_profiles
  FOR SELECT USING (verification_status = 'verified' OR id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own profile" ON kraamzorger_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Availability
CREATE POLICY "Kraamzorgers can view their own availability" ON kraamzorger_availability
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can manage their own availability" ON kraamzorger_availability
  FOR ALL USING (kraamzorger_id = auth.uid());

-- Bookings
CREATE POLICY "Kraamzorgers can view their own bookings" ON kraamzorger_bookings
  FOR SELECT USING (kraamzorger_id = auth.uid() OR parent_id = auth.uid());

CREATE POLICY "Parents can view their own bookings" ON kraamzorger_bookings
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own bookings" ON kraamzorger_bookings
  FOR UPDATE USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can create bookings" ON kraamzorger_bookings
  FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Visits
CREATE POLICY "Kraamzorgers can view visits for their bookings" ON kraamzorger_visits
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can view visits for their bookings" ON kraamzorger_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kraamzorger_bookings WHERE kraamzorger_bookings.id = kraamzorger_visits.booking_id AND parent_id = auth.uid())
  );

CREATE POLICY "Kraamzorgers can create and update visits" ON kraamzorger_visits
  FOR ALL USING (kraamzorger_id = auth.uid());

-- Care observations
CREATE POLICY "Kraamzorgers can view observations for their bookings" ON care_observations
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can view observations for their babies" ON care_observations
  FOR SELECT USING (baby_id IN (SELECT id FROM babies WHERE owner_id = auth.uid()));

CREATE POLICY "Kraamzorgers can create observations" ON care_observations
  FOR INSERT WITH CHECK (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own observations" ON care_observations
  FOR UPDATE USING (kraamzorger_id = auth.uid());

-- Reviews
CREATE POLICY "Reviews are publicly viewable" ON kraamzorger_reviews
  FOR SELECT USING (is_public = true OR parent_id = auth.uid() OR kraamzorger_id = auth.uid());

CREATE POLICY "Parents can create reviews for their bookings" ON kraamzorger_reviews
  FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Messages
CREATE POLICY "Users can view messages for their bookings" ON kraamzorger_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kraamzorger_bookings
      WHERE kraamzorger_bookings.id = kraamzorger_messages.booking_id
      AND (kraamzorger_bookings.kraamzorger_id = auth.uid() OR kraamzorger_bookings.parent_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages for their bookings" ON kraamzorger_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Work summary
CREATE POLICY "Kraamzorgers can view their own work summary" ON kraamzorger_work_summary
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own work summary" ON kraamzorger_work_summary
  FOR UPDATE USING (kraamzorger_id = auth.uid());

-- ============================================================================
-- NOTE: All profile creation and business logic is handled in application code.
-- No database triggers or functions are used. This makes debugging easier.
-- updated_at fields should be handled in application code.
-- ============================================================================
