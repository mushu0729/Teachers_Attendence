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

export default function Home() {
  const [locStatus, setLocStatus] = useState("checking"); // checking | ok | denied | out_of_range
  const [distance, setDistance] = useState(null);
  const [coords, setCoords] = useState(null);
  const [windowStatus, setWindowStatus] = useState(null); // {start_time, end_time} or null while loading
  const [kgid, setKgid] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // {ok, message}
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Fetch admin-configured time window (for display only; server re-validates)
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

        // Watermark: lat/lng + timestamp
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
        setResult({ ok: true, message: `Attendance marked ✅ (${data.name})` });
      }
    } catch (e) {
      setResult({ ok: false, message: "Network error, please try again" });
    } finally {
      setSubmitting(false);
    }
  }

  const canFillForm = locStatus === "ok";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <h1 className="text-xl font-bold text-brand-700 mb-1">
          Teacher Attendance
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          Teachers Day Special 
        </p>

        {windowStatus?.start_time && windowStatus?.end_time && (
          <p className="text-xs text-gray-400 mb-4">
            Attendance window: {windowStatus.start_time.slice(0, 5)} –{" "}
            {windowStatus.end_time.slice(0, 5)} IST
          </p>
        )}

        {locStatus === "checking" && (
          <div className="text-center py-8 text-gray-500">
            Checking your location...
          </div>
        )}

        {locStatus === "denied" && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
            Location permission is required. Please allow location access in
            your browser settings and reload the page.
          </div>
        )}

        {locStatus === "out_of_range" && (
          <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm">
            You are {distance}m away from the school. Allowed radius is{" "}
            {ALLOWED_RADIUS}m. Please come within the school premises and
            reload the page.
          </div>
        )}

        {canFillForm && (
          <div className="space-y-4">
            <div className="bg-brand-50 text-brand-700 text-xs rounded-lg px-3 py-2">
              ✓ You are within the school premises ({distance}m)
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KGID Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={kgid}
                onChange={(e) => setKgid(e.target.value)}
                onBlur={lookupKgid}
                placeholder="Enter your KGID number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {lookupLoading && (
                <p className="text-xs text-gray-400 mt-1">Checking...</p>
              )}
              {lookupError && (
                <p className="text-xs text-red-600 mt-1">{lookupError}</p>
              )}
              {teacherName && (
                <p className="text-sm text-brand-700 font-medium mt-1">
                  ✓ {teacherName}
                </p>
              )}
            </div>

            {teacherName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo (take a live photo with your camera)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-600"
                />
                <canvas ref={canvasRef} className="hidden" />
                {photoDataUrl && (
                  <img
                    src={photoDataUrl}
                    alt="preview"
                    className="mt-2 rounded-lg w-full max-h-56 object-cover"
                  />
                )}
              </div>
            )}

            {teacherName && photoDataUrl && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg py-2.5 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Mark Attendance"}
              </button>
            )}

            {result && (
              <div
                className={`text-sm rounded-lg px-3 py-2 ${
                  result.ok
                    ? "bg-brand-50 text-brand-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {result.message}
              </div>
            )}
          </div>
        )}
         <p className="text-center text-[11px] text-gray-400 mt-6">
          Made with love by D M Mohamad Mohiuddin Mushahedulla | AI Teacher | Govt Girls High School
        </p>
      </div>
    </main>
  );
}