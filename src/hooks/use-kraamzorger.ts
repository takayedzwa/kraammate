"use client";

import { useState, useEffect, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { KraamzorgerVerificationStatus, BookingStatus } from "@/types/database";

interface KraamzorgerProfile {
  id: string;
  bio: string | null;
  certifications: Array<{ name: string; date: string; issuing_body: string; certificate_url?: string }>;
  languages: string[];
  years_experience: number | null;
  service_regions: Array<{ postcode: string; radius_km: number }>;
  max_simultaneous_families: number | null;
  night_care_available: boolean | null;
  verification_status: KraamzorgerVerificationStatus;
  verification_date: string | null;
  hourly_rate: number | null;
  profile_video_url: string | null;
  certificate_urls: string[] | null;
  specializations: string[] | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface UseKraamzorgerReturn {
  profile: KraamzorgerProfile | null;
  loading: boolean;
  isKraamzorger: boolean;
  updateProfile: (data: Partial<KraamzorgerProfile>) => Promise<void>;
  setVerificationStatus: (status: KraamzorgerVerificationStatus) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useKraamzorger(userId?: string): UseKraamzorgerReturn {
  const { toast } = useToast();
  const [profile, setProfile] = useState<KraamzorgerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const client = createClientInstance();

      // Fetch kraamzorger profile with profile data
      const { data: kProfile, error: kError } = await client
        .from("kraamzorger_profiles")
        .select(`
          *,
          profiles:profiles!inner (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq("id", userId)
        .single();

      if (kError && kError.code !== "PGRST116") {
        throw kError;
      }

      if (kProfile) {
        const kp = kProfile as any;
        setProfile({
          id: kp.id,
          bio: kp.bio,
          certifications: kp.certifications || [],
          languages: kp.languages || [],
          years_experience: kp.years_experience,
          service_regions: kp.service_regions || [],
          max_simultaneous_families: kp.max_simultaneous_families,
          night_care_available: kp.night_care_available,
          verification_status: kp.verification_status,
          verification_date: kp.verification_date,
          hourly_rate: kp.hourly_rate,
          profile_video_url: kp.profile_video_url,
          certificate_urls: kp.certificate_urls,
          specializations: kp.specializations,
          full_name: kp.profiles?.full_name,
          email: kp.profiles?.email,
          avatar_url: kp.profiles?.avatar_url,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching kraamzorger profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<KraamzorgerProfile>) => {
    if (!userId) return;

    try {
      const client = createClientInstance() as any;

      // Update kraamzorger profile
      const kraamzorgerUpdate: Record<string, unknown> = {};
      if (data.bio !== undefined) kraamzorgerUpdate.bio = data.bio;
      if (data.certifications !== undefined) kraamzorgerUpdate.certifications = data.certifications;
      if (data.languages !== undefined) kraamzorgerUpdate.languages = data.languages;
      if (data.years_experience !== undefined) kraamzorgerUpdate.years_experience = data.years_experience;
      if (data.service_regions !== undefined) kraamzorgerUpdate.service_regions = data.service_regions;
      if (data.max_simultaneous_families !== undefined) kraamzorgerUpdate.max_simultaneous_families = data.max_simultaneous_families;
      if (data.night_care_available !== undefined) kraamzorgerUpdate.night_care_available = data.night_care_available;
      if (data.hourly_rate !== undefined) kraamzorgerUpdate.hourly_rate = data.hourly_rate;
      if (data.profile_video_url !== undefined) kraamzorgerUpdate.profile_video_url = data.profile_video_url;
      if (data.certificate_urls !== undefined) kraamzorgerUpdate.certificate_urls = data.certificate_urls;
      if (data.specializations !== undefined) kraamzorgerUpdate.specializations = data.specializations;

      const { error: kError } = await client
        .from("kraamzorger_profiles")
        .update(kraamzorgerUpdate)
        .eq("id", userId);

      if (kError) throw kError;

      // Update profile if needed
      const profileUpdate: Record<string, unknown> = {};
      if (data.full_name !== undefined) profileUpdate.full_name = data.full_name;
      if (data.avatar_url !== undefined) profileUpdate.avatar_url = data.avatar_url;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: pError } = await client
          .from("profiles")
          .update(profileUpdate)
          .eq("id", userId);

        if (pError) throw pError;
      }

      toast({
        title: "Profile updated",
        description: "Your kraamzorger profile has been updated successfully.",
        variant: "success",
      });

      await fetchProfile();
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setVerificationStatus = async (status: KraamzorgerVerificationStatus) => {
    if (!userId) return;

    try {
      const client = createClientInstance() as any;

      const { error } = await client
        .from("kraamzorger_profiles")
        .update({
          verification_status: status,
          verification_date: status === "verified" ? new Date().toISOString() : null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Verification status updated",
        description: `Profile is now ${status}.`,
        variant: "success",
      });

      await fetchProfile();
    } catch (error) {
      toast({
        title: "Failed to update verification status",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    profile,
    loading,
    isKraamzorger: profile !== null,
    updateProfile,
    setVerificationStatus,
    refreshProfile: fetchProfile,
  };
}

interface UseKraamzorgerSearchOptions {
  startDate?: string;
  endDate?: string;
  languages?: string[];
  nightCare?: boolean;
  postcode?: string;
  radius?: number;
}

interface KraamzorgerSearchResult {
  id: string;
  full_name: string | null;
  bio: string | null;
  languages: string[];
  years_experience: number | null;
  verification_status: KraamzorgerVerificationStatus;
  hourly_rate: number | null;
  night_care_available: boolean | null;
  specializations: string[] | null;
  avatar_url: string | null;
  average_rating: number | null;
  total_reviews: number;
  available_dates: string[];
}

export function useKraamzorgerSearch() {
  const [results, setResults] = useState<KraamzorgerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (options: UseKraamzorgerSearchOptions) => {
    setLoading(true);
    setError(null);

    try {
      const client = createClientInstance() as any;

      let query = client
        .from("kraamzorger_profiles")
        .select(`
          *,
          profiles:profiles!inner (
            full_name,
            avatar_url
          ),
          kraamzorger_reviews!inner (
            rating
          )
        `)
        .eq("verification_status", "verified");

      // Filter by languages
      if (options.languages && options.languages.length > 0) {
        query = query.overlaps("languages", options.languages);
      }

      // Filter by night care
      if (options.nightCare) {
        query = query.eq("night_care_available", true);
      }

      const { data, error: searchError } = await query;

      if (searchError) throw searchError;

      // Process results to include rating averages
      const processedResults: KraamzorgerSearchResult[] = (data || []).map((k) => {
        const reviews = (k as any).kraamzorger_reviews || [];
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : null;

        return {
          id: k.id,
          full_name: k.profiles.full_name,
          bio: k.bio,
          languages: k.languages,
          years_experience: k.years_experience,
          verification_status: k.verification_status,
          hourly_rate: k.hourly_rate,
          night_care_available: k.night_care_available,
          specializations: k.specializations,
          avatar_url: k.profiles.avatar_url,
          average_rating: avgRating,
          total_reviews: reviews.length,
          available_dates: [], // Would be calculated from availability table
        };
      });

      setResults(processedResults);
      return processedResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, search };
}

export async function createKraamzorgerProfile(
  userId: string,
  data: {
    bio?: string;
    languages?: string[];
    years_experience?: number;
    hourly_rate?: number;
  }
) {
  const client = createClientInstance() as any;

  const { error } = await client
    .from("kraamzorger_profiles")
    .insert({
      id: userId,
      bio: data.bio || null,
      languages: data.languages || ["nl"],
      years_experience: data.years_experience || 0,
      hourly_rate: data.hourly_rate || 35.00,
      verification_status: "pending" as KraamzorgerVerificationStatus,
    });

  if (error) throw error;
}

export async function setKraamzorgerRole(userId: string) {
  const client = createClientInstance() as any;

  const { error } = await client
    .from("profiles")
    .update({ role: "kraamzorger" })
    .eq("id", userId);

  if (error) throw error;

  // Also create the kraamzorger profile
  await createKraamzorgerProfile(userId, {});
}
