import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const kgid = (searchParams.get("kgid") || "").trim();

  if (!kgid) {
    return NextResponse.json({ error: "KGID required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("teachers")
    .select("kgid, name")
    .eq("kgid", kgid)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "KGID not found in teacher list" },
      { status: 404 }
    );
  }

  return NextResponse.json({ kgid: data.kgid, name: data.name });
}
