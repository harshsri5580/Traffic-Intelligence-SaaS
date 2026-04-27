"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;
  const [logs, setLogs] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const blockedReasons = ["bot_detected", "fallback", "safe_page", "fraud_traffic"];
  const [loading, setLoading] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [filters, setFilters] = useState({
    campaign_id: "",
    ip: "",
    date: ""
  });

  const [visibleColumns, setVisibleColumns] = useState({
    ip: true,
    country: true,
    device: true,
    asn: true,
    isp: true,
    connection: true,
    campaign: true,
    destination: true,
    os: true,
    user_agent: true,
    bot: true,
    status: true,
    browser: true,
    risk: true,
    reason: true,
    ip_timezone: true,
    flags: true,
    fingerprint: true,
    time: true,
    referrer: true,
    // subdata: true,
    action: true,
  });
  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadData();

  }, [currentPage, filters.campaign_id]);


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

    try {

      await api.post("/admin/block", null, {
        params: { ip }
      });

      toast.success("IP blocked successfully");
      loadData();

    } catch (err) {

      toast.error("Block failed");

    }

  };

  const router = useRouter();
  const campaignId =
    typeof window !== "undefined"
      ? localStorage.getItem("campaign_id")
      : null;

  const unblockIP = async (ip) => {

    try {

      await api.delete(`/admin/unblock/${ip}`);

      toast.success("IP unblocked successfully");
      loadData();

    } catch (err) {
      toast.error("Unblock failed");
    }

  };

  const loadData = async () => {

    setLoading(true); // ✅ ADD THIS (FIRST LOAD)
    setPageLoading(true);

    try {
      const cid = filters.campaign_id || localStorage.getItem("campaign_id");

      const [logsRes, campaignsRes, blockedRes] = await Promise.all([
        api.get(`/stats/logs?page=${currentPage}&limit=${rowsPerPage}${cid ? `&campaign_id=${cid}` : ""}`),
        api.get("/campaigns/"),
        api.get("/admin/blocked")
      ]);

      setBlockedIPs(blockedRes.data.ips || []);
      setLogs(logsRes.data.logs || []);
      setTotalCount(logsRes.data.total || 0);
      setCampaigns(campaignsRes.data || []);

    } catch (err) {
      console.error("Logs load error", err);
    }

    setLoading(false);      // ✅ 🔥 THIS WAS MISSING
    setPageLoading(false);
  };

  const exportCSV = () => {

    const headers = [
      "IP",
      "Country",
      "Device",
      "ASN",
      "ISP",
      "Campaign",
      "Browser",
      "Destination",
      "OS",
      "Timezone",
      "User Agent",
      "Bot Score",
      "Risk Score",
      "Status",
      "Reason",
      "Referrer",
      "Time"
    ];

    const rows = filteredLogs.map(l => [
      l.ip_address || "-",
      l.country || "-",
      l.device_type || "-",
      l.asn || "-",
      l.isp || "-",

      l.campaign || "-",
      l.browser || "-",       // ✅ FIX
      l.destination || "-",     // ✅ FIX

      l.os || "-",
      l.ip_timezone || "-",
      (l.user_agent || "").replace(/,/g, " "), // CSV break fix

      l.bot_score ?? 0,
      l.risk_score ?? 0,        // ✅ FIX

      l.status || "-",
      l.reason || "-",

      l.referrer || "-",        // ✅ FIX (IMPORTANT)

      l.created_at || "-"
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.map(v => `"${v}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `logs_${filters.date || "all"}_${filters.campaign_id || "all"}.csv`;
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

    if (filters.date) {
      const logDate = new Date(l.created_at).toISOString().slice(0, 10);
      if (logDate !== filters.date) return false;
    }

    return true;

  });

  // Pagination logic

  // const indexOfLastRow = currentPage * rowsPerPage;
  // const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  // const currentLogs = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.min(
    Math.ceil(totalCount / rowsPerPage),
    500
  );

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-800">
        <div className="animate-spin h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        <p className="text-sm">Loading traffic data...</p>
      </div>
    );
  }

  return (

    <div className="mx-auto space-y-6 min-h-screen flex flex-col">

      {/* HEADER */}
      <div className="flex flex-col gap-1 mb-2">

        <h1 className="text-3xl font-semibold tracking-tight">
          Traffic Logs
        </h1>

        <p className="text-sm text-gray-500">
          Monitor and analyze incoming traffic, detect bots, and manage IP blocks
        </p>

      </div>

      {/* FILTERS */}

      <div className="flex flex-wrap items-center gap-3 mb-6 
bg-white/80 backdrop-blur-xl 
border border-gray-200/50 
rounded-2xl p-4 shadow-sm">

        <select
          className="px-3 py-2 rounded-lg border border-gray-300 
bg-white text-sm shadow-sm 
focus:ring-2 focus:ring-indigo-500 outline-none"
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
          className="px-3 py-2 rounded-lg border border-gray-300 
bg-white text-sm shadow-sm 
focus:ring-2 focus:ring-indigo-500 outline-none"
          value={filters.ip}
          onChange={(e) => setFilters({ ...filters, ip: e.target.value })}
        />

        <input
          type="date"
          className="px-3 py-2 rounded-lg border border-gray-300 
bg-white text-sm shadow-sm 
focus:ring-2 focus:ring-indigo-500 outline-none"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        />

        <button
          onClick={exportCSV}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium
bg-gradient-to-r from-indigo-500 to-blue-600
hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
        >
          Export CSV
        </button>

      </div>

      <div className="flex flex-wrap gap-2 mb-4">

        {Object.keys(visibleColumns).map((col) => (
          <button
            key={col}
            onClick={() =>
              setVisibleColumns((prev) => ({
                ...prev,
                [col]: !prev[col],
              }))
            }
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
${visibleColumns[col]
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}
`}
          >
            {col}
          </button>
        ))}

      </div>

      {/* TABLE */}

      <div className=" rounded-2xl w-full p-4 text-gray-800 overflow-hidden flex-1 flex flex-col bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4
shadow-[0_10px_25px_rgba(0,0,0,0.06)]
border border-gray-100
hover:shadow-[0_15px_40px_rgba(0,0,0,0.10)]
transition-all duration-300 flex-1 flex flex-col">
        <div className="overflow-auto flex-1 max-h-[85vh] rounded-xl border border-gray-100 bg-white">
          <div className="w-full flex-shrink-0"> {/* ✅ prevent shrinking when table is wider than container */}

            <div className="w-full max-w-[1180px]">

              <table className="w-full min-w-[1100px] text-sm table-auto">

                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider sticky top-0 z-10">

                  <tr>

                    {visibleColumns.ip && <th className="p-3 border w-[160px]">IP</th>}
                    {visibleColumns.country && <th className="p-3 border min-w-[300px] max-w-[250px]">Country</th>}
                    {visibleColumns.device && <th className="p-3 border w-[100px]">Device</th>}
                    {visibleColumns.asn && <th className="p-3 border w-[90px]">ASN</th>}
                    {visibleColumns.isp && <th className="p-3 border min-w-[300px] max-w-[250px]">ISP</th>}
                    {visibleColumns.connection && <th className="p-3 border w-[120px]">Connection</th>}
                    {visibleColumns.campaign && <th className="p-3 border w-[120px]">Campaign</th>}
                    {visibleColumns.destination && <th className="p-3 border w-[300px]">Destination</th>}
                    {visibleColumns.os && <th className="p-3 border w-[90px]">OS</th>}
                    {visibleColumns.ip_timezone && <th className="p-3 border w-[120px]">Timezone</th>}
                    {visibleColumns.user_agent && <th className="p-3 border min-w-[300px] max-w-[400px]">Useragent</th>}
                    {visibleColumns.bot && <th className="p-3 border w-[70px]">Bot</th>}
                    {visibleColumns.status && <th className="p-3 border w-[150px]">Status</th>}
                    {visibleColumns.browser && <th className="p-3 border w-[140px]">Browser</th>}
                    {visibleColumns.risk && <th className="p-3 border w-[80px]">Risk</th>}
                    {visibleColumns.reason && <th className="p-3 border w-[140px]">Reason</th>}
                    {visibleColumns.flags && <th className="p-3 border w-[150px]">Flags</th>}
                    {visibleColumns.fingerprint && <th className="p-3 border w-[180px]">Fingerprint</th>}
                    {visibleColumns.time && <th className="p-3 border w-[170px]">Time</th>}
                    {visibleColumns.referrer && <th className="p-3 border w-[200px]">Referrer</th>}
                    {/* {visibleColumns.subdata && <th className="p-3 border w-[200px]">Sub Data</th>} */}
                    {visibleColumns.action && <th className="p-3 border w-[100px]">Action</th>}

                  </tr>

                </thead>

                <tbody>

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="13" className="p-6 text-center text-gray-800">
                        No logs found
                      </td>
                    </tr>
                  )}

                  {filteredLogs.map((log, i) => (

                    <tr key={i} className="text-center hover:bg-gray-50 transition-colors duration-150">

                      {visibleColumns.ip && (
                        <td className="p-2 border-b border-gray-200 font-mono text-xs text-indigo-600">{log.ip_address}</td>
                      )}

                      {visibleColumns.country && (
                        <td className="px-3 py-2 border-b border-gray-200 text-gray-800">
                          {log.country} {log.region && `(${log.region})`} {log.city && `- ${log.city}`}
                        </td>
                      )}

                      {visibleColumns.device && (
                        <td className="px-3 py-2 border truncate max-w-[180px]">
                          {log.device_type || "Unknown"}
                        </td>
                      )}

                      {visibleColumns.asn && (
                        <td className="px-3 py-2 border truncate max-w-[180px]">
                          {log.asn || "-"}
                        </td>
                      )}

                      {visibleColumns.isp && (
                        <td className="px-3 py-2 border-b border-gray-200 text-gray-800">
                          {log.isp || "-"}
                        </td>
                      )}

                      {visibleColumns.connection && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          <span className={`px-2 py-1 rounded text-xs
${log.connection_type === "datacenter" ? "bg-red-100 text-red-700" :
                              log.connection_type === "vpn" ? "bg-yellow-100 text-yellow-700" :
                                log.connection_type === "tor" ? "bg-purple-100 text-purple-700" :
                                  "bg-green-100 text-green-700 border border-green-500/20"}`}>
                            {log.connection_type || "Residential"}
                          </span>
                        </td>
                      )}

                      {visibleColumns.campaign && (
                        <td className="p-2 border-b border-gray-200 font-semibold text-indigo-400">
                          {log.campaign}
                        </td>
                      )}

                      {visibleColumns.destination && (
                        <td className="px-3 py-2 border-b border-gray-200 truncate max-w-[260px]">
                          <span className={`px-2 py-1 rounded text-xs ${log.status?.toLowerCase() === "blocked"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700 border border-green-500/20"
                            }`}>
                            {log.destination}
                          </span>
                        </td>
                      )}

                      {visibleColumns.os && (
                        <td className="px-3 py-2 border-b border-gray-100">{log.os || "-"}</td>
                      )}
                      {visibleColumns.ip_timezone && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          {log.ip_timezone || "-"}
                        </td>
                      )}
                      {visibleColumns.user_agent && (
                        <td className="px-3 py-2 border-b border-gray-100 max-w-[500px] break-words">{(log.user_agent || "").slice(0, 40) + "..."}</td>
                      )}
                      {visibleColumns.bot && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
${log.bot_score >= 70 ? "bg-red-100 text-red-700" :
                              log.bot_score >= 40 ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700 border border-green-500/20"}`}>
                            {log.bot_score ?? 0}
                          </span>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold
${log.status === "offer"
                              ? "bg-green-100 text-green-700"
                              : log.status === "safe"
                                ? "bg-yellow-100 text-yellow-700"
                                : log.status === "converted"
                                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                                  : "bg-red-100 text-red-700"
                            }`}>
                            {log.status === "offer"
                              ? "PASS"
                              : log.status === "safe"
                                ? "SAFE"
                                : log.status === "converted"
                                  ? "CONVERTED"
                                  : log.status?.toUpperCase() || "BLOCK"}
                          </span>
                        </td>
                      )}

                      {visibleColumns.browser && (
                        <td className="px-3 py-2 border-b border-gray-200 text-gray-800">{log.browser || "-"}</td>
                      )}

                      {visibleColumns.risk && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          <span className={`px-2 py-1 rounded text-xs font-semibold
${log.risk_score >= 70 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                              log.risk_score >= 40 ? "bg-yellow-100 text-yellow-700" :
                                "bg-green-100 text-green-700 border border-green-500/20"}`}>
                            {log.risk_score ?? 0}
                          </span>
                        </td>
                      )}

                      {visibleColumns.reason && (
                        <td className="px-3 py-2 border text-xs align-middle text-center">
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 inline-block">
                            {(() => {
                              if (!log.reason) return "-";

                              const r = log.reason.toLowerCase();

                              if (r.includes("vpn")) return "VPN";
                              if (r.includes("proxy")) return "Proxy";
                              if (r.includes("datacenter")) return "Datacenter";
                              if (r.includes("high bot")) return "High Bot";
                              if (r.includes("rule")) return "Rule Match";

                              return log.reason.split(",")[0]; // fallback
                            })()}
                          </span>
                        </td>
                      )}

                      {visibleColumns.flags && (
                        <td className="px-3 py-2 border text-xs">
                          <div className="flex flex-wrap gap-1 justify-center">

                            {log.connection_type === "vpn" ? (
                              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">VPN</span>

                            ) : log.connection_type === "tor" ? (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">TOR</span>

                            ) : log.connection_type === "datacenter" ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">DC</span>

                            ) : log.bot_score >= 70 ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded">BOT</span>

                            ) : null}

                          </div>
                        </td>
                      )}

                      {visibleColumns.fingerprint && (
                        <td className="px-3 py-2 border text-xs font-mono">
                          {log.fingerprint || "-"}
                        </td>
                      )}

                      {visibleColumns.time && (
                        <td className="p-2 border text-xs whitespace-nowrap">
                          {new Date(log.created_at + "Z").toLocaleString("en-US", {
                            timeZone: log.ip_timezone || "UTC",
                            hour12: true
                          })}
                        </td>
                      )}

                      {visibleColumns.referrer && (
                        <td className="px-3 py-2 border text-xs truncate max-w-[200px]">
                          {log.referrer || "-"}
                        </td>
                      )}

                      {/* {visibleColumns.subdata && (
                    <td className="px-3 py-2 border text-xs">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {log.sub1 && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">sub1: {log.sub1}</span>}
                        {log.sub2 && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">sub2: {log.sub2}</span>}
                      </div>
                    </td>
                  )} */}

                      {visibleColumns.action && (
                        <td className="p-2 border-b border-gray-200">
                          {blockedIPs.includes(log.ip_address) ? (
                            <button
                              onClick={() => unblockIP(log.ip_address)}
                              className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold transition px-3 py-1.5 rounded-lg text-xs font-semibold 
shadow-sm hover:shadow transition "
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              onClick={() => blockIP(log.ip_address)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold
bg-red-50 text-red-600 
hover:bg-red-100 
transition shadow-sm hover:shadow"
                            >
                              Block
                            </button>
                          )}
                        </td>
                      )}

                    </tr>

                  ))}

                </tbody>

              </table>
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-between items-center mt-4 px-2 flex-wrap gap-2">

        <div className="text-sm text-gray-800">
          Showing <span className="font-medium">
            {(currentPage - 1) * rowsPerPage + 1}
          </span>{" "}
          –
          <span className="font-medium">
            {Math.min(currentPage * rowsPerPage, totalCount)}
          </span>{" "}
          of <span className="font-medium">{totalCount}</span>
        </div>

        <div className="flex items-center gap-2">

          <button
            disabled={pageLoading || currentPage === 1}
            onClick={() => {
              if (pageLoading) return;
              setCurrentPage(p => p - 1);
              { pageLoading ? "Loading..." : "Prev" }
            }}
            className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Prev
          </button>

          <span className="px-3 py-1 text-sm bg-gray-100 rounded-md">
            Page {currentPage} / {totalPages}
          </span>

          <button
            disabled={pageLoading || currentPage === totalPages || currentPage >= 500}
            onClick={() => {
              if (pageLoading) return; // extra safety
              setCurrentPage(p => p + 1);
              { pageLoading ? "Loading..." : "Next" }
            }}
            className="px-3 py-1 text-sm border rounded-md bg-white hover:bg-gray-100 disabled:opacity-40"
          >
            Next
          </button>

        </div>

      </div>

    </div>

  );

}