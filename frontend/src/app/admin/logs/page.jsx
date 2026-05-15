"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(() => {
      loadLogs();
    }, 5000); // every 5 sec

    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const res = await api.get("/admin/logs");

      // SAFE DATA HANDLE
      if (Array.isArray(res.data)) {
        setLogs(res.data.reverse());
      } else if (res.data?.logs) {
        setLogs(res.data.logs);
      } else {
        setLogs([]);
      }

    } catch (err) {
      console.error("log load error", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            System Logs
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Monitor server activity, warnings and critical events
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          {logs.length} Logs
        </div>

      </div>

      <div className="mb-6 flex items-center justify-between bg-white border border-gray-200 rounded-[24px] px-5 py-4 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />

          <span className="text-sm font-medium text-gray-700">
            Live Log Monitoring Enabled
          </span>

        </div>

        <div className="text-xs text-gray-500">
          Auto refresh every 5 seconds
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden max-h-[720px] shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F9FAFB] border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Type</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Message</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Time</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="3" className="text-center py-14 text-gray-500">
                  Loading logs...
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center py-14 text-gray-500">
                  No logs found
                </td>
              </tr>
            )}

            {!loading && logs.map((log, i) => (
              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-gray-50 transition-all"
              >
                <td className="px-6 py-5 text-gray-700">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${log?.type === "ERROR"
                      ? "bg-red-100 text-red-600"
                      : log?.type === "WARNING"
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-green-100 text-green-600"
                      }`}
                  >
                    {log?.type || "N/A"}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm font-medium text-[#111827]">
                  {log?.message || "No message"}
                </td>

                <td className="px-6 py-5 text-gray-700">
                  {log?.created_at
                    ? new Date(log.created_at).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}