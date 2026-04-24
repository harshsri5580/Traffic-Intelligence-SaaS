"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { countries } from "../../../data/countries";


import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function AnalyticsPage() {

  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [overview, setOverview] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fullRes, setFullRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState("");
  const [botStats, setBotStats] = useState({
    human: 0,
    bot: 0,
    suspicious: 0
  });

  const loadData = async () => {

    try {

      setLoading(true);

      const [logsRes, overviewRes, fullRes] = await Promise.all([
        api.get(`/analytics/recent?page=${page}&limit=${rowsPerPage}`), // table
        api.get("/analytics/overview"),
        api.get(`/analytics/recent?limit=1000`) // 🔥 FULL DATA FOR CHART
      ]);
      // ✅ ADD THIS AT END
      try {
        const botRes = await api.get("/analytics/bot-stats");
        setBotStats(botRes.data);
      } catch (err) {
        console.error(err);
      }

      const logsData = logsRes.data.logs || [];
      setTotalPages(logsRes.data.total_pages || 1);

      setLogs(logsData);
      setOverview(overviewRes.data || null);

      buildCharts(fullRes.data.logs || []);

    } catch (err) {

      console.error("Analytics load error", err);

    } finally {

      setLoading(false);

    }


  };

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [page, rowsPerPage]);



  const refresh = async (e) => {
    e?.preventDefault(); // extra safety
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };



  const getCountryName = (code) => {
    const c = countries.find((x) => x.value === code);
    return c ? c.label : code;
  };

  const buildCharts = (logs) => {

    const trafficByHour = {};

    logs.forEach((log) => {

      if (!log.created_at) return;

      const hour = new Date(log.created_at).getHours();

      if (!trafficByHour[hour]) {
        trafficByHour[hour] = {
          passed: 0,
          blocked: 0,
          fallback: 0,
          bot: 0
        };
      }

      // ✅ passed
      if (["offer", "pass"].includes(log.status)) {
        trafficByHour[hour].passed++;
      }

      // ✅ blocked
      if (log.status === "blocked") {
        trafficByHour[hour].blocked++;
      }
      // fallback (SAFE PAGE)
      if (log.status === "fallback") {
        trafficByHour[hour].fallback++;
      }
      // ✅ bot
      if (log.bot_score >= 70) {
        trafficByHour[hour].bot++;
      }

    });
    const countryMap = {};
    const deviceMap = {};
    const fraudMap = {
      vpn: 0,
      datacenter: 0,
      residential: 0
    };

    logs.forEach((log) => {

      if (!log.created_at) return;

      const hour = new Date(log.created_at).getHours();

      // ❌ NO overwrite here

      if (log.country) {
        countryMap[log.country] = (countryMap[log.country] || 0) + 1;
      }

      if (log.device_type) {
        deviceMap[log.device_type] = (deviceMap[log.device_type] || 0) + 1;
      }

      if (log.connection_type === "vpn") fraudMap.vpn++
      else if (log.connection_type === "datacenter") fraudMap.datacenter++
      else fraudMap.residential++

    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    setChartData(
      hours.map(h => ({
        hour: `${h}:00`,
        passed: trafficByHour[h]?.passed || 0,
        blocked: trafficByHour[h]?.blocked || 0,
        fallback: trafficByHour[h]?.fallback || 0, // ✅ ADD
        bot: trafficByHour[h]?.bot || 0
      }))
    );

    setCountryData(
      Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c, v]) => ({
          name: getCountryName(c),
          value: v
        }))
    );

    setDeviceData(
      Object.entries(deviceMap).map(([d, v]) => ({
        name: d,
        value: v
      }))
    );

  };

  const filteredLogs = logs.filter((log) => {

    if (
      statusFilter !== "all" &&
      (log.status || "").toLowerCase() !== statusFilter.toLowerCase()
    ) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();

      return (
        log.ip_address?.toLowerCase().includes(q) ||
        log.campaign_name?.toLowerCase().includes(q)
      );
    }

    return true;

  });

  function statusColor(status) {
    switch (status) {
      case "offer":
        return "bg-green-500/20 text-green-400";
      case "blocked":
        return "bg-red-500/20 text-red-400";
      case "fallback":
        return "bg-yellow-500/20 text-yellow-400";
      case "rule":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  }

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (

    <div className="p-8 space-y-10 bg-gray-50 min-h-screen w-full overflow-x-hidden">

      <h1 className="text-3xl font-semibold tracking-tight text-gray-800 mb-6">
        Traffic Analytics
      </h1>

      {overview && (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">

          <StatCard title="Total Clicks" value={overview.total_clicks} />
          <StatCard title="Passed" value={overview.passed} />
          <StatCard title="Blocked" value={overview.blocked} />
        </div>

      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">

        <StatCard title="Human" value={botStats.human} color="green" />
        <StatCard title="Suspicious" value={botStats.suspicious} color="yellow" />
        <StatCard title="Bot" value={botStats.bot} color="red" />

      </div>

      <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-6 text-white">
          Traffic Quality
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-6">

          <StatMini title="VPN Traffic" value={overview?.vpn || 0} />
          <StatMini title="Datacenter Traffic" value={overview?.datacenter || 0} />
          <StatMini title="Residential Traffic" value={overview?.residential || 0} />

        </div>

      </div>

      <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

        <h2 className="text-lg font-semibold mb-4 text-white">
          Traffic By Hour
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            <XAxis dataKey="hour" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />

            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}
              labelStyle={{ color: "#fff" }}
            />

            {/* 🔥 Passed */}
            <Line
              type="monotone"
              dataKey="passed"
              stroke="#22c55e"
              strokeWidth={3}
              name="Passed"
            />

            {/* 🔥 Blocked */}
            <Line
              type="monotone"
              dataKey="blocked"
              stroke="#ef4444"
              strokeWidth={3}
              name="Blocked"
            />

            {/* 🔥 Fallback (Safe Page) */}
            <Line
              type="monotone"
              dataKey="fallback"
              stroke="#eac408" // yellow
              strokeWidth={3}
              name="Fallback"
            />

            {/* 🔥 Bots */}
            <Line
              type="monotone"
              dataKey="bot"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Bot"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

        <ChartCard title="Country Distribution" data={countryData} />
        <ChartCard title="Device Distribution" data={deviceData} />

      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-2xl p-4 shadow-lg">

        {/* 🔽 STATUS */}
        <select
          className="bg-gray-800 text-white border border-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="offer">Passed</option>
          <option value="blocked">Blocked</option>
          <option value="fallback">Fallback</option>
          <option value="safe">Safe</option>
          <option value="converted">Converted</option>
        </select>

        {/* 🔽 ROWS */}
        <select
          className="bg-gray-800 text-white border border-gray-700 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="25">25 rows</option>
          <option value="50">50 rows</option>
          <option value="100">100 rows</option>
        </select>

        {/* 🔄 REFRESH */}
        <button
          type="button"  // 🔥 MOST IMPORTANT
          onClick={refresh}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl transition font-medium shadow-md"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      {loading && (
        <div className="text-center text-sm text-gray-500 mb-4">
          🔄 Updating data...
        </div>
      )}

      <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

        <div className="overflow-x-auto max-h-[600px]">

          <table className="w-full text-sm text-gray-300">

            {/* 🔥 HEADER */}
            <thead className="sticky top-0 bg-gray-900 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">

              <tr>
                {/* <th className="p-3">ClickID</th> */}
                <th className="p-3">IP</th>
                <th className="p-3">Country</th>
                <th className="p-3">Device</th>
                <th className="p-3">Browser</th>
                <th className="p-3">ISP</th>
                <th className="p-3">Campaign</th>
                <th className="p-3">Offer</th>
                <th className="p-3">Bot</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
                <th className="p-3">Revenue</th>
                <th className="p-3">EPC</th>
                <th className="p-3">ROI</th>
              </tr>

            </thead>

            {/* 🔥 BODY */}
            <tbody>

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="14" className="p-6 text-center text-gray-500">
                    No analytics data found
                  </td>
                </tr>
              )}

              {filteredLogs.map((log, i) => {

                const revenue = log.revenue || 0;
                const cost = log.cost || 0;

                const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
                const epc = revenue; // temporary

                return (

                  <tr key={`${log.click_id}-${i}`} className="border-t border-gray-800 hover:bg-gray-800/40 transition text-center">
                    {/* 🔥 CLICK ID ADD */}
                    {/* <td className="p-3 font-mono text-xs text-gray-400 max-w-[250px] truncate">
                      {log.click_id || "-"}
                    </td> */}
                    <td className="p-3 max-w-[140px] truncate hover:whitespace-normal">
                      {log.ip_address || "-"}
                    </td>

                    <td className="p-3">{getCountryName(log.country)}</td>

                    <td className="p-3">{log.device_type}</td>

                    <td className="p-3">{log.browser}</td>

                    <td className="p-3">{log.isp}</td>

                    <td className="p-3 font-medium text-white">
                      {log.campaign_name || "-"}
                    </td>

                    <td className="p-3">{log.offer_name || "-"}</td>

                    <td className="p-3">{log.bot_score}</td>

                    <td className="p-3">{log.status}</td>

                    <td className="p-3">
                      {log.created_at ? new Date(log.created_at + "Z").toLocaleString() : "-"}
                    </td>

                    <td className="p-3 text-green-400 font-semibold">
                      ${revenue.toFixed(2)}
                    </td>

                    <td className="p-3 text-blue-400 font-semibold">
                      {epc.toFixed(2)}
                    </td>

                    <td className={`p-3 font-semibold ${roi >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {roi.toFixed(2)}%
                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>


      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-2xl shadow-lg mt-6">

        {/* 🔙 PREVIOUS */}
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
      ${page === 1
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-gray-800 text-white hover:bg-gray-700"}`}
        >
          ← Previous
        </button>

        {/* 📄 PAGE INFO */}
        <span className="text-gray-300 text-sm">
          Page <span className="text-white font-semibold">{page}</span> of{" "}
          <span className="text-white font-semibold">{totalPages}</span>
        </span>

        {/* 🔜 NEXT */}
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition
      ${page === totalPages
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow"}`}
        >
          Next →
        </button>

      </div>

    </div>

  );

}

function StatCard({ title, value }) {
  return (
    <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

      <div className="text-sm text-gray-400 mb-2">
        {title}
      </div>

      <div className="text-3xl font-bold tracking-wide">
        {value || 0}
      </div>

    </div>
  );
}

function ChartCard({ title, data }) {

  const colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (

    <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

      {/* 🔥 Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          {title}
        </h2>
        <span className="text-xs text-gray-400">
          Top 5
        </span>
      </div>

      {/* 🔥 Chart */}
      <ResponsiveContainer width="100%" height={260}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={90}
            innerRadius={55} // 🔥 donut style
            paddingAngle={3}
          >

            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={colors[index % colors.length]}
                className="hover:opacity-80 transition"
              />
            ))}

          </Pie>

          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              color: "#fff"
            }}
          />

        </PieChart>

      </ResponsiveContainer>

      {/* 🔥 Legend (important upgrade) */}
      <div className="mt-4 space-y-2">

        {data.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">

            <div className="flex items-center gap-2 text-gray-300">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              {item.name}
            </div>

            <div className="text-white font-semibold">
              {item.value}
            </div>

          </div>
        ))}

      </div>

    </div>

  );
}

function StatMini({ title, value }) {
  return (
    <div className="w-full min-w-0 bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

      <div className="text-sm text-gray-400 mb-1">
        {title}
      </div>

      <div className="text-3xl font-bold text-white">
        {value || 0}
      </div>

    </div>
  );
}