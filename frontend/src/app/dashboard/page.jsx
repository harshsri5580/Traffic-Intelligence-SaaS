"use client";

import { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import { countries } from "../../data/countries";

import dynamic from "next/dynamic";

const ComposableMap = dynamic(
  () => import("react-simple-maps").then(m => m.ComposableMap),
  { ssr: false }
);

const Geographies = dynamic(
  () => import("react-simple-maps").then(m => m.Geographies),
  { ssr: false }
);

const Geography = dynamic(
  () => import("react-simple-maps").then(m => m.Geography),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-simple-maps").then(m => m.Marker),
  { ssr: false }
);

const geoUrl = "/world.json";

const countryCoords = {
  India: [78.9629, 20.5937],
  "United States": [-95.7129, 37.0902],
  USA: [-95.7129, 37.0902],
  UK: [-3.436, 55.3781],
  Canada: [-106.3468, 56.1304],
  Germany: [10.4515, 51.1657],
  France: [2.2137, 46.2276],
  Brazil: [-51.9253, -14.235],
  Australia: [133.7751, -25.2744],
  Russia: [105.3188, 61.524],
  China: [104.1954, 35.8617]
};

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const start = (page - 1) * rowsPerPage;
  const paginatedRecent = recent.slice(start, start + rowsPerPage);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [offers, setOffers] = useState([]);
  const [range, setRange] = useState("today");
  const [campaigns, setCampaigns] = useState([]);
  const [zones, setZones] = useState([]);
  const [plan, setPlan] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [profitData, setProfitData] = useState([]);
  // const [profitRange, setProfitRange] = useState("today");
  const [trafficRange, setTrafficRange] = useState("today");


  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadDashboard();

    const ws = new WebSocket("ws://localhost:8000/ws/live");

    let buffer = [];

    ws.onopen = () => {
      console.log("Realtime connected");
    };

    ws.onmessage = (event) => {

      const data = JSON.parse(event.data);

      const mapped = {
        ip_address: data.ip,
        country: data.country,
        device_type: data.device,
        campaign_name: data.campaign,
        status: data.status,
        created_at: data.time
      };

      buffer.push(mapped);

      // ✅ batch update (performance boost)
      if (buffer.length >= 5) {
        setRecent(prev => [...buffer, ...prev].slice(0, 20));
        buffer = [];
      }
    };

    setTimeout(() => {
      if (buffer.length > 0) {
        setRecent(prev => [...buffer, ...prev].slice(0, 20));
        buffer = [];
      }
    }, 2000);

    ws.onerror = (err) => {
      console.log("WS error", err);
    };

    ws.onclose = () => {
      console.log("Realtime disconnected");
    };

    return () => ws.close();

  }, []);


  useEffect(() => {
    if (expired) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [expired]);

  useEffect(() => {
    if (
      plan?.plan?.max_campaigns &&
      stats.active_campaigns >= plan?.plan?.max_campaigns
    ) {

    }
  }, [stats, plan]);

  const loadDashboard = async () => {

    try {

      const statsRes = await api.get("/dashboard/stats");

      setStats(statsRes.data || {});
      const planRes = await api.get("/billing/my-subscription");
      const data = planRes.data || {};

      setPlan(data);

      // ✅ HAS SUBSCRIPTION
      const hasSub = !!data?.id;
      setHasSubscription(hasSub);

      // ✅ DAYS LEFT CALC
      let days = 0;

      if (data?.expire_date) {
        const expiry = new Date(data.expire_date);
        const now = new Date();

        const diff = expiry - now;
        days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      setDaysLeft(days);

      // ✅ EXPIRED
      setExpired(days <= 0);

      await Promise.all([
        loadRecent(),
        loadSources(range),
        loadOffers(),
        loadCampaigns(),
        loadZones(),
        loadCampaignTraffic(trafficRange),
        // loadCampaignProfit(profitRange) // ✅ ADD THIS
      ]);  // 👈 ADD THIS

      setLoading(false);

    } catch (err) {

      console.error("Dashboard load error", err);

    }

  };
  const [campaignTraffic, setCampaignTraffic] = useState([]);

  const loadCampaignTraffic = async (selectedRange = range) => {
    try {
      const res = await api.get(`/analytics/campaign-traffic?range=${selectedRange}`);
      setCampaignTraffic(res.data || []);
    } catch (err) {
      console.error("Campaign traffic error", err);
    }
  };

  // const loadCampaignProfit = async (selectedRange = range) => {
  //   try {
  //     const res = await api.get(`/analytics/campaign-profit?range=${selectedRange}`);
  //     setProfitData(res.data || []);
  //   } catch (err) {
  //     console.error("Profit error", err);
  //   }
  // };

  const getCountryName = (code) => {
    const c = countries.find((x) => x.value === code);
    return c ? c.label : code;
  };

  const loadSources = async (selectedRange = range) => {

    try {

      const res = await api.get(`/analytics/sources?range=${selectedRange}`);

      setSources(res.data || []);

    } catch (err) {

      console.error("Source analytics error", err);

    }

  };

  const loadRecent = async () => {

    try {

      const res = await api.get("/analytics/recent?limit=20&range=today");

      const data = res.data;

      // handle both possible API formats
      if (Array.isArray(data)) {
        const today = new Date().toDateString();

        const todayLogs = data.filter((l) =>
          new Date(l.created_at).toDateString() === today
        );

        setRecent(todayLogs);
      } else if (data.logs) {
        setRecent(data.logs);
      } else {
        setRecent([]);
      }

    } catch (err) {

      console.error("Recent traffic error", err);
      setRecent([]);

    }

  };

  const loadOffers = async () => {

    try {

      const res = await api.get("/analytics/offer-performance");

      setOffers(res.data || []);

    } catch (err) {

      console.error("Offer analytics error", err);

    }

  };

  const statusColor = (status) => {
    const s = (status || "").toLowerCase();

    if (s === "blocked" || s === "block")
      return "bg-red-500";

    if (s === "pass" || s === "offer")
      return "bg-green-500";

    if (s === "safe")
      return "bg-yellow-400 text-black";

    if (s === "converted")
      return "bg-purple-500"; // 🔥 FIXED

    return "bg-gray-400";
  };

  const loadCampaigns = async () => {
    try {
      const res = await api.get("/campaigns/");
      setCampaigns(res.data || []);
    } catch (err) {
      console.error("Campaign load error", err);
    }
  };

  const loadZones = async () => {
    try {
      const res = await api.get("/analytics/zones");
      setZones(res.data || []);
    } catch (err) {
      console.error("Zone analytics error", err);
    }
  };


  const cleanZones = zones.filter(z =>
    z.zone_id &&
    z.zone_id !== "unknown" &&
    !z.zone_id.includes("{") &&
    !["incognito", "test"].includes(z.zone_id)
  );

  const profitZones = cleanZones.filter(z => {
    const roi = z.cost > 0 ? ((z.revenue - z.cost) / z.cost) * 100 : 0;
    return roi > 0;
  });

  const lossZones = cleanZones.filter(z => {
    const roi = z.cost > 0 ? ((z.revenue - z.cost) / z.cost) * 100 : 0;
    return roi < 0;
  });

  const campaignSummary = useMemo(() => {

    const campaignMap = {};

    campaigns.forEach(c => {
      campaignMap[c.name] = (c.pass_count || 0) + (c.block_count || 0);
    });

    const result = {};

    zones.forEach((z) => {
      const name = z.campaign_name || "Unknown";

      if (!result[name]) {
        result[name] = {
          campaign: name,
          clicks: campaignMap[name] || 0,
          cost: 0,
          revenue: 0
        };
      }

      result[name].cost += z.cost || 0;
      result[name].revenue += z.revenue || 0;
    });

    return Object.values(result);

  }, [campaigns, zones]);

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading Dashboard...</p>
      </div>
    );
  }


  return (

    <div className="p-8 space-y-10 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold flex items-center gap-3">

        Dashboard

        <span className="flex items-center gap-1 text-sm text-green-600">

          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>

          Live

        </span>

      </h1>

      {/* 🟢 FREE TRIAL ACTIVE */}
      {hasSubscription && !expired && (
        <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-3 rounded text-center font-medium">
          Active — {daysLeft} day{daysLeft > 1 ? "s" : ""} remaining
        </div>
      )}
      {/* 🔴 Expired */}
      {hasSubscription && daysLeft <= 0 && (
        <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-3 rounded text-center font-medium">
          🚫 Your plan has expired. Upgrade now.
        </div>
      )}

      {/* ⚠️ Expiring soon */}
      {hasSubscription && daysLeft > 0 && daysLeft <= 3 && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-6 py-3 rounded text-center font-medium">
          ⚠️ Your plan is expiring in {daysLeft} days. Upgrade now.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        <StatCard title="Total Clicks" value={stats.total_clicks} />
        <StatCard title="Today Clicks" value={stats.today_clicks} />
        <StatCard title="Unique Visitors" value={stats.unique_ips} />
        <StatCard title="Passed Traffic" value={stats.passed} />
        <StatCard title="Blocked Traffic" value={stats.blocked} />
        <StatCard
          title="Total Profit"
          value={`$${Number(stats.total_profit || 0).toFixed(2)}`}
        />

        <StatCard
          title="ROI"
          value={`${Number(stats.roi || 0).toFixed(2)}%`}
        />

      </div>

      <div className="bg-white shadow rounded p-6">

        <h2 className="text-xl font-semibold mb-4">
          Usage
        </h2>

        {/* Campaigns */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Campaigns</span>
            <span>
              {stats.active_campaigns || 0} / {plan?.plan?.max_campaigns || "-"}
            </span>

            {stats.inactive_campaigns > 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                {stats.inactive_campaigns} campaigns are inactive
              </p>
            )}
          </div>

          <div className="w-full bg-gray-200 h-3 rounded">
            <div
              className={`h-3 rounded ${stats.active_campaigns >= plan?.plan?.max_campaigns
                ? "bg-red-500"
                : "bg-blue-500"
                }`}
              style={{
                width: `${plan?.plan?.max_campaigns
                  ? Math.min(
                    (stats.active_campaigns / plan.plan.max_campaigns) * 100,
                    100
                  )
                  : 0
                  }%`,
              }}
            />
          </div>
        </div>

        {/* Clicks */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Clicks</span>
            <span>
              {plan?.plan?.max_monthly_clicks
                ? `${stats.total_clicks} / ${plan.plan.max_monthly_clicks}`
                : "Unlimited"}
            </span>
          </div>

          {plan?.plan?.max_monthly_clicks && (
            <div className="w-full bg-gray-200 h-3 rounded">
              <div
                className="bg-green-500 h-3 rounded"
                style={{
                  width: `${(stats.total_clicks / plan.plan.max_monthly_clicks) * 100
                    }%`,
                }}
              />
            </div>
          )}
        </div>

      </div>

      <div className="bg-white shadow rounded p-6">

        <h2 className="text-xl font-semibold mb-4">
          Live World Traffic
        </h2>

        <ComposableMap projectionConfig={{ scale: 150 }} style={{ width: "100%", height: "420px" }}>

          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#E5E7EB"
                  stroke="#D1D5DB"
                />
              ))
            }
          </Geographies>

          {Array.isArray(recent) && recent.map((log, i) => {

            const countryName = getCountryName(log.country);
            const coords = countryCoords[countryName];

            if (!coords) return null;

            return (
              <Marker key={i} coordinates={coords}>
                <circle r={6} fill="#22c55e">
                  <animate
                    attributeName="r"
                    values="4;7;4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              </Marker>
            );

          })}

        </ComposableMap>

      </div>

      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

        <h2 className="text-xl font-semibold mb-6">
          Live Traffic
        </h2>

        <div className="overflow-hidden rounded-xl border border-gray-100">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border-b">IP</th>
                <th className="p-3 border-b">Country</th>
                <th className="p-3 border-b">Device</th>
                <th className="p-3 border-b">Campaign</th>
                <th className="p-3 border-b">Decision</th>
                <th className="p-3 border-b">Time</th>
              </tr>
            </thead>

            <tbody>

              {paginatedRecent.map((log, i) => (

                <tr key={i} className="text-center hover:bg-gray-50 transition">

                  <td className="p-3 border-b font-mono text-xs">
                    {log.ip_address}
                  </td>

                  <td className="p-3 border-b">
                    {getCountryName(log.country)}
                  </td>

                  <td className="p-3 border-b capitalize">
                    {log.device_type}
                  </td>

                  <td className="p-3 border-b">
                    {log.campaign_name || log.campaign_id || "-"}
                  </td>

                  <td className="p-3 border-b">
                    <span className={`text-white text-xs px-2 py-1 rounded-full shadow-sm ${statusColor(log.status)}`}>
                      {log.status}
                    </span>
                  </td>

                  <td className="p-3 border-b text-gray-500 text-xs">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* 🔥 PAGINATION UPGRADE */}
        <div className="flex justify-between items-center mt-4">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600">
            Page {page} / {Math.ceil(recent.length / rowsPerPage)}
          </span>

          <button
            disabled={page >= Math.ceil(recent.length / rowsPerPage)}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition"
          >
            Next
          </button>

        </div>

      </div>


      <div className="bg-white rounded-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-gray-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300">

        <h2 className="text-xl font-semibold mb-6">
          Campaign Profit Summary
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Campaign</th>
                <th className="p-3 border">Clicks</th>
                <th className="p-3 border">Cost</th>
                <th className="p-3 border">Revenue</th>
                <th className="p-3 border">Profit</th>
                <th className="p-3 border">ROI</th>
              </tr>
            </thead>

            <tbody>

              {campaignSummary.map((c, i) => {

                const profit = c.revenue - c.cost;
                const roi = c.cost > 0 ? ((profit / c.cost) * 100).toFixed(2) : 0;

                return (
                  <tr key={i} className="text-center hover:bg-gray-50">

                    <td className="p-2 border">{c.campaign}</td>
                    <td className="p-2 border">{c.clicks}</td>

                    <td className="p-2 border text-red-500">
                      ${c.cost.toFixed(2)}
                    </td>

                    <td className="p-2 border text-green-600">
                      ${c.revenue.toFixed(2)}
                    </td>

                    <td className={`p-2 border font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      ${profit.toFixed(2)}
                    </td>

                    <td className={`p-2 border font-semibold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {roi}%
                    </td>

                  </tr>
                );

              })}

            </tbody>

          </table>

        </div>

      </div>


      {/* 🔥 FULL 3D CARD */}
      <div className="bg-white rounded-2xl p-6 
  shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
  border border-gray-100 
  hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
  transition-all duration-300">

        {/* 🔹 HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Campaign Traffic Summary ({trafficRange})
          </h2>

          <select
            value={trafficRange}
            onChange={(e) => {
              const val = e.target.value;
              setTrafficRange(val);
              loadCampaignTraffic(val);
            }}
            className="border border-gray-300 px-3 py-1 rounded-md text-sm 
      shadow-sm hover:border-gray-400 bg-white"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* 🔹 TABLE WRAPPER (important for 3D feel) */}
        <div className="overflow-hidden rounded-xl border border-gray-100">

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border-b">Campaign</th>
                <th className="p-3 border-b">Total</th>
                <th className="p-3 border-b">Passed</th>
                <th className="p-3 border-b">Blocked</th>
              </tr>
            </thead>

            <tbody>

              {campaignTraffic.map((c, i) => {

                const total = c.total || 0;
                const passed = c.passed || 0;
                const blocked = c.blocked || 0;

                return (
                  <tr
                    key={i}
                    className="text-center hover:bg-gray-50 transition"
                  >

                    <td className="p-3 border-b">{c.campaign}</td>

                    <td className="p-3 border-b font-medium">{total}</td>

                    <td className="p-3 border-b text-green-600 font-semibold">
                      {passed}
                    </td>

                    <td className="p-3 border-b text-red-600 font-semibold">
                      {blocked}
                    </td>

                  </tr>
                );

              })}

            </tbody>
          </table>

        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

          <h2 className="text-xl font-semibold mb-6">
            Device Traffic
          </h2>

          {(stats.device_stats || []).map((d, i) => (

            <div
              key={i}
              className="flex justify-between items-center mb-3 p-3 rounded-xl 
      bg-white border border-gray-100 
      shadow-sm hover:shadow-md transition"
            >

              <span className="capitalize text-gray-700 font-medium">
                {d.device_type || "unknown"}
              </span>

              <span className="text-gray-900 font-semibold">
                {d.clicks}
              </span>

            </div>

          ))}

        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

          <h2 className="text-xl font-semibold mb-6">
            Top Countries
          </h2>

          {(() => {

            const grouped = {};

            (stats.country_stats || []).forEach((c) => {
              const name = getCountryName(c.country) || "Unknown";
              if (!grouped[name]) grouped[name] = 0;
              grouped[name] += c.clicks;
            });

            const list = Object.entries(grouped)
              .map(([country, clicks]) => ({ country, clicks }))
              .sort((a, b) => b.clicks - a.clicks)
              .slice(0, 5);

            return list.map((c, i) => (

              <div
                key={i}
                className="flex justify-between items-center mb-3 p-3 rounded-xl 
        bg-white border border-gray-100 
        shadow-sm hover:shadow-md transition"
              >

                <span className="text-gray-700 font-medium">
                  {c.country}
                </span>

                <span className="text-gray-900 font-semibold">
                  {c.clicks}
                </span>

              </div>

            ));

          })()}

        </div>


        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-semibold">
              Traffic Sources
            </h2>

            <select
              value={range}
              onChange={(e) => {
                setRange(e.target.value);
                loadSources(e.target.value);
              }}
              className="border border-gray-300 px-3 py-1 rounded-md text-sm 
      shadow-sm hover:border-gray-400 bg-white"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
            </select>

          </div>

          {(() => {

            const grouped = {};

            sources.forEach((s) => {
              const key = (s.source || "direct").toLowerCase();
              if (!grouped[key]) grouped[key] = 0;
              grouped[key] += s.clicks;
            });

            const list = Object.entries(grouped)
              .map(([source, clicks]) => ({ source, clicks }))
              .sort((a, b) => b.clicks - a.clicks)
              .slice(0, 5);

            const max = Math.max(...list.map((s) => s.clicks), 1);

            return list.map((s, i) => (

              <div key={i} className="mb-5">

                <div className="flex justify-between text-sm mb-2">

                  <span className="capitalize font-medium text-gray-700">
                    {s.source}
                  </span>

                  <span className="text-gray-500">
                    {s.clicks}
                  </span>

                </div>

                <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">

                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${(s.clicks / max) * 100}%` }}
                  />

                </div>

              </div>

            ));

          })()}

        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

          <h2 className="text-xl font-semibold mb-6">
            Top Zone Performance
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ✅ BEST */}
            <div>

              <h3 className="text-green-600 font-semibold mb-3">
                Best Zones
              </h3>

              {profitZones
                .sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))
                .slice(0, 2)
                .map((z, i) => {

                  const profit = z.revenue - z.cost;
                  const roi = z.cost > 0 ? ((profit / z.cost) * 100).toFixed(1) : 0;

                  return (
                    <div key={i} className="mb-3 p-4 rounded-xl 
            bg-green-50 border border-green-100 
            shadow-sm hover:shadow-md transition">

                      <div className="flex justify-between">

                        <span className="text-gray-700">
                          {z.campaign_name} • Zone {z.zone_id}
                        </span>

                        <span className="text-green-600 font-semibold">
                          +{roi}%
                        </span>

                      </div>

                    </div>
                  );
                })}

            </div>

            {/* ❌ WORST */}
            <div>

              <h3 className="text-red-600 font-semibold mb-3">
                Worst Zones
              </h3>

              {lossZones
                .sort((a, b) => (a.revenue - a.cost) - (b.revenue - a.cost))
                .slice(0, 2)
                .map((z, i) => {

                  const profit = z.revenue - z.cost;
                  const roi = z.cost > 0 ? ((profit / z.cost) * 100).toFixed(1) : 0;

                  return (
                    <div key={i} className="mb-3 p-4 rounded-xl 
            bg-red-50 border border-red-100 
            shadow-sm hover:shadow-md transition">

                      <div className="flex justify-between">

                        <span className="text-gray-700">
                          {z.campaign_name} • Zone {z.zone_id}
                        </span>

                        <span className="text-red-600 font-semibold">
                          {roi}%
                        </span>

                      </div>

                    </div>
                  );
                })}

            </div>

          </div>

        </div>


      </div>

      {showUpgrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded shadow w-96 text-center">

            <h2 className="text-xl font-bold mb-4">
              Upgrade Required 🚀
            </h2>

            <p className="mb-4">
              You reached your campaign limit.
            </p>

            <button
              onClick={() => (window.location.href = "/pricing")}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Upgrade Plan
            </button>

            <button
              onClick={() => setShowUpgrade(false)}
              className="block mt-3 text-gray-500"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>



  );

}

function StatCard({ title, value }) {

  return (

    <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-xl rounded-xl p-6">

      <p className="text-gray-300 text-sm mb-2">
        {title}
      </p>

      <p className="text-3xl font-bold">
        {value || 0}
      </p>

    </div>

  );

}

