"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminUsersPage() {

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadUsers();

  }, []);

  const loadUsers = async () => {

    try {

      const res = await api.get("/admin/users-overview");

      setUsers(res.data || []);

    } catch (err) {

      console.error("users load error", err);

    } finally {

      setLoading(false);

    }

  };

  const deleteUser = async (id, status) => {

    if (status) {
      alert("❌ Block user first");
      return;
    }

    if (!confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/user/${id}`);
      loadUsers();
    } catch (err) {
      console.error("FULL ERROR:", err.response?.data || err);
    }
  };

  const toggleUserStatus = async (user) => {
    try {

      if (user.status) {
        await api.post(`/admin/user/${user.id}/block`);
      } else {
        await api.post(`/admin/user/${user.id}/unblock`);
      }

      // 🔥 instant UI update
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, status: !user.status } : u
        )
      );

    } catch (err) {
      console.error("status error", err);
    }
  };

  return (

    <div className="min-h-screen bg-[#F3F4F6]">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            Users
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Manage platform users and suspicious accounts
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          {users.length} Total Users
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">

        <table className="w-full text-sm text-left">

          <thead className="bg-[#F9FAFB] border-b border-gray-200">

            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">ID</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Email</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Plan</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Campaigns</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Active</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">IP</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Clicks</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Actions</th>
            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>
                <td colSpan="9" className="text-center py-12 text-gray-500">
                  Loading users...
                </td>
              </tr>

            )}

            {!loading && users.map((user) => (

              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-all"
              >

                <td className="px-6 py-5 text-gray-700">
                  {user.id}
                </td>

                <td className="px-6 py-5 font-medium text-[#111827]">
                  {user.email}
                </td>

                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {user.plan || "free"}
                </span>

                <td className="px-6 py-5 text-gray-700">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.status ? "bg-green-500" : "bg-red-500"
                    }`}>
                    {user.status ? "Active" : "Disabled"}
                  </span>
                </td>

                <td className="px-6 py-5 text-gray-700">
                  {user.campaigns || 0}
                </td>


                <td className="px-6 py-5 text-gray-700">
                  {user.active_campaigns || 0}
                </td>
                <td className="px-6 py-5 text-gray-700">
                  {user.latest_ip || "No IP"}
                </td>
                <td className="px-6 py-5 text-gray-700">
                  {user.clicks || 0}
                </td>

                <td className="px-6 py-5 flex gap-3">

                  {/* Block / Unblock */}
                  <button
                    onClick={() => toggleUserStatus(user)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-all ${user.status ? "bg-red-500" : "bg-green-500"
                      }`}
                  >
                    {user.status ? "Block" : "Unblock"}
                  </button>

                  {/* Delete ONLY if blocked */}
                  {!user.status && (
                    <button
                      onClick={() => deleteUser(user.id, user.status)}
                      className="bg-[#111827] hover:bg-black transition-all text-white px-4 py-2 rounded-xl text-sm font-medium"
                    >
                      Delete
                    </button>
                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}