import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAuthorized } from "@/lib/adminAuth";

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: attendance, error } = await supabaseAdmin
    .from("attendance")
    .select("id, kgid, name, date, marked_at, distance_meters, photo_url")
    .order("marked_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: settings } = await supabaseAdmin
    .from("settings")
    .select("start_time, end_time")
    .eq("id", 1)
    .maybeSingle();

  const { count: teacherCount } = await supabaseAdmin
    .from("teachers")
    .select("kgid", { count: "exact", head: true });

  return NextResponse.json({ attendance, settings, teacherCount });
}
