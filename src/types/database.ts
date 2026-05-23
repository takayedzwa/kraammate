export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'parent' | 'kraamzorger' | 'family';
export type CaregiverPermission = 'view_only' | 'view_and_edit';
export type FeedingType = 'breastfeeding' | 'bottle' | 'pumping' | 'mixed';
export type DiaperType = 'wet' | 'dirty' | 'mixed';
export type SleepType = 'nap' | 'night_sleep';
export type MilestoneCategory = 'physical' | 'social' | 'communication' | 'feeding' | 'first_time';
export type VaccinationStatus = 'scheduled' | 'completed' | 'cancelled' | 'missed';
export type NotificationType = 'feeding_reminder' | 'medication_reminder' | 'appointment_reminder' | 'sleep_reminder' | 'vaccination_reminder';
export type ActivityAction = 'created' | 'updated' | 'deleted' | 'viewed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: UserRole;
          language: 'en' | 'nl';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          language?: 'en' | 'nl';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: UserRole;
          language?: 'en' | 'nl';
          created_at?: string;
          updated_at?: string;
        };
      };
      babies: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          date_of_birth: string;
          birth_weight: number;
          birth_height: number;
          head_circumference_at_birth: number | null;
          gender: 'male' | 'female' | 'other' | null;
          gestational_age_weeks: number | null;
          profile_photo_url: string | null;
          nickname: string | null;
          place_of_birth: string | null;
          midwife_info: string | null;
          gp_info: string | null;
          blood_type: string | null;
          allergies: string[] | null;
          medical_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          date_of_birth: string;
          birth_weight: number;
          birth_height: number;
          head_circumference_at_birth?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          gestational_age_weeks?: number | null;
          profile_photo_url?: string | null;
          nickname?: string | null;
          place_of_birth?: string | null;
          midwife_info?: string | null;
          gp_info?: string | null;
          blood_type?: string | null;
          allergies?: string[] | null;
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          date_of_birth?: string;
          birth_weight?: number;
          birth_height?: number;
          head_circumference_at_birth?: number | null;
          gender?: 'male' | 'female' | 'other' | null;
          gestational_age_weeks?: number | null;
          profile_photo_url?: string | null;
          nickname?: string | null;
          place_of_birth?: string | null;
          midwife_info?: string | null;
          gp_info?: string | null;
          blood_type?: string | null;
          allergies?: string[] | null;
          medical_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      caregivers: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string | null;
          email: string | null;
          name: string;
          permission: CaregiverPermission;
          status: 'pending' | 'active' | 'revoked';
          invited_by: string | null;
          invited_at: string;
          accepted_at: string | null;
          expires_at: string | null;
          last_active_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id?: string | null;
          email?: string | null;
          name: string;
          permission?: CaregiverPermission;
          status?: 'pending' | 'active' | 'revoked';
          invited_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          expires_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          user_id?: string | null;
          email?: string | null;
          name?: string;
          permission?: CaregiverPermission;
          status?: 'pending' | 'active' | 'revoked';
          invited_by?: string | null;
          invited_at?: string;
          accepted_at?: string | null;
          expires_at?: string | null;
          last_active_at?: string | null;
          created_at?: string;
        };
      };
      share_tokens: {
        Row: {
          id: string;
          baby_id: string;
          token: string;
          permission: CaregiverPermission;
          email: string | null;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          max_uses: number | null;
          uses_count: number;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          token?: string;
          permission?: CaregiverPermission;
          email?: string | null;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          max_uses?: number | null;
          uses_count?: number;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          token?: string;
          permission?: CaregiverPermission;
          email?: string | null;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          max_uses?: number | null;
          uses_count?: number;
          created_by?: string;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string | null;
          action: ActivityAction;
          entity_type: string;
          entity_id: string;
          changes: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
      };
      feeding_logs: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          feeding_type: FeedingType;
          start_time: string;
          end_time: string | null;
          end_duration_minutes: number | null;
          amount_ml: number | null;
          breast_side: 'left' | 'right' | 'both' | null;
          notes: string | null;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          feeding_type: FeedingType;
          start_time?: string;
          end_time?: string | null;
          end_duration_minutes?: number | null;
          amount_ml?: number | null;
          breast_side?: 'left' | 'right' | 'both' | null;
          notes?: string | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          logged_by?: string;
          feeding_type?: FeedingType;
          start_time?: string;
          end_time?: string | null;
          end_duration_minutes?: number | null;
          amount_ml?: number | null;
          breast_side?: 'left' | 'right' | 'both' | null;
          notes?: string | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sleep_logs: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          sleep_type: SleepType;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          quality: number | null;
          notes: string | null;
          location: 'crib' | 'bassinet' | 'stroller' | 'carrier' | 'bed' | 'other' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          sleep_type?: SleepType;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          quality?: number | null;
          notes?: string | null;
          location?: 'crib' | 'bassinet' | 'stroller' | 'carrier' | 'bed' | 'other' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          logged_by?: string;
          sleep_type?: SleepType;
          start_time?: string;
          end_time?: string | null;
          duration_minutes?: number | null;
          quality?: number | null;
          notes?: string | null;
          location?: 'crib' | 'bassinet' | 'stroller' | 'carrier' | 'bed' | 'other' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      diaper_logs: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          diaper_type: DiaperType;
          color: string | null;
          consistency: 'normal' | 'watery' | 'hard' | 'mucusy' | null;
          amount: 'small' | 'medium' | 'large' | 'overflow' | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          diaper_type: DiaperType;
          color?: string | null;
          consistency?: 'normal' | 'watery' | 'hard' | 'mucusy' | null;
          amount?: 'small' | 'medium' | 'large' | 'overflow' | null;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          logged_by?: string;
          diaper_type?: DiaperType;
          color?: string | null;
          consistency?: 'normal' | 'watery' | 'hard' | 'mucusy' | null;
          amount?: 'small' | 'medium' | 'large' | 'overflow' | null;
          notes?: string | null;
          logged_at?: string;
        };
      };
      growth_logs: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          weight: number;
          height: number | null;
          head_circumference: number | null;
          bmi: number | null;
          percentile_weight: number | null;
          percentile_height: number | null;
          percentile_head: number | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          weight: number;
          height?: number | null;
          head_circumference?: number | null;
          bmi?: number | null;
          percentile_weight?: number | null;
          percentile_height?: number | null;
          percentile_head?: number | null;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          logged_by?: string;
          weight?: number;
          height?: number | null;
          head_circumference?: number | null;
          bmi?: number | null;
          percentile_weight?: number | null;
          percentile_height?: number | null;
          percentile_head?: number | null;
          notes?: string | null;
          logged_at?: string;
        };
      };
      temperature_logs: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          temperature: number;
          measurement_method: 'rectal' | 'ear' | 'forehead' | 'armpit' | 'oral' | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          temperature: number;
          measurement_method?: 'rectal' | 'ear' | 'forehead' | 'armpit' | 'oral' | null;
          notes?: string | null;
          logged_at?: string;
        };
      };
      symptoms: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          symptom_type: string;
          severity: number | null;
          notes: string | null;
          started_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          symptom_type: string;
          severity?: number | null;
          notes?: string | null;
          started_at?: string;
          resolved_at?: string | null;
        };
      };
      medications: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          name: string;
          dosage: string;
          frequency: string | null;
          start_date: string;
          end_date: string | null;
          instructions: string | null;
          prescribed_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          name: string;
          dosage: string;
          frequency?: string | null;
          start_date: string;
          end_date?: string | null;
          instructions?: string | null;
          prescribed_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          milestone_type: string;
          category: MilestoneCategory;
          title: string;
          description: string | null;
          occurred_at: string;
          notes: string | null;
          media_urls: string[] | null;
          is_custom: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          milestone_type: string;
          category?: MilestoneCategory;
          title: string;
          description?: string | null;
          occurred_at: string;
          notes?: string | null;
          media_urls?: string[] | null;
          is_custom?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          logged_by?: string;
          milestone_type?: string;
          category?: MilestoneCategory;
          title?: string;
          description?: string | null;
          occurred_at?: string;
          notes?: string | null;
          media_urls?: string[] | null;
          is_custom?: boolean;
          created_at?: string;
        };
      };
      milestone_reactions: {
        Row: {
          id: string;
          milestone_id: string;
          user_id: string;
          reaction: string;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          milestone_id: string;
          user_id: string;
          reaction: string;
          comment?: string | null;
          created_at?: string;
        };
      };
      vaccination_schedule: {
        Row: {
          id: string;
          baby_id: string;
          name: string;
          description: string | null;
          recommended_age_weeks: number;
          due_date: string;
          status: VaccinationStatus;
          administered_date: string | null;
          administered_by: string | null;
          location: string | null;
          batch_number: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          name: string;
          description?: string | null;
          recommended_age_weeks: number;
          due_date: string;
          status?: VaccinationStatus;
          administered_date?: string | null;
          administered_by?: string | null;
          location?: string | null;
          batch_number?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          name?: string;
          description?: string | null;
          recommended_age_weeks?: number;
          due_date?: string;
          status?: VaccinationStatus;
          administered_date?: string | null;
          administered_by?: string | null;
          location?: string | null;
          batch_number?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      doctor_visits: {
        Row: {
          id: string;
          baby_id: string;
          logged_by: string;
          doctor_name: string | null;
          doctor_type: string | null;
          visit_date: string;
          reason: string | null;
          diagnosis: string | null;
          treatment: string | null;
          follow_up_date: string | null;
          notes: string | null;
          attachment_urls: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          logged_by: string;
          doctor_name?: string | null;
          doctor_type?: string | null;
          visit_date: string;
          reason?: string | null;
          diagnosis?: string | null;
          treatment?: string | null;
          follow_up_date?: string | null;
          notes?: string | null;
          attachment_urls?: string[] | null;
          created_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          baby_id: string;
          created_by: string;
          reminder_type: NotificationType;
          title: string;
          description: string | null;
          scheduled_for: string;
          recurrence: string | null;
          is_active: boolean;
          completed_at: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          created_by: string;
          reminder_type: NotificationType;
          title: string;
          description?: string | null;
          scheduled_for: string;
          recurrence?: string | null;
          is_active?: boolean;
          completed_at?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          baby_id: string | null;
          title: string;
          message: string;
          type: NotificationType | null;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          baby_id?: string | null;
          title: string;
          message: string;
          type?: NotificationType | null;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          baby_id?: string | null;
          title?: string;
          message?: string;
          type?: NotificationType | null;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
      };
      activity_feed: {
        Row: {
          id: string;
          baby_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          summary: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          summary: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      presence: {
        Row: {
          id: string;
          user_id: string;
          baby_id: string | null;
          last_seen: string;
          status: 'online' | 'away' | 'offline';
          current_page: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          baby_id?: string | null;
          last_seen?: string;
          status?: 'online' | 'away' | 'offline';
          current_page?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          baby_id?: string | null;
          last_seen?: string;
          status?: 'online' | 'away' | 'offline';
          current_page?: string | null;
        };
      };
      export_jobs: {
        Row: {
          id: string;
          user_id: string;
          baby_id: string | null;
          format: 'pdf' | 'csv' | 'json';
          status: 'pending' | 'processing' | 'completed' | 'failed';
          file_url: string | null;
          expires_at: string | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          baby_id?: string | null;
          format?: 'pdf' | 'csv' | 'json';
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          file_url?: string | null;
          expires_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      who_growth_standards: {
        Row: {
          id: number;
          sex: 'male' | 'female';
          age_months: number;
          weight_p3: number;
          weight_p50: number;
          weight_p97: number;
          length_p3: number;
          length_p50: number;
          length_p97: number;
          head_p3: number;
          head_p50: number;
          head_p97: number;
        };
      };
    };
    Views: {};
    Functions: {
      calculate_percentile: {
        Args: {
          p_value: number;
          p_p3: number;
          p_p50: number;
          p_p97: number;
        };
        Returns: number;
      };
      create_default_vaccination_schedule: {
        Args: {
          p_baby_id: string;
        };
        Returns: void;
      };
    };
  };
}
