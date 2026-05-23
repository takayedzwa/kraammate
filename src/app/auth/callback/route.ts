import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/dashboard";

  console.log("Auth callback received:", { code: code ? "present" : "missing", error: errorParam });

  if (errorParam) {
    console.error("Auth error:", errorDescription);
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDescription || "")}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        console.log("Session exchanged successfully");
        return NextResponse.redirect(`${origin}${next}`);
      }
      console.error("Exchange error:", error);
    } catch (err) {
      console.error("Callback exception:", err);
    }
  }

  return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_error`);
}
