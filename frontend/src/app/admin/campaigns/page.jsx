"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminCampaignsPage() {

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadCampaigns();

  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [selectedUser]);

  useEffect(() => {
    fetch("http://localhost:8000/api/admin/users-emails", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => setUsers(data));
  }, []);

  const loadCampaigns = async () => {
    try {

      let url = "/admin/campaigns";

      if (selectedUser) {
        url += `?user_email=${selectedUser}`;
      }

      const res = await api.get(url);

      setCampaigns(res.data || []);

    } catch (err) {
      console.error("campaign load error", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (id) => {

    try {

      await api.post(`/admin/campaigns/${id}/toggle`);

      loadCampaigns();

    } catch (err) {

      console.error("toggle error", err);

    }

  };

  return (

    <div className="min-h-screen bg-[#F3F4F6]">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            Campaigns
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Monitor campaign performance and profitability
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          {campaigns.length} Campaigns
        </div>

      </div>
      <div className="mb-6 flex items-center gap-4">

        <div className="text-sm font-medium text-gray-600">
          Filter by User
        </div>

        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
        >
          <option value="">All Users</option>

          {Array.isArray(users) &&
            users.map((email, i) => (
              <option key={i} value={email}>
                {email}
              </option>
            ))}
        </select>

      </div>
      <div className="mt-4 bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">

        <table className="w-full text-sm text-left">

          <thead className="bg-[#F9FAFB] border-b border-gray-200">

            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Name</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">User</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Clicks</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Revenue</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Cost</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Profit</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">ROI</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Action</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="10" className="text-center py-12 text-gray-500">
                  Loading campaigns...
                </td>
              </tr>
            )}

            {!loading && campaigns.map((c) => {

              const revenue = c.revenue || 0;
              const cost = c.cost || 0;
              const profit = revenue - cost;
              const roi = cost > 0 ? ((profit / cost) * 100).toFixed(1) : 0;

              return (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-all"
                >

                  <td className="px-6 py-5 text-gray-700">{c.id}</td>

                  <td className="px-6 py-5 font-semibold text-[#111827]">{c.name}</td>

                  <td className="px-6 py-5 text-xs font-medium text-gray-500">{c.user_email}</td>

                  <td className="px-6 py-5 text-gray-700">{c.clicks || 0}</td>

                  {/* 💰 Revenue */}
                  <td className="px-6 py-5 text-green-600 font-semibold">
                    {revenue}
                  </td>

                  {/* 💸 Cost */}
                  <td className="px-6 py-5 text-gray-700">
                    {cost}
                  </td>

                  {/* 📈 Profit */}
                  <td className={`px-6 py-5 font-semibold ${profit >= 0 ? "text-green-600" : "text-red-500"
                    }`}>
                    {profit}
                  </td>

                  {/* ROI */}
                  <td className={`px-6 py-5 font-semibold ${roi >= 0 ? "text-green-600" : "text-red-500"
                    }`}>
                    {roi}%
                  </td>

                  {/* Status */}
                  <td className="px-6 py-5 text-gray-700">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c.is_active ? "bg-green-500" : "bg-gray-500"
                      }`}>
                      {c.is_active ? "Active" : "Paused"}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-5 text-gray-700">

                    <button
                      onClick={() => toggleCampaign(c.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all ${c.is_active ? "bg-red-500" : "bg-green-500"
                        }`}
                    >
                      {c.is_active ? "Pause" : "Start"}
                    </button>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>

  );

}