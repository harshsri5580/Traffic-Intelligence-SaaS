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

    <div className="min-h-screen bg-[#F3F4F6]">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            Traffic Monitor
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Live traffic intelligence and fraud monitoring
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          {filteredLogs.length} Traffic Logs
        </div>

      </div>

      {/* 🔍 SEARCH BAR */}
      <div className="mb-6 flex items-center gap-4">

        <input
          type="text"
          placeholder="Search IP / Country / Device..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
        />

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-600 shadow-sm">
          Auto Refresh: 5s
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">

        <table className="w-full text-sm text-left">

          <thead className="bg-[#F9FAFB] border-b border-gray-200">

            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">IP</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Country</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Device</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Campaign</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Offer</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Bot Score</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Decision</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Time</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="8" className="text-center py-14 text-gray-500">
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

              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-gray-50 transition-all"
              >

                <td className="px-6 py-5 font-mono text-xs text-gray-600">
                  {log.ip_address || "-"}
                </td>

                <td className="px-6 py-5 text-gray-700">
                  {log.country || "Unknown"}
                </td>

                <td className="px-6 py-5 text-gray-700">
                  {log.device_type || "Unknown"}
                </td>

                <td className="px-6 py-5 text-xs font-medium text-gray-500">
                  {log.campaign_name || log.campaign_id}
                </td>

                <td className="px-6 py-5 text-xs font-medium text-gray-500">
                  {log.offer_name || log.offer_id || "-"}
                </td>

                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(log.bot_score ?? 0) > 70
                  ? "bg-red-100 text-red-600"
                  : (log.bot_score ?? 0) > 40
                    ? "bg-yellow-100 text-yellow-600"
                    : "bg-green-100 text-green-600"
                  }`}>
                  {log.bot_score ?? 0}
                </span>

                <td className="px-6 py-5 text-gray-700">
                  <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full ${statusColor(log.status)}`}>
                    {log.status || "unknown"}
                  </span>
                </td>

                <td className="px-6 py-5 text-xs font-medium text-gray-500">
                  {log.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : "-"
                  }
                </td>

              </tr>

            ))}

          </tbody>

        </table>

        <div className="flex items-center justify-between px-6 py-5 bg-[#FAFAFA]">

          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm font-medium text-gray-600">
            Page {page} / {totalPages || 1}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>

    </div>

  );

}