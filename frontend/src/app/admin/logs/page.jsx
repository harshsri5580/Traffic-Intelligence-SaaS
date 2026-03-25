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
    <div>
      <h1 className="text-3xl font-bold mb-8">
        System Logs
      </h1>

      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border">Type</th>
              <th className="p-3 border">Message</th>
              <th className="p-3 border">Time</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="3" className="text-center p-6">
                  Loading logs...
                </td>
              </tr>
            )}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center p-6">
                  No logs found
                </td>
              </tr>
            )}

            {!loading && logs.map((log, i) => (
              <tr key={i}>
                <td className="p-2 border">
                  <span className={
  log?.type === "ERROR"
    ? "text-red-600 font-bold"
    : log?.type === "WARNING"
    ? "text-yellow-600 font-bold"
    : "text-green-600 font-bold"
}>
  {log?.type || "N/A"}
</span>
                </td>

                <td className="p-2 border">
                  {log?.message || "No message"}
                </td>

                <td className="p-2 border">
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