import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    const { registration_id } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: "Missing registration_id" },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: "irvine_allstars" },
    });

    // Only update if status is "registered" or "invited"
    const { data: reg } = await supabase
      .from("tryout_registrations")
      .select("id, status")
      .eq("id", registration_id)
      .single();

    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    if (reg.status === "registered" || reg.status === "invited") {
      const { error } = await supabase
        .from("tryout_registrations")
        .update({ status: "confirmed" })
        .eq("id", registration_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, status: "confirmed" });
    }

    // Already confirmed or beyond
    return NextResponse.json({ success: true, status: reg.status });
  } catch (err) {
    console.error("Confirm tryout error:", err);
    return NextResponse.json(
      { error: "Failed to confirm" },
      { status: 500 }
    );
  }
}
