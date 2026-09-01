import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { distanceInMeters } from "@/lib/distance";

// Helper: get current date/time in IST (India) regardless of server timezone
function nowInIST() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  return new Date(istString);
}

function toHHMM(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const kgid = (formData.get("kgid") || "").toString().trim();
    const lat = parseFloat(formData.get("lat"));
    const lng = parseFloat(formData.get("lng"));
    const photo = formData.get("photo");

    if (!kgid || isNaN(lat) || isNaN(lng) || !photo) {
      return NextResponse.json(
        { error: "kgid, lat, lng and photo are all required" },
        { status: 400 }
      );
    }

    // 1. Verify teacher exists
    const { data: teacher, error: teacherErr } = await supabaseAdmin
      .from("teachers")
      .select("kgid, name")
      .eq("kgid", kgid)
      .maybeSingle();

    if (teacherErr) {
      return NextResponse.json({ error: teacherErr.message }, { status: 500 });
    }
    if (!teacher) {
      return NextResponse.json(
        { error: "KGID not found in teacher list" },
        { status: 404 }
      );
    }

    // 2. Check time window (admin-configurable, stored in IST HH:MM)
    const { data: settings, error: settingsErr } = await supabaseAdmin
      .from("settings")
      .select("start_time, end_time")
      .eq("id", 1)
      .maybeSingle();

    if (settingsErr) {
      return NextResponse.json({ error: settingsErr.message }, { status: 500 });
    }

    const ist = nowInIST();
    const currentHHMM = toHHMM(ist);
    const startTime = (settings?.start_time || "00:00").slice(0, 5);
    const endTime = (settings?.end_time || "23:59").slice(0, 5);

    if (currentHHMM < startTime || currentHHMM > endTime) {
      return NextResponse.json(
        {
          error: `Attendance can only be marked between ${startTime} and ${endTime}. The current time is ${currentHHMM}.`,
        },
        { status: 403 }
      );
    }

    // 3. Check geofence
    const schoolLat = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LAT);
    const schoolLng = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LNG);
    const allowedRadius = parseFloat(
      process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || "1000"
    );

    const dist = distanceInMeters(lat, lng, schoolLat, schoolLng);
    if (dist > allowedRadius) {
      return NextResponse.json(
        {
          error: `You are ${Math.round(
            dist
          )} meters away from the school. The allowed radius is ${allowedRadius}m. Please enter the school premises and try again.`,
        },
        { status: 403 }
      );
    }

    // 4. Check duplicate for today (IST date)
    const dateStr = toDateStr(ist);
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("attendance")
      .select("id")
      .eq("kgid", kgid)
      .eq("date", dateStr)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json(
        { error: "Your attendance has already been marked for today." },
        { status: 409 }
      );
    }

    // 5. Upload photo to storage
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = (photo.type && photo.type.split("/")[1]) || "jpg";
    const filePath = `${dateStr}/${kgid}-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("attendance-photos")
      .upload(filePath, buffer, {
        contentType: photo.type || "image/jpeg",
        upsert: false,
      });

    if (uploadErr) {
      return NextResponse.json({ error: uploadErr.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("attendance-photos")
      .getPublicUrl(filePath);

    // 6. Insert attendance record
    const { error: insertErr } = await supabaseAdmin.from("attendance").insert({
      kgid,
      name: teacher.name,
      date: dateStr,
      marked_at: new Date().toISOString(),
      lat,
      lng,
      distance_meters: Math.round(dist),
      photo_url: publicUrlData.publicUrl,
    });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, name: teacher.name });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}