"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminSystemPage() {

  // 🔹 SYSTEM SETTINGS
  const [settings, setSettings] = useState({
    max_campaigns: 10,
    max_offers: 50,
    max_rules: 100
  });

  // 🔹 ADMIN PROFILE
  const [admin, setAdmin] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get("/admin/system-settings");

      setSettings({
        max_campaigns: res.data.max_campaigns || 10,
        max_offers: res.data.max_offers || 50,
        max_rules: res.data.max_rules || 100
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 SETTINGS CHANGE
  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: Number(value)
    }));
  };

  // 🔥 ADMIN INPUT CHANGE
  const handleAdminChange = (key, value) => {
    setAdmin(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 🔥 SAVE SETTINGS
  const saveSettings = async () => {
    try {
      await api.post("/admin/system-settings", settings);
      alert("Settings saved ✅");
    } catch (err) {
      alert("Save failed ❌");
    }
  };

  // 🔥 UPDATE ADMIN
  const updateAdmin = async () => {
    try {
      await api.put("/admin/update", admin);
      alert("Admin updated ✅");
    } catch (err) {
      alert("Update failed ❌");
    }
  };

  return (
    <div>

      <h1 className="text-3xl font-bold mb-8">
        Admin Panel
      </h1>

      {loading && <p>Loading...</p>}

      {!loading && (
        <div className="space-y-8">

          {/* 🔐 ADMIN PROFILE */}
          <div className="bg-white shadow rounded p-6 space-y-4">
            <h2 className="text-xl font-semibold">
              Admin Profile
            </h2>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                className="border p-2 w-full rounded"
                placeholder="New email"
                onChange={(e) => handleAdminChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">New Password</label>
              <input
                type="password"
                className="border p-2 w-full rounded"
                placeholder="New password"
                onChange={(e) => handleAdminChange("password", e.target.value)}
              />
            </div>

            <button
              onClick={updateAdmin}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Update Admin
            </button>
          </div>

          {/* ⚙ SYSTEM SETTINGS */}
          <div className="bg-white shadow rounded p-6 space-y-4">

            <h2 className="text-xl font-semibold">
              System Settings
            </h2>

            <div>
              <label className="block text-sm mb-1">Max Campaigns</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={settings.max_campaigns}
                onChange={(e) => handleChange("max_campaigns", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Max Offers</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={settings.max_offers}
                onChange={(e) => handleChange("max_offers", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Max Rules</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={settings.max_rules}
                onChange={(e) => handleChange("max_rules", e.target.value)}
              />
            </div>

            <button
              onClick={saveSettings}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save Settings
            </button>

          </div>

        </div>
      )}

    </div>
  );
}