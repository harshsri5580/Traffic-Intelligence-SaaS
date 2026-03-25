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

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Users
      </h1>

      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>
  <th className="p-3 border">ID</th>
  <th className="p-3 border">Email</th>
  <th className="p-3 border">Plan</th>
  <th className="p-3 border">Status</th>
  <th className="p-3 border">Campaigns</th>
  <th className="p-3 border">Active</th>
  <th className="p-3 border">Clicks</th>
  <th className="p-3 border">Actions</th>
</tr>

          </thead>

          <tbody>

            {loading && (

              <tr>
                <td colSpan="8" className="text-center p-6">
                  Loading users...
                </td>
              </tr>

            )}

            {!loading && users.map((user) => (

              <tr key={user.id} className="text-center">

                <td className="p-2 border">
                  {user.id}
                </td>

                <td className="p-2 border">
                  {user.email}
                </td>

                <td className="p-2 border">
                  {user.plan || "free"}
                </td>

                <td className="p-2 border">
                  <span className={`px-2 py-1 rounded text-white text-xs ${
  user.status ? "bg-green-500" : "bg-red-500"
}`}>
  {user.status ? "Active" : "Disabled"}
</span>
                </td>

<td className="p-2 border">
  {user.campaigns || 0}
</td>


<td className="p-2 border text-green-600 font-bold">
  {user.active_campaigns || 0}
</td>
<td className="p-2 border">
  {user.clicks || 0}
</td>

               <td className="p-2 border flex gap-2 justify-center">

  {/* Block / Unblock */}
  <button
    onClick={() => toggleUserStatus(user)}
    className={`px-3 py-1 rounded text-white ${
      user.status ? "bg-red-500" : "bg-green-500"
    }`}
  >
    {user.status ? "Block" : "Unblock"}
  </button>

  {/* Delete ONLY if blocked */}
  {!user.status && (
    <button
      onClick={() => deleteUser(user.id, user.status)}
      className="bg-black text-white px-3 py-1 rounded"
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