import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAuthorized } from "@/lib/adminAuth";

// GET is public - the teacher-facing page needs to know the time window
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("start_time, end_time")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST is admin-only - lets the BEO/admin change the window any time
export async function POST(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { start_time, end_time } = body;

  if (!start_time || !end_time) {
    return NextResponse.json(
      { error: "start_time and end_time required (HH:MM)" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("settings")
    .update({ start_time, end_time })
    .eq("id", 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
