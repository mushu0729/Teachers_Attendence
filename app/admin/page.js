"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  async function loadData() {
    const res = await fetch("/api/admin-data");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const d = await res.json();
    setData(d);
    setStartTime((d.settings?.start_time || "").slice(0, 5));
    setEndTime((d.settings?.end_time || "").slice(0, 5));
    setAuthed(true);
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

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 space-y-4"
        >
          <h1 className="text-lg font-bold text-gray-800">Admin Login</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {loginError && (
            <p className="text-sm text-red-600">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg py-2.5"
          >
            Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <a
          href="/api/admin-export"
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          Download Excel
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Total Teachers</p>
          <p className="text-2xl font-bold text-gray-800">
            {data?.teacherCount ?? "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400">Total Attendance Records</p>
          <p className="text-2xl font-bold text-gray-800">
            {data?.attendance?.length ?? "-"}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-2">Attendance Time Window</p>
          <div className="flex gap-2 items-center">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="mt-2 text-xs bg-gray-800 text-white rounded px-3 py-1.5 disabled:opacity-50"
          >
            {savingSettings ? "Saving..." : "Save"}
          </button>
          {saveMsg && <p className="text-xs text-gray-500 mt-1">{saveMsg}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">KGID</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Distance</th>
              <th className="px-4 py-2">Photo</th>
            </tr>
          </thead>
          <tbody>
            {data?.attendance?.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2">{r.kgid}</td>
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2">
                  {new Date(r.marked_at).toLocaleTimeString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="px-4 py-2">{r.distance_meters}m</td>
                <td className="px-4 py-2">
                  <a
                    href={r.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.attendance?.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            No attendance records yet
          </p>
        )}
         <p className="text-center text-[11px] text-gray-400 mt-6">
          Made with love by D M Mohamad Mohiuddin Mushahedulla | AI Teacher | Govt Girls High School
        </p>
      </div>
    </main>
  );
}