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
    <div className="min-h-screen bg-[#F3F4F6]">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            System Settings
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Configure platform limits and administrator access
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          Core System Control
        </div>

      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-[#111827] rounded-[28px] px-6 py-5">

          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Max Campaigns
          </div>

          <div className="text-3xl font-semibold text-white">
            {settings.max_campaigns}
          </div>

        </div>

        <div className="bg-white border border-gray-200 rounded-[28px] px-6 py-5 shadow-sm">

          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Max Offers
          </div>

          <div className="text-3xl font-semibold text-[#111827]">
            {settings.max_offers}
          </div>

        </div>

        <div className="bg-white border border-gray-200 rounded-[28px] px-6 py-5 shadow-sm">

          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Max Rules
          </div>

          <div className="text-3xl font-semibold text-[#111827]">
            {settings.max_rules}
          </div>

        </div>

      </div>
      {loading && (
        <div className="bg-white border border-gray-200 rounded-[28px] p-10 text-center text-gray-500 shadow-sm">
          Loading system configuration...
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* 🔐 ADMIN PROFILE */}
          <div className="bg-white border border-gray-200 rounded-[28px] p-7 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[#111827] mb-6">
              Admin Profile
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
              <input
                className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New email"
                onChange={(e) => handleAdminChange("email", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">New Password</label>
              <input
                type="password"
                className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="New password"
                onChange={(e) => handleAdminChange("password", e.target.value)}
              />
            </div>

            <div className="pt-4">

              <button
                onClick={updateAdmin}
                className="h-12 px-5 rounded-2xl bg-[#111827] hover:bg-black transition-all text-white text-sm font-medium shadow-sm"
              >
                Update Admin
              </button>

            </div>
          </div>

          {/* ⚙ SYSTEM SETTINGS */}
          <div className="bg-white border border-gray-200 rounded-[28px] p-7 shadow-sm">

            <h2 className="text-2xl font-semibold tracking-tight text-[#111827] mb-6">
              System Settings
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Max Campaigns</label>
              <input
                type="number"
                className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.max_campaigns}
                onChange={(e) => handleChange("max_campaigns", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Max Offers</label>
              <input
                type="number"
                className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.max_offers}
                onChange={(e) => handleChange("max_offers", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Max Rules</label>
              <input
                type="number"
                className="w-full h-12 bg-[#F9FAFB] border border-gray-200 rounded-2xl px-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                value={settings.max_rules}
                onChange={(e) => handleChange("max_rules", e.target.value)}
              />
            </div>

            <div className="pt-4">

              <button
                onClick={saveSettings}
                className="h-12 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all text-white text-sm font-medium shadow-sm"
              >
                Save Settings
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}