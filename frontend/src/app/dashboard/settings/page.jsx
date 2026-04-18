"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { toast } from "react-hot-toast";

export default function SettingsPage() {

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    timezone: "UTC",
    webhook_url: "",
    api_key: ""
  });

  const [password, setPassword] = useState({
    current_password: "",
    new_password: ""
  });

  const [sources, setSources] = useState([]);
  const [newSource, setNewSource] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadProfile();
    loadSources();

  }, []);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const postbackURL = `${BASE_URL}/api/postback?api_key=${profile.api_key}&click_id={clickid}&payout={payout}`;
  // ================= PROFILE =================

  const loadProfile = async () => {
    try {
      const res = await api.get("/user/profile");
      setProfile(res.data || {});
    } catch (err) {
      toast.error("Failed to load profile");
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    setSaving(true);
    try {
      await api.put("/user/profile", profile);
      toast.success("Profile updated 🚀");
    } catch (err) {
      toast.error("Update failed");
    }
    setSaving(false);
  };

  // ================= PASSWORD =================

  const changePassword = async () => {
    if (!password.current_password || !password.new_password) {
      toast.error("Fill all fields");
      return;
    }

    try {
      await api.post("/user/change-password", password);

      setPassword({
        current_password: "",
        new_password: ""
      });

      toast.success("Password changed 🔐");

    } catch (err) {
      toast.error("Password change failed");
    }
  };

  const copyPostback = () => {
    navigator.clipboard.writeText(postbackURL);
    toast.success("Postback copied 🚀");
  };

  // ================= API KEY =================

  const generateAPIKey = async () => {

    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-medium">Generate new API key?</span>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              try {
                const res = await api.post("/user/api-key");
                setProfile({ ...profile, api_key: res.data.api_key });
                toast.success("New API key generated 🚀");
              } catch {
                toast.error("Failed to generate key");
              }
            }}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Yes
          </button>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    ));
  };

  const copyKey = () => {
    if (!profile.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    toast.success("Copied!");
  };

  // ================= SOURCES =================

  const loadSources = async () => {
    try {
      const res = await api.get("/sources/");
      setSources(res.data || []);
    } catch (err) {
      toast.error("Failed to load sources");
    }
  };

  const addSource = async () => {
    if (!newSource.trim()) {
      toast.error("Source name required");
      return;
    }

    try {
      await api.post(`/sources/?name=${newSource.trim()}`);
      setNewSource("");
      loadSources();
      toast.success("Source added");
    } catch (err) {
      toast.error("Add failed");
    }
  };

  const deleteSource = async (id) => {

    toast((t) => (
      <div className="flex flex-col gap-3">
        <span className="font-medium">Delete this source?</span>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              try {
                await api.delete(`/sources/${id}`);
                loadSources();
                toast.success("Deleted 🗑️");
              } catch {
                toast.error("Delete failed");
              }
            }}
            className="px-3 py-1 bg-red-600 text-white rounded"
          >
            Delete
          </button>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    ));

  };

  // ================= UI =================

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (

    <div className="p-8 max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your account, API access and integrations
        </p>
      </div>

      {/* PROFILE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        <h2 className="text-lg font-medium text-gray-800">Profile</h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input className="input" placeholder="Full Name"
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />

          <input className="input" placeholder="Email Address"
            value={profile.email || ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />

          <select className="input"
            value={profile.timezone || "UTC"}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">India</option>
            <option value="America/New_York">USA</option>
            <option value="Europe/London">UK</option>
          </select>

          <input className="input" placeholder="Webhook URL"
            value={profile.webhook_url || ""}
            onChange={(e) => setProfile({ ...profile, webhook_url: e.target.value })}
          />

        </div>

        <button
          onClick={updateProfile}
          disabled={saving}
          className="px-5 py-2 rounded-lg text-white text-sm font-medium
      bg-gradient-to-r from-blue-500 to-indigo-600
      hover:shadow-md transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </div>

      {/* TRAFFIC SOURCES */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        <h2 className="text-lg font-medium text-gray-800">Traffic Sources</h2>

        <div className="flex gap-3">

          <input
            className="input flex-1"
            placeholder="Add new source..."
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
          />

          <button
            onClick={addSource}
            className="px-4 py-2 rounded-lg text-white text-sm
        bg-blue-600 hover:bg-blue-700 transition"
          >
            Add
          </button>

        </div>

        <div className="rounded-xl border overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Source Name</th>
                <th className="p-3 text-center w-[120px]">Action</th>
              </tr>
            </thead>

            <tbody>
              {sources.map(s => (
                <tr key={s.id} className="border-t hover:bg-gray-50 transition">

                  <td className="p-3">{s.name}</td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteSource(s.id)}
                      className="px-3 py-1 rounded-lg text-xs
                  bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>

      </div>

      {/* PASSWORD */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        <h2 className="text-lg font-medium text-gray-800">Security</h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="password"
            placeholder="Current Password"
            className="input"
            value={password.current_password}
            onChange={(e) => setPassword({ ...password, current_password: e.target.value })}
          />

          <input
            type="password"
            placeholder="New Password"
            className="input"
            value={password.new_password}
            onChange={(e) => setPassword({ ...password, new_password: e.target.value })}
          />

        </div>

        <button
          onClick={changePassword}
          className="px-5 py-2 rounded-lg text-white text-sm
      bg-green-600 hover:bg-green-700 transition"
        >
          Update Password
        </button>

      </div>

      {/* API KEY */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        <h2 className="text-lg font-medium text-gray-800">API Access</h2>

        <div className="flex gap-3">

          <input className="input flex-1" value={profile.api_key || ""} readOnly />

          <button onClick={copyKey}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm">
            Copy
          </button>

          <button onClick={generateAPIKey}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm">
            Generate
          </button>

        </div>

      </div>

      {/* POSTBACK */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

        <h2 className="text-lg font-medium text-gray-800">Postback URL</h2>

        <div className="flex gap-3">

          <input
            className="input flex-1"
            value={`${BASE_URL}/api/postback?api_key=${profile.api_key}&click_id={clickid}&payout={payout}`}
            readOnly
          />

          <button
            onClick={copyPostback}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm"
          >
            Copy
          </button>

        </div>

      </div>

    </div>

  );
}

// ================= COMMON STYLES =================
