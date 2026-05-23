-- RLS Policies for temperature_logs, symptoms, and medications tables
-- Run this in your Supabase SQL Editor to enable proper access

-- ============================================
-- TEMPERATURE LOGS
-- ============================================
GRANT ALL ON public.temperature_logs TO authenticated;
ALTER TABLE public.temperature_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "temp_insert" ON public.temperature_logs;
DROP POLICY IF EXISTS "temp_select" ON public.temperature_logs;
DROP POLICY IF EXISTS "temp_delete" ON public.temperature_logs;

CREATE POLICY "temp_insert" ON public.temperature_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = temperature_logs.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "temp_select" ON public.temperature_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = temperature_logs.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "temp_delete" ON public.temperature_logs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = temperature_logs.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

-- ============================================
-- SYMPTOMS
-- ============================================
GRANT ALL ON public.symptoms TO authenticated;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "symptoms_insert" ON public.symptoms;
DROP POLICY IF EXISTS "symptoms_select" ON public.symptoms;
DROP POLICY IF EXISTS "symptoms_update" ON public.symptoms;
DROP POLICY IF EXISTS "symptoms_delete" ON public.symptoms;

CREATE POLICY "symptoms_insert" ON public.symptoms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = symptoms.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "symptoms_select" ON public.symptoms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = symptoms.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "symptoms_update" ON public.symptoms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = symptoms.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "symptoms_delete" ON public.symptoms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = symptoms.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

-- ============================================
-- MEDICATIONS
-- ============================================
GRANT ALL ON public.medications TO authenticated;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medications_insert" ON public.medications;
DROP POLICY IF EXISTS "medications_select" ON public.medications;
DROP POLICY IF EXISTS "medications_update" ON public.medications;
DROP POLICY IF EXISTS "medications_delete" ON public.medications;

CREATE POLICY "medications_insert" ON public.medications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = medications.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "medications_select" ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = medications.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "medications_update" ON public.medications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = medications.baby_id
      AND babies.owner_id = auth.uid()
    )
  );

CREATE POLICY "medications_delete" ON public.medications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM babies
      WHERE babies.id = medications.baby_id
      AND babies.owner_id = auth.uid()
    )
  );
