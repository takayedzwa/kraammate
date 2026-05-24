import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";
import { createClientInstance } from "@/lib/supabase";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("=== AUTH CALLBACK ===");
  console.log("Origin:", origin);
  console.log("Code present:", !!code);
  console.log("Error:", errorParam, errorDescription);
  console.log("Next:", next);

  if (errorParam) {
    console.error("Auth error:", errorDescription);
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || "")}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("Exchange error:", exchangeError);
        return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`);
      }

      const user = data.user;
      if (user) {
        console.log("Session exchanged successfully for user:", user.id);

        // Use admin client to create profile (bypasses RLS, no database functions needed)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        console.log("Using service role key:", supabaseServiceRole ? "present" : "MISSING!");

        if (!supabaseServiceRole) {
          console.error("SUPABASE_SERVICE_ROLE_KEY is not set in environment!");
        }

        const adminClient = createAdminClient<Database>(supabaseUrl, supabaseServiceRole) as any;

        // Check if profile already exists
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          // Profile doesn't exist - create it now in application code
          const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
          const role = user.user_metadata?.role || "parent";

          console.log("Creating profile for confirmed user:", user.id, "role:", role);

          // Create profile directly - NO database functions, all in code
          const { error: profileError } = await adminClient
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email || "",
              full_name: fullName,
              role: role,
            });

          if (profileError) {
            console.error("Failed to create profile:", profileError);
            return NextResponse.redirect(`${origin}/auth/signin?error=profile_creation_failed`);
          }

          // Create kraamzorger profile if role is kraamzorger - all in code
          if (role === "kraamzorger") {
            const { error: kError } = await adminClient
              .from("kraamzorger_profiles")
              .insert({
                id: user.id,
                verification_status: "pending",
                languages: ["nl"],
                hourly_rate: 35.00,
              });

            if (kError) {
              console.error("Failed to create kraamzorger profile:", kError);
              return NextResponse.redirect(`${origin}/auth/signin?error=kraamzorger_profile_creation_failed`);
            }
            console.log("Kraamzorger profile created successfully");
            return NextResponse.redirect(`${origin}/kraamzorger/dashboard`);
          }
        }

        // Determine redirect based on role
        if (existingProfile?.role === "kraamzorger") {
          return NextResponse.redirect(`${origin}/kraamzorger/dashboard`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error("Callback exception:", err);
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`);
}
