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

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Campaigns
      </h1>
<select
  value={selectedUser}
  onChange={(e) => setSelectedUser(e.target.value)}
  className="mb-4 p-2 border rounded"
>
  <option value="">All Users</option>
 {Array.isArray(users) &&
  users.map((email, i) => (
    <option key={i} value={email}>
      {email}
    </option>
))}
</select>
      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

           <tr>
  <th className="p-3 border">ID</th>
  <th className="p-3 border">Name</th>
  <th className="p-3 border">User</th>
  <th className="p-3 border">Clicks</th>
  <th className="p-3 border">Revenue</th>
  <th className="p-3 border">Cost</th>
  <th className="p-3 border">Profit</th>
  <th className="p-3 border">ROI</th>
  <th className="p-3 border">Status</th>
  <th className="p-3 border">Action</th>
</tr>

          </thead>

         <tbody>

  {loading && (
    <tr>
      <td colSpan="8" className="text-center p-6">
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
      <tr key={c.id} className="text-center">

        <td className="p-2 border">{c.id}</td>

        <td className="p-2 border font-medium">{c.name}</td>

        <td className="p-2 border text-xs">{c.user_email}</td>

        <td className="p-2 border">{c.clicks || 0}</td>

        {/* 💰 Revenue */}
        <td className="p-2 border text-green-600 font-bold">
          {revenue}
        </td>

        {/* 💸 Cost */}
        <td className="p-2 border">
          {cost}
        </td>

        {/* 📈 Profit */}
        <td className={`p-2 border font-bold ${
          profit >= 0 ? "text-green-600" : "text-red-500"
        }`}>
          {profit}
        </td>

        {/* ROI */}
        <td className={`p-2 border ${
          roi >= 0 ? "text-green-600" : "text-red-500"
        }`}>
          {roi}%
        </td>

        {/* Status */}
        <td className="p-2 border">
          <span className={`px-2 py-1 rounded text-white text-xs ${
            c.is_active ? "bg-green-500" : "bg-gray-500"
          }`}>
            {c.is_active ? "Active" : "Paused"}
          </span>
        </td>

        {/* Action */}
        <td className="p-2 border">

          <button
            onClick={() => toggleCampaign(c.id)}
            className={`px-3 py-1 rounded text-white ${
              c.is_active ? "bg-red-500" : "bg-green-500"
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