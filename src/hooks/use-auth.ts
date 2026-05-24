"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientInstance } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

function getSessionFromStorage(): Session | null {
  if (typeof window === "undefined") return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  const storageKey = `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`;
  const item = localStorage.getItem(storageKey);

  if (!item) return null;

  try {
    const session = JSON.parse(item);
    // Check if expired
    if (session.expires_at && session.expires_at < Date.now() / 1000) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log("fetchProfile: starting for userId:", userId);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const client = createClientInstance();
      console.log("fetchProfile: client created, making request...");

      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single() as any;

      clearTimeout(timeoutId);
      console.log("fetchProfile: response received, data:", !!data, "error:", error);

      if (error) throw error;
      console.log("useAuth: profile fetched successfully:", data?.id);
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Read session directly from localStorage
    const storedSession = getSessionFromStorage();
    console.log("useAuth: initial session from storage:", storedSession ? { email: storedSession.user?.email } : "none");

    setSession(storedSession);
    setUser(storedSession?.user ?? null);

    if (storedSession?.user) {
      console.log("useAuth: fetching profile for:", storedSession.user.id);
      fetchProfile(storedSession.user.id).then(() => {
        console.log("useAuth: setting loading=false after initial profile fetch");
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    // Listen for auth changes
    const { data: { subscription } } = createClientInstance().auth.onAuthStateChange(async (event, newSession) => {
      console.log("useAuth: onAuthStateChange event:", event, "hasSession:", !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Ignore SIGNED_IN on initial load - we already fetch profile above
      // Only fetch profile on token refresh or explicit sign in
      if (newSession?.user && event !== 'SIGNED_IN') {
        console.log("useAuth: fetching profile from onAuthStateChange");
        await fetchProfile(newSession.user.id);
      } else if (!newSession) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      console.log("useAuth: cleanup");
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "X-Client-Info": "kraammate/1.0.0",
      },
      body: JSON.stringify({ email, password }),
    });

    const authData = await response.json();

    if (!response.ok || authData.error) {
      throw new Error(authData.error_description || authData.msg || "Sign in failed");
    }

    const storageKey = `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`;
    const newSession = {
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
      expires_in: authData.expires_in,
      expires_at: Math.floor(Date.now() / 1000) + authData.expires_in,
      token_type: authData.token_type,
      user: authData.user,
    };
    localStorage.setItem(storageKey, JSON.stringify(newSession));

    // Update state immediately
    setSession(newSession);
    setUser(authData.user);

    // Fetch profile immediately after sign in
    await fetchProfile(authData.user.id);
    setLoading(false);

    return { session: newSession, user: authData.user };
  };

  const signUp = async (email: string, password: string, fullName: string, role: "parent" | "kraamzorger" = "parent") => {
    const { data, error } = await createClientInstance().auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    if (error) throw error;

    // If email is already confirmed (auto-confirm enabled), create profile immediately via API
    if (data.user?.email_confirmed_at) {
      console.log("Email auto-confirmed, creating profile immediately for:", data.user.id);

      // Call server-side API to create profile with service role
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.user.id,
          email,
          fullName,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Profile creation failed:", result.error);
        throw new Error(result.error || "Failed to create profile");
      }

      console.log("Profile created successfully, waiting for auth state to propagate...");

      // Small delay to ensure auth state propagates before redirect
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return data;
  };

  const signInWithGoogle = async () => {
    const { data, error } = await createClientInstance().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return data;
  };

  const sendMagicLink = async (email: string) => {
    const { data, error } = await createClientInstance().auth.signInWithOtp({
      email,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const storageKey = `sb-${supabaseUrl.split("//")[1].split(".")[0]}-auth-token`;
      localStorage.removeItem(storageKey);
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await (createClientInstance() as any)
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  return {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    sendMagicLink,
    signOut,
    updateProfile,
    isAuthenticated: !!session,
  };
}
