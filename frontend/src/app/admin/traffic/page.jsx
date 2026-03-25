"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";


export default function AdminTrafficPage() {

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadTraffic();

    const interval = setInterval(() => {
      loadTraffic();
    }, 5000);

    return () => clearInterval(interval);

  }, []);


  const loadTraffic = async () => {

    try {

      const res = await api.get("/admin/traffic");

      setLogs(res.data || []);

    } catch (err) {

      console.error("traffic load error", err);

    } finally {

      setLoading(false);

    }

  };

  // 🔍 SEARCH FILTER
  const filteredLogs = logs.filter((log) =>
    log.ip_address?.includes(search) ||
    log.country?.toLowerCase().includes(search.toLowerCase()) ||
    log.device_type?.toLowerCase().includes(search.toLowerCase())
  );

useEffect(() => {
  setPage(1);
}, [search]);
  const start = (page - 1) * limit;
const paginatedLogs = filteredLogs.slice(start, start + limit);

const totalPages = Math.ceil(filteredLogs.length / limit);

  // 🎨 STATUS COLOR
  const statusColor = (status) => {

    if (status === "blocked") return "bg-red-500";
    if (status === "offer") return "bg-green-500";
    if (status === "rule") return "bg-blue-500";
    if (status === "fallback") return "bg-yellow-500";

    return "bg-gray-400";

  };

  return (

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Traffic Monitor
      </h1>

      {/* 🔍 SEARCH BAR */}
      <input
        type="text"
        placeholder="Search IP / Country / Device..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-md"
      />

      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-3 border">IP</th>
              <th className="p-3 border">Country</th>
              <th className="p-3 border">Device</th>
              <th className="p-3 border">Campaign</th>
              <th className="p-3 border">Offer</th>
              <th className="p-3 border">Bot Score</th>
              <th className="p-3 border">Decision</th>
              <th className="p-3 border">Time</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="8" className="text-center p-6">
                  Loading traffic...
                </td>
              </tr>
            )}

            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  No traffic data found
                </td>
              </tr>
            )}

           {!loading && paginatedLogs.map((log, i) => (

              <tr key={i} className="text-center hover:bg-gray-50">

                <td className="p-2 border font-mono text-xs">
                  {log.ip_address || "-"}
                </td>

                <td className="p-2 border">
                  {log.country || "Unknown"}
                </td>

                <td className="p-2 border">
                  {log.device_type || "Unknown"}
                </td>

                <td className="p-2 border text-xs">
                  {log.campaign_name || log.campaign_id}
                </td>

                <td className="p-2 border text-xs">
                  {log.offer_name || log.offer_id || "-"}
                </td>

                <td className="p-2 border font-bold">
                  {log.bot_score ?? 0}
                </td>

                <td className="p-2 border">
                  <span className={`text-white text-xs px-2 py-1 rounded ${statusColor(log.status)}`}>
                    {log.status || "unknown"}
                  </span>
                </td>

                <td className="p-2 border text-xs">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : "-"
                  }
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="flex justify-center gap-2 mt-4">

  <button
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
    className="px-3 py-1 border rounded"
  >
    Prev
  </button>

  <span className="px-3 py-1">
    Page {page} / {totalPages || 1}
  </span>

  <button
    onClick={() => setPage(page + 1)}
    disabled={page === totalPages}
    className="px-3 py-1 border rounded"
  >
    Next
  </button>

</div>

      </div>

    </div>

  );

}