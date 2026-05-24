import { NextResponse } from "next/server";
import type { Database } from "@/types/database";

export async function POST(request: Request) {
  try {
    const { userId, email, fullName, role } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceRole) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Use Supabase REST API directly with service role to bypass RLS
    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseServiceRole,
      "Authorization": `Bearer ${supabaseServiceRole}`,
      "Prefer": "return=representation",
    };

    // Check if profile already exists
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=id`,
      { headers }
    );

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      if (existing && existing.length > 0) {
        console.log("Profile already exists for user:", userId);
        return NextResponse.json({ success: true, alreadyExists: true });
      }
    }

    // Create profile directly - NO database functions/triggers, all in code
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: userId,
        email: email,
        full_name: fullName,
        role: role,
      }),
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error("Failed to create profile:", errorData);
      return NextResponse.json(
        { error: errorData.message || "Failed to create profile" },
        { status: 500 }
      );
    }

    // Create kraamzorger profile if role is kraamzorger
    if (role === "kraamzorger") {
      const kraamResponse = await fetch(`${supabaseUrl}/rest/v1/kraamzorger_profiles`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          id: userId,
          verification_status: "pending",
          languages: ["nl"],
          hourly_rate: 35.00,
        }),
      });

      if (!kraamResponse.ok) {
        const errorData = await kraamResponse.json();
        console.error("Failed to create kraamzorger profile:", errorData);
        return NextResponse.json(
          { error: errorData.message || "Failed to create kraamzorger profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
