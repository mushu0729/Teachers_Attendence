import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAuthorized } from "@/lib/adminAuth";
import * as XLSX from "xlsx";

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select("kgid, name, date, marked_at, distance_meters, photo_url")
    .order("date", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data.map((r) => ({
    KGID: r.kgid,
    Name: r.name,
    Date: r.date,
    "Marked At (IST)": new Date(r.marked_at).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
    "Distance from School (m)": r.distance_meters,
    "Photo URL": r.photo_url,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx"`,
    },
  });
}
