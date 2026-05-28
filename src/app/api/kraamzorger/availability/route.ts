import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { userId, availabilityData } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceRole) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseServiceRole,
      "Authorization": `Bearer ${supabaseServiceRole}`,
      "Prefer": "return=representation",
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/kraamzorger_availability`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        kraamzorger_id: userId,
        ...availabilityData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to create availability" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Availability creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseServiceRole,
      "Authorization": `Bearer ${supabaseServiceRole}`,
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/kraamzorger_availability?kraamzorger_id=eq.${userId}&order=day_of_week`,
      { headers }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to fetch availability" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Availability fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const headers = {
      "Content-Type": "application/json",
      "apikey": supabaseServiceRole,
      "Authorization": `Bearer ${supabaseServiceRole}`,
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/kraamzorger_availability?id=eq.${id}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to delete availability" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Availability deletion error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
