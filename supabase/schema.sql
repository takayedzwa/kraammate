-- Dutch Babies Green Book - Database Schema
-- Inspired by the Dutch "Groene Boekje" baby health and development booklet

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('parent', 'kraamzorger', 'family');
CREATE TYPE caregiver_permission AS ENUM ('view_only', 'view_and_edit');
CREATE TYPE feeding_type AS ENUM ('breastfeeding', 'bottle', 'pumping', 'mixed');
CREATE TYPE diaper_type AS ENUM ('wet', 'dirty', 'mixed');
CREATE TYPE sleep_type AS ENUM ('nap', 'night_sleep');
CREATE TYPE milestone_category AS ENUM ('physical', 'social', 'communication', 'feeding', 'first_time');
CREATE TYPE vaccination_status AS ENUM ('scheduled', 'completed', 'cancelled', 'missed');
CREATE TYPE notification_type AS ENUM ('feeding_reminder', 'medication_reminder', 'appointment_reminder', 'sleep_reminder', 'vaccination_reminder');
CREATE TYPE activity_action AS ENUM ('created', 'updated', 'deleted', 'viewed');

-- ============================================================================
-- USERS & PROFILES
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'parent',
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'nl')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ============================================================================
-- BABIES
-- ============================================================================

CREATE TABLE babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  birth_weight DECIMAL(5,2) NOT NULL, -- in kg (e.g., 3.50)
  birth_height DECIMAL(4,1) NOT NULL, -- in cm (e.g., 50.0)
  head_circumference_at_birth DECIMAL(4,1), -- in cm (e.g., 35.0)
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  gestational_age_weeks INTEGER DEFAULT 40,
  profile_photo_url TEXT,
  nickname TEXT,
  place_of_birth TEXT,
  midwife_info TEXT,
  gp_info TEXT,
  blood_type TEXT,
  allergies TEXT[],
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_babies_owner ON babies(owner_id);
CREATE INDEX idx_babies_dob ON babies(date_of_birth);

-- ============================================================================
-- CAREGIVER SHARING & PERMISSIONS
-- ============================================================================

CREATE TABLE caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT, -- For invited caregivers who haven't signed up yet
  name TEXT NOT NULL,
  permission caregiver_permission DEFAULT 'view_only',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_caregivers_baby ON caregivers(baby_id);
CREATE INDEX idx_caregivers_user ON caregivers(user_id);
CREATE INDEX idx_caregivers_status ON caregivers(status);

-- Share tokens for invite links
CREATE TABLE share_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  permission caregiver_permission DEFAULT 'view_only',
  email TEXT, -- Optional email restriction
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES profiles(id),
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_share_tokens_token ON share_tokens(token);
CREATE INDEX idx_share_tokens_baby ON share_tokens(baby_id);
CREATE INDEX idx_share_tokens_expires ON share_tokens(expires_at);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  action activity_action NOT NULL,
  entity_type TEXT NOT NULL, -- e.g., 'feeding_log', 'sleep_log', 'milestone'
  entity_id UUID NOT NULL,
  changes JSONB, -- Before/after values
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_baby ON audit_log(baby_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- FEEDING LOGS
-- ============================================================================

CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  feeding_type feeding_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated or manual
  amount_ml DECIMAL(6,1), -- For bottle/pumping
  breast_side TEXT CHECK (breast_side IN ('left', 'right', 'both')),
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5), -- How well baby fed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feeding_baby ON feeding_logs(baby_id);
CREATE INDEX idx_feeding_time ON feeding_logs(start_time);
CREATE INDEX idx_feeding_logged_by ON feeding_logs(logged_by);

-- ============================================================================
-- SLEEP LOGS
-- ============================================================================

CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  sleep_type sleep_type NOT NULL DEFAULT 'nap',
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),
  notes TEXT,
  location TEXT CHECK (location IN ('crib', 'bassinet', 'stroller', 'carrier', 'bed', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sleep_baby ON sleep_logs(baby_id);
CREATE INDEX idx_sleep_time ON sleep_logs(start_time);
CREATE INDEX idx_sleep_logged_by ON sleep_logs(logged_by);

-- ============================================================================
-- DIAPER LOGS
-- ============================================================================

CREATE TABLE diaper_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  diaper_type diaper_type NOT NULL,
  color TEXT, -- For dirty diapers
  consistency TEXT CHECK (consistency IN ('normal', 'watery', 'hard', 'mucusy')),
  amount TEXT CHECK (amount IN ('small', 'medium', 'large', 'overflow')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diaper_baby ON diaper_logs(baby_id);
CREATE INDEX idx_diaper_time ON diaper_logs(logged_at);
CREATE INDEX idx_diaper_logged_by ON diaper_logs(logged_by);

-- ============================================================================
-- GROWTH LOGS
-- ============================================================================

CREATE TABLE growth_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  weight DECIMAL(6,1) NOT NULL, -- in grams
  height DECIMAL(4,1), -- in cm
  head_circumference DECIMAL(4,1), -- in cm
  bmi DECIMAL(4,2), -- Calculated
  percentile_weight DECIMAL(5,2), -- WHO percentile
  percentile_height DECIMAL(5,2),
  percentile_head DECIMAL(5,2),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_baby ON growth_logs(baby_id);
CREATE INDEX idx_growth_time ON growth_logs(logged_at);

-- ============================================================================
-- TEMPERATURE & HEALTH LOGS
-- ============================================================================

CREATE TABLE temperature_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  temperature DECIMAL(4,2) NOT NULL, -- in Celsius
  measurement_method TEXT CHECK (measurement_method IN ('rectal', 'ear', 'forehead', 'armpit', 'oral')),
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_temperature_baby ON temperature_logs(baby_id);
CREATE INDEX idx_temperature_time ON temperature_logs(logged_at);

CREATE TABLE symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  symptom_type TEXT NOT NULL, -- e.g., 'fever', 'cough', 'rash', 'congestion'
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_symptoms_baby ON symptoms(baby_id);
CREATE INDEX idx_symptoms_status ON symptoms(resolved_at);

CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  instructions TEXT,
  prescribed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medications_baby ON medications(baby_id);

-- ============================================================================
-- MILESTONES
-- ============================================================================

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  milestone_type TEXT NOT NULL, -- e.g., 'first_smile', 'first_laugh', 'rolling_over'
  category milestone_category DEFAULT 'physical',
  title TEXT NOT NULL,
  description TEXT,
  occurred_at DATE NOT NULL,
  notes TEXT,
  media_urls TEXT[], -- Array of photo/video URLs
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milestones_baby ON milestones(baby_id);
CREATE INDEX idx_milestones_date ON milestones(occurred_at);
CREATE INDEX idx_milestones_category ON milestones(category);

CREATE TABLE milestone_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  reaction TEXT NOT NULL, -- emoji or text reaction
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(milestone_id, user_id, reaction)
);

CREATE INDEX idx_reactions_milestone ON milestone_reactions(milestone_id);

-- ============================================================================
-- VACCINATIONS & MEDICAL RECORDS
-- ============================================================================

CREATE TABLE vaccination_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  recommended_age_weeks INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status vaccination_status DEFAULT 'scheduled',
  administered_date DATE,
  administered_by TEXT,
  location TEXT,
  batch_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vaccinations_baby ON vaccination_schedule(baby_id);
CREATE INDEX idx_vaccinations_due ON vaccination_schedule(due_date);
CREATE INDEX idx_vaccinations_status ON vaccination_schedule(status);

CREATE TABLE doctor_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  logged_by UUID NOT NULL REFERENCES profiles(id),
  doctor_name TEXT,
  doctor_type TEXT, -- e.g., 'GP', 'Pediatrician', 'Specialist'
  visit_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  diagnosis TEXT,
  treatment TEXT,
  follow_up_date DATE,
  notes TEXT,
  attachment_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doctor_visits_baby ON doctor_visits(baby_id);
CREATE INDEX idx_doctor_visits_date ON doctor_visits(visit_date);

-- ============================================================================
-- NOTIFICATIONS & REMINDERS
-- ============================================================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  reminder_type notification_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  recurrence TEXT, -- e.g., 'daily', 'weekly', 'every_3_hours'
  is_active BOOLEAN DEFAULT TRUE,
  completed_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_baby ON reminders(baby_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_for);
CREATE INDEX idx_reminders_active ON reminders(is_active);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type,
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- ACTIVITY FEED (for real-time updates)
-- ============================================================================

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  summary TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_baby ON activity_feed(baby_id);
CREATE INDEX idx_activity_time ON activity_feed(created_at);

-- ============================================================================
-- PRESENCE (for real-time "who's viewing" feature)
-- ============================================================================

CREATE TABLE presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  current_page TEXT
);

CREATE INDEX idx_presence_user ON presence(user_id);
CREATE INDEX idx_presence_baby ON presence(baby_id);

-- ============================================================================
-- EXPORT JOBS
-- ============================================================================

CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  baby_id UUID REFERENCES babies(id) ON DELETE SET NULL,
  format TEXT DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'json')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_export_jobs_user ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaper_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Babies policies (accessible by owner and caregivers)
CREATE POLICY "Owners can view their babies" ON babies
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (SELECT 1 FROM caregivers WHERE baby_id = babies.id AND user_id = auth.uid() AND status = 'active')
  );

CREATE POLICY "Owners can manage their babies" ON babies
  FOR ALL USING (auth.uid() = owner_id);

-- Caregivers policies
CREATE POLICY "Caregivers can view their assigned babies' caregivers" ON caregivers
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM babies WHERE babies.id = caregivers.baby_id AND babies.owner_id = auth.uid())
  );

CREATE POLICY "Baby owners can manage caregivers" ON caregivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = caregivers.baby_id AND babies.owner_id = auth.uid())
  );

-- Share tokens policies
CREATE POLICY "Baby owners can manage share tokens" ON share_tokens
  FOR ALL USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = share_tokens.baby_id AND babies.owner_id = auth.uid())
  );

CREATE POLICY "Anyone with valid token can view it" ON share_tokens
  FOR SELECT USING (true);

-- Data logs policies (feeding, sleep, diaper, growth, etc.)
CREATE POLICY "Caregivers can view logs" ON feeding_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = feeding_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can create logs" ON feeding_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = feeding_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can update their own logs" ON feeding_logs
  FOR UPDATE USING (logged_by = auth.uid());

CREATE POLICY "Caregivers can delete their own logs" ON feeding_logs
  FOR DELETE USING (logged_by = auth.uid());

-- Apply similar policies to other log tables
CREATE POLICY "Caregivers can view sleep logs" ON sleep_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = sleep_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can create sleep logs" ON sleep_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = sleep_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can update their own sleep logs" ON sleep_logs
  FOR UPDATE USING (logged_by = auth.uid());

CREATE POLICY "Caregivers can delete their own sleep logs" ON sleep_logs
  FOR DELETE USING (logged_by = auth.uid());

-- Diaper logs
CREATE POLICY "Caregivers can view diaper logs" ON diaper_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = diaper_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can create diaper logs" ON diaper_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = diaper_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

-- Milestones
CREATE POLICY "Caregivers can view milestones" ON milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = milestones.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can create milestones" ON milestones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = milestones.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

-- Growth logs
CREATE POLICY "Caregivers can view growth logs" ON growth_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = growth_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

CREATE POLICY "Caregivers can create growth logs" ON growth_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = growth_logs.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Activity feed policies
CREATE POLICY "Caregivers can view activity feed" ON activity_feed
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = activity_feed.baby_id AND (
      babies.owner_id = auth.uid() OR
      EXISTS (SELECT 1 FROM caregivers WHERE caregivers.baby_id = babies.id AND caregivers.user_id = auth.uid() AND caregivers.status = 'active')
    ))
  );

-- Presence policies
CREATE POLICY "Users can manage their own presence" ON presence
  FOR ALL USING (auth.uid() = user_id);

-- Export jobs policies
CREATE POLICY "Users can view their own export jobs" ON export_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create export jobs" ON export_jobs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ============================================================================
-- SEED DATA - Default Dutch Vaccination Schedule (Rijksvaccinatieprogramma)
-- ============================================================================

-- Function to create default vaccination schedule for a baby
CREATE OR REPLACE FUNCTION create_default_vaccination_schedule(p_baby_id UUID)
RETURNS VOID AS $$
DECLARE
  v_dob DATE;
BEGIN
  SELECT date_of_birth INTO v_dob FROM babies WHERE id = p_baby_id;

  -- 6 weeks - DKTP-Hib-HepB (first round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP-Hib-HepB (1)', 'Diphtheria, Tetanus, Pertussis, Polio, Haemophilus influenzae B, Hepatitis B', 6, v_dob + INTERVAL '6 weeks'::INTERVAL);

  -- 11 weeks - DKTP-Hib-HepB (second round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP-Hib-HepB (2)', 'Diphtheria, Tetanus, Pertussis, Polio, Haemophilus influenzae B, Hepatitis B', 11, v_dob + INTERVAL '11 weeks'::INTERVAL);

  -- 3 months - Pneumococcal (first)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'Pneumococcal (1)', 'Pneumococcal disease', 12, v_dob + INTERVAL '3 months'::INTERVAL);

  -- 14 weeks - DKTP-Hib-HepB (third round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP-Hib-HepB (3)', 'Diphtheria, Tetanus, Pertussis, Polio, Haemophilus influenzae B, Hepatitis B', 14, v_dob + INTERVAL '14 weeks'::INTERVAL);

  -- 4 months - Pneumococcal (second)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'Pneumococcal (2)', 'Pneumococcal disease', 16, v_dob + INTERVAL '4 months'::INTERVAL);

  -- 11 months - BMR (Bof, Mazelen, Rodehond)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'BMR (1)', 'Mumps, Measles, Rubella', 47, v_dob + INTERVAL '11 months'::INTERVAL);

  -- 14 months - DKTP (second round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP (2)', 'Diphtheria, Tetanus, Pertussis, Polio', 62, v_dob + INTERVAL '14 months'::INTERVAL);

  -- 6 years - DKTP (third round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP (3)', 'Diphtheria, Tetanus, Pertussis, Polio', 312, v_dob + INTERVAL '6 years'::INTERVAL);

  -- 9 years - BMR (second round)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'BMR (2)', 'Mumps, Measles, Rubella', 468, v_dob + INTERVAL '9 years'::INTERVAL);

  -- 13 years - DKTP (fourth round) + MenACWY
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'DKTP (4)', 'Diphtheria, Tetanus, Pertussis, Polio', 676, v_dob + INTERVAL '13 years'::INTERVAL);

  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  VALUES (p_baby_id, 'MenACWY', 'Meningococcal disease', 676, v_dob + INTERVAL '13 years'::INTERVAL);

  -- HPV for girls (12-13 years)
  INSERT INTO vaccination_schedule (baby_id, name, description, recommended_age_weeks, due_date)
  SELECT p_baby_id, 'HPV', 'Human Papillomavirus (for girls)', 728, v_dob + INTERVAL '14 years'::INTERVAL
  WHERE EXISTS (SELECT 1 FROM babies WHERE id = p_baby_id AND gender = 'female');
END;
$$ LANGUAGE plpgsql;

-- Trigger to create vaccination schedule when baby is created
CREATE OR REPLACE FUNCTION trigger_create_vaccination_schedule()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_vaccination_schedule(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_vaccination_schedule AFTER INSERT ON babies
  FOR EACH ROW EXECUTE FUNCTION trigger_create_vaccination_schedule();

-- ============================================================================
-- WHO Growth Charts Reference Data (simplified - 3rd, 50th, 97th percentiles)
-- ============================================================================

CREATE TABLE who_growth_standards (
  id SERIAL PRIMARY KEY,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  age_months INTEGER NOT NULL,
  weight_p3 DECIMAL(5,2),
  weight_p50 DECIMAL(5,2),
  weight_p97 DECIMAL(5,2),
  length_p3 DECIMAL(5,2),
  length_p50 DECIMAL(5,2),
  length_p97 DECIMAL(5,2),
  head_p3 DECIMAL(4,2),
  head_p50 DECIMAL(4,2),
  head_p97 DECIMAL(4,2)
);

-- Insert WHO standards data (boys 0-12 months)
INSERT INTO who_growth_standards (sex, age_months, weight_p3, weight_p50, weight_p97, length_p3, length_p50, length_p97, head_p3, head_p50, head_p97) VALUES
('male', 0, 2.5, 3.3, 4.4, 46.3, 49.9, 53.4, 32.1, 34.5, 36.9),
('male', 1, 3.4, 4.5, 5.8, 50.8, 54.7, 58.6, 34.9, 37.3, 39.6),
('male', 2, 4.3, 5.6, 7.1, 54.4, 58.4, 62.4, 36.6, 39.1, 41.5),
('male', 3, 5.0, 6.4, 8.0, 57.3, 61.4, 65.5, 37.9, 40.5, 42.9),
('male', 4, 5.6, 7.0, 8.7, 59.9, 63.9, 68.0, 38.9, 41.6, 44.2),
('male', 5, 6.0, 7.5, 9.3, 61.7, 65.9, 70.1, 39.8, 42.6, 45.2),
('male', 6, 6.4, 7.9, 9.8, 63.6, 67.6, 71.9, 40.6, 43.3, 46.1),
('male', 7, 6.7, 8.3, 10.3, 65.1, 69.2, 73.5, 41.2, 44.1, 46.8),
('male', 8, 6.9, 8.6, 10.7, 66.5, 70.6, 75.0, 41.8, 44.7, 47.5),
('male', 9, 7.1, 8.9, 11.0, 67.5, 72.0, 76.5, 42.3, 45.2, 48.1),
('male', 10, 7.4, 9.2, 11.4, 68.7, 73.3, 77.9, 42.7, 45.7, 48.6),
('male', 11, 7.6, 9.4, 11.7, 69.9, 74.5, 79.2, 43.1, 46.1, 49.1),
('male', 12, 7.7, 9.6, 12.0, 71.0, 75.7, 80.5, 43.5, 46.5, 49.5);

-- Insert WHO standards data (girls 0-12 months)
INSERT INTO who_growth_standards (sex, age_months, weight_p3, weight_p50, weight_p97, length_p3, length_p50, length_p97, head_p3, head_p50, head_p97) VALUES
('female', 0, 2.4, 3.2, 4.2, 45.6, 49.1, 52.7, 31.7, 33.9, 36.2),
('female', 1, 3.2, 4.2, 5.5, 49.8, 53.7, 57.6, 34.2, 36.5, 38.9),
('female', 2, 3.9, 5.1, 6.6, 53.0, 57.1, 61.1, 35.8, 38.3, 40.7),
('female', 3, 4.5, 5.8, 7.5, 55.6, 59.8, 64.0, 37.1, 39.5, 42.0),
('female', 4, 5.0, 6.4, 8.2, 57.8, 62.1, 66.4, 38.1, 40.6, 43.0),
('female', 5, 5.4, 6.9, 8.8, 59.6, 64.0, 68.5, 38.9, 41.5, 44.0),
('female', 6, 5.7, 7.3, 9.3, 61.2, 65.7, 70.3, 39.6, 42.2, 44.9),
('female', 7, 6.0, 7.6, 9.6, 62.7, 67.3, 71.9, 40.2, 42.8, 45.5),
('female', 8, 6.3, 7.9, 10.0, 64.0, 68.8, 73.5, 40.7, 43.4, 46.0),
('female', 9, 6.5, 8.2, 10.4, 65.3, 70.1, 75.0, 41.2, 43.9, 46.5),
('female', 10, 6.7, 8.5, 10.7, 66.5, 71.5, 76.4, 41.6, 44.3, 47.0),
('female', 11, 6.9, 8.7, 11.0, 67.7, 72.8, 77.8, 42.0, 44.7, 47.4),
('female', 12, 7.0, 8.9, 11.3, 68.9, 74.0, 79.2, 42.3, 45.0, 47.7);

-- Function to calculate percentile
CREATE OR REPLACE FUNCTION calculate_percentile(p_value DECIMAL, p_p3 DECIMAL, p_p50 DECIMAL, p_p97 DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF p_value <= p_p3 THEN
    RETURN 3.0;
  ELSIF p_value >= p_p97 THEN
    RETURN 97.0;
  ELSIF p_value <= p_p50 THEN
    -- Linear interpolation between p3 and p50
    RETURN 3.0 + ((p_value - p_p3) / (p_p50 - p_p3)) * 47.0;
  ELSE
    -- Linear interpolation between p50 and p97
    RETURN 50.0 + ((p_value - p_p50) / (p_p97 - p_p50)) * 47.0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- KRAAMZORGER PLATFORM TABLES
-- ============================================================================

-- Kraamzorger profiles (extends profiles table)
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

-- Availability management
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

-- Bookings
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

-- Visit tracking
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

-- Care observations
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

-- Reviews
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
CREATE INDEX idx_kraamzorger_reviews_rating ON kraamzorger_reviews(rating);

-- Messages
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

-- Work summary
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

-- Enable RLS on kraamzorger tables
ALTER TABLE kraamzorger_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kraamzorger_work_summary ENABLE ROW LEVEL SECURITY;

-- Kraamzorger profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON kraamzorger_profiles
  FOR SELECT USING (verification_status = 'verified' OR id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own profile" ON kraamzorger_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Availability policies
CREATE POLICY "Kraamzorgers can view their own availability" ON kraamzorger_availability
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can manage their own availability" ON kraamzorger_availability
  FOR ALL USING (kraamzorger_id = auth.uid());

-- Bookings policies
CREATE POLICY "Kraamzorgers can view their own bookings" ON kraamzorger_bookings
  FOR SELECT USING (kraamzorger_id = auth.uid() OR parent_id = auth.uid());

CREATE POLICY "Parents can view their own bookings" ON kraamzorger_bookings
  FOR SELECT USING (parent_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own bookings" ON kraamzorger_bookings
  FOR UPDATE USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can create bookings" ON kraamzorger_bookings
  FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Visits policies
CREATE POLICY "Kraamzorgers can view visits for their bookings" ON kraamzorger_visits
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can view visits for their bookings" ON kraamzorger_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM kraamzorger_bookings WHERE kraamzorger_bookings.id = kraamzorger_visits.booking_id AND parent_id = auth.uid())
  );

CREATE POLICY "Kraamzorgers can create and update visits" ON kraamzorger_visits
  FOR ALL USING (kraamzorger_id = auth.uid());

-- Care observations policies
CREATE POLICY "Kraamzorgers can view observations for their bookings" ON care_observations
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Parents can view observations for their babies" ON care_observations
  FOR SELECT USING (baby_id IN (SELECT id FROM babies WHERE owner_id = auth.uid()));

CREATE POLICY "Kraamzorgers can create observations" ON care_observations
  FOR INSERT WITH CHECK (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own observations" ON care_observations
  FOR UPDATE USING (kraamzorger_id = auth.uid());

-- Reviews policies
CREATE POLICY "Reviews are publicly viewable" ON kraamzorger_reviews
  FOR SELECT USING (is_public = true OR parent_id = auth.uid() OR kraamzorger_id = auth.uid());

CREATE POLICY "Parents can create reviews for their bookings" ON kraamzorger_reviews
  FOR INSERT WITH CHECK (parent_id = auth.uid());

-- Messages policies
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

-- Work summary policies
CREATE POLICY "Kraamzorgers can view their own work summary" ON kraamzorger_work_summary
  FOR SELECT USING (kraamzorger_id = auth.uid());

CREATE POLICY "Kraamzorgers can update their own work summary" ON kraamzorger_work_summary
  FOR UPDATE USING (kraamzorger_id = auth.uid());

-- ============================================================================
-- NOTE: All profile creation and business logic is handled in application code.
-- No database triggers or functions are used for profile creation.
-- This makes debugging and fixing issues easier.
-- ============================================================================
