"use client";

import { useEffect, useState } from "react";

/* ---------- shared icon set (same as home page) ---------- */
const Icon = {
  Users: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clipboard: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Spinner: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p} className={`animate-spin ${p.className || ""}`}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const res = await fetch("/api/admin-data");
    if (res.status === 401) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    const d = await res.json();
    setData(d);
    setStartTime((d.settings?.start_time || "").slice(0, 5));
    setEndTime((d.settings?.end_time || "").slice(0, 5));
    setAuthed(true);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Incorrect password");
      return;
    }
    await loadData();
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    setSaveMsg("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_time: startTime, end_time: endTime }),
    });
    setSavingSettings(false);
    if (res.ok) {
      setSaveMsg("Time window updated ✓");
      loadData();
    } else {
      setSaveMsg("Save failed, please try again");
    }
  }

  const Footer = () => (
    <div className="flex justify-center mt-8">
      <div className="flex items-center gap-2.5 text-[13px] text-gray-700 bg-gradient-to-r from-yellow-50 via-pink-50 to-purple-50 border border-pink-200 rounded-full px-5 py-2.5 shadow-md hover:shadow-lg transition-shadow duration-300">
        <p>
          Made with ❤️ by{" "}
          <span className="font-bold text-purple-700">
            D M Mohamad Mohiuddin Mushahedulla
          </span>{" "}
          · AI Teacher · Govt Girls High School Molakalmuru
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
        <Icon.Spinner className="w-8 h-8 text-brand-500" />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200 flex items-center justify-center">
              <Icon.Lock className="w-7 h-7 text-white" />
            </div>
          </div>

          <form
            onSubmit={handleLogin}
            className="w-full bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 sm:p-7 space-y-4"
          >
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight text-center">
              Admin Login
            </h1>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
            />
            {loginError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 active:scale-[0.99] text-white font-semibold rounded-xl py-3 shadow-md shadow-brand-200 transition"
            >
              Login
            </button>
          </form>

          <Footer />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-200 flex items-center justify-center">
              <Icon.Clipboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <a
            href="/api/admin-export"
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 active:scale-[0.99] text-white text-sm font-semibold rounded-xl px-4 py-2.5 shadow-md shadow-brand-200 transition"
          >
            <Icon.Download className="w-4 h-4" />
            Download Excel
          </a>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Icon.Users className="w-3.5 h-3.5" />
              Total Teachers
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {data?.teacherCount ?? "-"}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <Icon.Clipboard className="w-3.5 h-3.5" />
              Total Attendance Records
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {data?.attendance?.length ?? "-"}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 p-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
              <Icon.Clock className="w-3.5 h-3.5" />
              Attendance Time Window
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-brand-600 to-brand-700 text-white rounded-lg px-3 py-1.5 disabled:opacity-50 shadow-sm"
            >
              {savingSettings && <Icon.Spinner className="w-3 h-3" />}
              {savingSettings ? "Saving..." : "Save"}
            </button>
            {saveMsg && <p className="text-xs text-gray-500 mt-1.5">{saveMsg}</p>}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-md shadow-gray-200/50 border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50/60 text-brand-700 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">KGID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Distance</th>
                <th className="px-4 py-3 font-semibold">Photo</th>
              </tr>
            </thead>
            <tbody>
              {data?.attendance?.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-gray-100 hover:bg-brand-50/30 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.kgid}</td>
                  <td className="px-4 py-3 text-gray-600">{r.date}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(r.marked_at).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.distance_meters}m</td>
                  <td className="px-4 py-3">
                    <a
                      href={r.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 font-medium hover:underline"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.attendance?.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">
              No attendance records yet
            </p>
          )}
        </div>

        <Footer />
      </div>
    </main>
  );
}
