"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { useRouter } from "next/navigation";

export default function LogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;
  const [logs, setLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const blockedReasons = ["bot_detected", "fallback", "safe_page", "fraud_traffic"];
  const [loading, setLoading] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [filters, setFilters] = useState({
    campaign_id: "",
    ip: "",
    date: ""
  });

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadData();

  }, []);


  // ✅ separate useEffect
  useEffect(() => {
    const cid = localStorage.getItem("campaign_id");

    if (cid) {
      setFilters(prev => ({
        ...prev,
        campaign_id: cid
      }));
    }
  }, [filters.campaign_id]);
  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/dashboard/logs" && !window.location.search) {
      localStorage.removeItem("campaign_id"); // ✅ clear old filter
    }
  }, []);

  const blockIP = async (ip) => {

    if (!confirm(`Block ${ip}?`)) return;

    try {

      await api.post("/admin/block", null, {
        params: { ip }
      });

      alert("IP blocked");

      loadData(); // 🔥 logs reload

    } catch (err) {

      alert("Block failed");

    }

  };

  const router = useRouter();
  const campaignId =
    typeof window !== "undefined"
      ? localStorage.getItem("campaign_id")
      : null;

  const unblockIP = async (ip) => {

    if (!confirm(`Unblock ${ip}?`)) return;

    await api.delete(`/admin/unblock/${ip}`);

    alert("IP unblocked");

    loadData();

  };

  const loadData = async () => {

    try {

      const cid = filters.campaign_id || localStorage.getItem("campaign_id");

      const [logsRes, campaignsRes, blockedRes] = await Promise.all([
        api.get(`/stats/logs${cid ? `?campaign_id=${cid}` : ""}`),
        api.get("/campaigns/"),
        api.get("/admin/blocked")
      ]);

      setBlockedIPs(blockedRes.data.ips || []);
      setLogs(logsRes.data || []);
      setCampaigns(campaignsRes.data || []);

    } catch (err) {

      console.error("Logs load error", err);

    }

    setLoading(false);

  };

  const exportCSV = () => {

    const headers = [
      "IP", "Country", "Device", "ASN", "ISP",
      "Campaign", "Destination", "Bot Score",
      "Risk Score", "Reason", "Flags", "Fingerprint", "Status", "Time"
    ];

    const rows = logs.map(l => [
      l.ip_address,
      l.country,
      l.device_type,
      l.asn,
      l.isp,
      l.campaign_id,
      l.offer_id,
      l.rule_id,
      l.bot_score,
      l.status,
      l.created_at
    ]);

    let csv = [headers, ...rows].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "traffic_logs.csv";
    a.click();

  };

  const filteredLogs = logs.filter((l) => {

    if (
      filters.campaign_id &&
      String(l.campaign_id) !== String(filters.campaign_id)
    ) {
      return false;
    }

    if (filters.ip && !l.ip_address?.includes(filters.ip)) {
      return false;
    }

    if (filters.date && !l.created_at?.startsWith(filters.date)) {
      return false;
    }

    return true;

  });

  // Pagination logic

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentLogs = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);

  if (loading) {
    return <div className="p-10">Loading logs...</div>
  }

  return (

    <div className="p-6 w-full max-w-[1200px] mx-auto">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Traffic Logs
        </h1>


      </div>
      {/* FILTERS */}

      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-lg shadow-sm border">

        <select
          className="border p-2 rounded"
          value={filters.campaign_id}
          onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value })}
        >

          <option value="">All Campaigns</option>

          {campaigns.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}

        </select>

        <input
          placeholder="Search IP"
          className="border p-2 rounded"
          value={filters.ip}
          onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
        />

        <input
          type="date"
          className="border p-2 rounded"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />

        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>

      </div>

      {/* TABLE */}

      <div className="bg-white shadow rounded-lg overflow-x-auto w-full p-4">

        <table className="w-full text-sm table-fixed">

          <thead className="bg-gray-50 text-gray-600 uppercase text-xs sticky top-0 z-10">

            <tr>

              <th className="p-3 border w-[130px]">IP</th>
              <th className="p-3 border w-[220px]">Country</th>
              <th className="p-3 border w-[100px]">Device</th>
              <th className="p-3 border w-[90px]">ASN</th>
              <th className="p-3 border w-[250px]">ISP</th>
              <th className="p-3 border w-[120px]">Connection</th>
              <th className="p-3 border w-[120px]">Campaign</th>
              <th className="p-3 border w-[200px]">Destination</th>
              <th className="p-3 border w-[90px]">OS</th>
              <th className="p-3 border w-[70px]">Bot</th>
              <th className="p-3 border w-[150px]">Status</th>
              <th className="p-3 border w-[110px]">Browser</th>
              <th className="p-3 border w-[80px]">Risk</th>
              <th className="p-3 border w-[140px]">Reason</th>
              <th className="p-3 border w-[150px]">Flags</th>
              <th className="p-3 border w-[180px]">Fingerprint</th>
              <th className="p-3 border w-[170px]">Time</th>
              <th className="p-3 border w-[100px]">Action</th>

            </tr>

          </thead>

          <tbody>

            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="13" className="p-6 text-center text-gray-500">
                  No logs found
                </td>
              </tr>
            )}

            {currentLogs.map((log, i) => (

              <tr key={i} className="text-center hover:bg-gray-50 transition duration-150">

                <td className="p-2 border font-mono text-xs">
                  {log.ip_address}
                </td>

                <td className="px-3 py-2 border">
                  {log.country} {log.region && `(${log.region})`} {log.city && `- ${log.city}`}
                </td>

                <td className="px-3 py-2 border">
                  {log.device_type || "Unknown"}
                </td>

                <td className="px-3 py-2 border">
                  {log.asn || "-"}
                </td>

                <td className="px-3 py-2 border">
                  {log.isp || "-"}
                </td>
                <td className="px-3 py-2 border">

                  <span className={`px-2 py-1 rounded text-xs
${log.connection_type === "datacenter" ? "bg-red-100 text-red-700" :
                      log.connection_type === "vpn" ? "bg-yellow-100 text-yellow-700" :
                        log.connection_type === "tor" ? "bg-purple-100 text-purple-700" :
                          "bg-green-100 text-green-700"}`}>

                    {log.connection_type || "Residential"}

                  </span>

                </td>
                <td className="p-2 border font-semibold text-indigo-600">
                  {log.campaign}
                </td>

                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs ${log.status?.toLowerCase() === "blocked"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                      }`}
                  >
                    {log.destination}
                  </span>
                </td>

                <td className="px-3 py-2 border">
                  {log.os || "-"}
                </td>

                <td className="px-3 py-2 border">

                  <span className={`px-2 py-1 rounded text-xs font-semibold
${log.bot_score >= 70 ? "bg-red-100 text-red-700" :
                      log.bot_score >= 40 ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"}`}>

                    {log.bot_score ?? 0}

                  </span>

                </td>

                <td className="px-3 py-2 border">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold
${log.status === "offer" ? "bg-green-100 text-green-700" :
                      log.status === "safe" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"}
`}>
                    {log.status === "offer" ? "PASS" :
                      log.status === "safe" ? "SAFE" :
                        "BLOCK"}
                  </span>
                </td>
                <td className="px-3 py-2 border">
                  {log.browser || "-"}
                </td>

                <td className="px-3 py-2 border">

                  <span className={`px-2 py-1 rounded text-xs font-semibold
${log.risk_score >= 70 ? "bg-red-100 text-red-700" :
                      log.risk_score >= 40 ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"}`}>

                    {log.risk_score ?? 0}

                  </span>

                </td>

                <td className="px-3 py-2 border text-xs">
                  {log.reason || "-"}
                </td>

                <td className="px-3 py-2 border text-xs">

                  <div className="flex flex-wrap gap-1 justify-center">

                    {log.connection_type === "vpn" && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">VPN</span>
                    )}

                    {log.connection_type === "datacenter" && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded">DC</span>
                    )}

                    {log.connection_type === "tor" && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">TOR</span>
                    )}

                    {log.bot_score >= 70 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded">BOT</span>
                    )}

                  </div>

                </td>

                <td className="px-3 py-2 border text-xs font-mono">
                  {log.fingerprint || "-"}
                </td>

                <td className="p-2 border text-xs whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString()}
                </td>

                <td className="p-2 border max-w-[200px] truncate">

                  {blockedIPs.includes(log.ip_address) ? (

                    <button
                      onClick={() => unblockIP(log.ip_address)}
                      className="text-green-600 font-semibold"
                    >
                      Unblock
                    </button>

                  ) : (

                    <button
                      onClick={() => blockIP(log.ip_address)}
                      className="text-red-600 font-semibold"
                    >
                      Block
                    </button>

                  )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>



      </div>

      <div className="flex justify-between items-center mt-6 px-4 flex-wrap gap-2">

        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{indexOfFirstRow + 1}</span> –
          <span className="font-medium"> {Math.min(indexOfLastRow, filteredLogs.length)}</span>
          of <span className="font-medium">{filteredLogs.length}</span>
        </div>

        <div className="flex items-center gap-2">

          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm bg-gray-100 rounded-md">
            Page {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>

  );

}