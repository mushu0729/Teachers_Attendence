"use client";

import { useEffect, useRef, useState } from "react";

const SCHOOL_LAT = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LAT);
const SCHOOL_LNG = parseFloat(process.env.NEXT_PUBLIC_SCHOOL_LNG);
const ALLOWED_RADIUS = parseFloat(
  process.env.NEXT_PUBLIC_ALLOWED_RADIUS_METERS || "1000"
);

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ---------- tiny inline icon set (no extra deps) ---------- */
const Icon = {
  Pin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 22s7-7.58 7-12A7 7 0 0 0 5 10c0 4.42 7 12 7 12z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...p}>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Camera: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Spinner: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p} className={`animate-spin ${p.className || ""}`}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export default function Home() {
  const [locStatus, setLocStatus] = useState("checking"); // checking | ok | denied | out_of_range
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null);
  const [kgid, setKgid] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setWindowStatus(d))
      .catch(() => setWindowStatus(null));

    if (!navigator.geolocation) {
      setLocStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const d = distanceInMeters(latitude, longitude, SCHOOL_LAT, SCHOOL_LNG);
        setDistance(Math.round(d));
        setLocStatus(d <= ALLOWED_RADIUS ? "ok" : "out_of_range");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  async function lookupKgid() {
    setLookupError("");
    setTeacherName("");
    if (!kgid.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/teacher?kgid=${encodeURIComponent(kgid.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "KGID not found");
      } else {
        setTeacherName(data.name);
      }
    } catch (e) {
      setLookupError("Network error, please try again");
    } finally {
      setLookupLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file || !coords) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const fontSize = Math.max(18, Math.round(img.width * 0.025));
        ctx.font = `bold ${fontSize}px sans-serif`;
        const nowStr = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });
        const line1 = `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`;
        const line2 = nowStr;
        const padding = fontSize * 0.6;
        const boxHeight = fontSize * 2.6;

        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, img.height - boxHeight, img.width, boxHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(line1, padding, img.height - boxHeight + fontSize);
        ctx.fillText(line2, padding, img.height - boxHeight + fontSize * 2);

        canvas.toBlob(
          (blob) => {
            setPhotoBlob(blob);
            setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.85));
          },
          "image/jpeg",
          0.85
        );
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setResult(null);
    if (!teacherName) {
      setResult({ ok: false, message: "Please enter a valid KGID first" });
      return;
    }
    if (!photoBlob) {
      setResult({ ok: false, message: "Photo is required" });
      return;
    }
    if (!coords) {
      setResult({ ok: false, message: "Could not get your location, please refresh the page" });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("kgid", kgid.trim());
      fd.append("lat", coords.lat);
      fd.append("lng", coords.lng);
      fd.append("photo", photoBlob, "attendance.jpg");

      const res = await fetch("/api/attendance", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        setResult({ ok: false, message: data.error || "Something went wrong" });
      } else {
        setResult({ ok: true, message: `Attendance marked successfully (${data.name})` });
      }
    } catch (e) {
      setResult({ ok: false, message: "Network error, please try again" });
    } finally {
      setSubmitting(false);
    }
  }

  const canFillForm = locStatus === "ok";

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        {/* Header badge */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200 flex items-center justify-center">
            <Icon.Pin className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="w-full bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 sm:p-7">
          <div className="text-center mb-5">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Teacher Attendance
            </h1>
            <p className="text-sm text-brand-600 font-medium mt-1">
              ✨ Teachers Day Special
            </p>
          </div>

          {windowStatus?.start_time && windowStatus?.end_time && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5 mb-5 w-fit mx-auto">
              <Icon.Clock className="w-3.5 h-3.5" />
              <span>
                Window: {windowStatus.start_time.slice(0, 5)} – {windowStatus.end_time.slice(0, 5)} IST
              </span>
            </div>
          )}

          {/* Location states */}
          {locStatus === "checking" && (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
              <Icon.Spinner className="w-8 h-8 text-brand-500" />
              <span className="text-sm">Checking your location...</span>
            </div>
          )}

          {locStatus === "denied" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm">
              <Icon.Alert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                Location permission is required. Please allow location access
                in your browser settings and reload the page.
              </span>
            </div>
          )}

          {locStatus === "out_of_range" && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm">
              <Icon.Alert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>
                You are <b>{distance}m</b> away from the school. Allowed
                radius is {ALLOWED_RADIUS}m. Please come within the school
                premises and reload the page.
              </span>
            </div>
          )}

          {canFillForm && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium rounded-full px-3.5 py-2 w-fit border border-brand-100">
                <Icon.Check className="w-3.5 h-3.5" />
                Within school premises · {distance}m
              </div>

              {/* KGID input */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Icon.User className="w-4 h-4 text-brand-500" />
                  KGID Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={kgid}
                    onChange={(e) => setKgid(e.target.value)}
                    onBlur={lookupKgid}
                    placeholder="Enter your KGID number"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
                  />
                  {lookupLoading && (
                    <Icon.Spinner className="w-4 h-4 text-brand-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {lookupError && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <Icon.Alert className="w-3.5 h-3.5" /> {lookupError}
                  </p>
                )}
                {teacherName && (
                  <p className="text-sm text-brand-700 font-semibold mt-1.5 flex items-center gap-1">
                    <Icon.Check className="w-4 h-4" /> {teacherName}
                  </p>
                )}
              </div>

              {/* Photo */}
              {teacherName && (
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                    <Icon.Camera className="w-4 h-4 text-brand-500" />
                    Live Photo
                  </label>

                  {!photoDataUrl ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-brand-300 hover:bg-brand-50/50 rounded-2xl py-8 text-gray-400 transition"
                    >
                      <Icon.Camera className="w-7 h-7" />
                      <span className="text-xs font-medium">Tap to take a photo</span>
                    </button>
                  ) : (
                    <div className="relative group">
                      <img
                        src={photoDataUrl}
                        alt="preview"
                        className="rounded-2xl w-full max-h-56 object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-white/90 backdrop-blur text-xs font-medium text-brand-700 rounded-full px-3 py-1.5 shadow border border-gray-100"
                      >
                        Retake
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}

              {teacherName && photoDataUrl && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 active:scale-[0.99] text-white font-semibold rounded-xl py-3 shadow-md shadow-brand-200 disabled:opacity-50 transition"
                >
                  {submitting && <Icon.Spinner className="w-4 h-4" />}
                  {submitting ? "Submitting..." : "Mark Attendance"}
                </button>
              )}

              {result && (
                <div
                  className={`flex items-start gap-2 text-sm rounded-2xl px-4 py-3 border ${
                    result.ok
                      ? "bg-brand-50 text-brand-700 border-brand-100"
                      : "bg-red-50 text-red-700 border-red-100"
                  }`}
                >
                  {result.ok ? (
                    <Icon.Check className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <Icon.Alert className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span>{result.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

      <div className="flex justify-center mt-6">
  <div className="flex items-center gap-2.5 text-[13px] text-gray-700 bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 border border-pink-200 rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transition-shadow duration-300">
    <p>
      Made with ❤️ by <span className="font-semibold text-purple-700">D M Mohamad Mohiuddin Mushahedulla</span> · AI Teacher · Govt Girls High School Molakalmuru
    </p>
  </div>
</div>
      </div>
    </main>
  );
}
