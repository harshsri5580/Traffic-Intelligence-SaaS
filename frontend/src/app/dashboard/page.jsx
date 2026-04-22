"use client";
// let ws = null;
let socketInstance = null; // 🔥 GLOBAL
import {
  Chart,
  LineElement,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip
);
// ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip);

import { useEffect, useState, useMemo, useRef } from "react";
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

const formatNumber = (num) => {
  if (!num) return 0;

  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";

  return num;
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
  // const [offers, setOffers] = useState([]);
  const [offerPerformance, setOfferPerformance] = useState([]);
  const [range, setRange] = useState("today");
  const [campaigns, setCampaigns] = useState([]);
  const [zones, setZones] = useState([]);
  const [plan, setPlan] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [advancedProfit, setAdvancedProfit] = useState(null);
  // const [profitRange, setProfitRange] = useState("today");
  const [trafficRange, setTrafficRange] = useState("today");
  // const [chartKey, setChartKey] = useState(0);
  // const [mapKey, setMapKey] = useState(0);
  // const wsRef = useRef(null);
  // const hasLoaded = useRef(false);
  // const hasConnected = useRef(false);
  const wsRef = useRef(null);
  // const hasConnected = useRef(false);
  // const hasLoaded = useRef(false);

  useEffect(() => {
    loadDashboard(); // 🔥 MISSING CALL
  }, []);

  useEffect(() => {
    if (socketInstance) {
      wsRef.current = socketInstance;
      return;
    }

    const token = localStorage.getItem("token");

    const WS_URL =
      window.location.hostname === "localhost"
        ? `ws://localhost:8000/api/dashboard/live?token=${token}`
        : `wss://api.trafficintelai.com/api/dashboard/live?token=${token}`;

    const socket = new WebSocket(WS_URL);
    socketInstance = socket;
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("✅ WS CONNECTED (SINGLE)");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "ping") return;

        setRecent((prev) => [
          {
            ip_address: data.ip,
            country: data.country,
            device_type: data.device,
            campaign_name: data.campaign,
            status: data.status,
            created_at: data.time,
          },
          ...prev,
        ].slice(0, 20));
      } catch { }
    };

    socket.onclose = () => {
      console.log("🔌 WS CLOSED");
      socketInstance = null;
    };

    return () => {
      // ❌ DO NOT CLOSE in dev mode
    };
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

  const loadRestData = async () => {
    try {
      await Promise.all([
        loadRecent(),
        loadSources(range),
        loadOffers(),
        loadCampaigns(),
        loadZones(),
        loadCampaignTraffic(trafficRange),
        loadAdvancedProfit()
      ]);
    } catch (e) {
      console.log("Background load error");
    }
  };



  const loadDashboard = async () => {
    try {

      const [statsRes, planRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/billing/my-subscription"),
      ]);

      setStats(statsRes.data || {});
      setPlan(planRes.data || {});

      setLoading(false); // 🔥 FAST SHOW UI

      // 👇 बाकी data background में लोड होगा
      loadRestData();

    } catch (err) {
      setLoading(false);
    }
  };

  const loadAdvancedProfit = async () => {
    try {
      const res = await api.get("/analytics/profit-advanced", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setAdvancedProfit(res.data);
    } catch (err) {
      console.error("Advanced profit error", err);
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

      setOfferPerformance(res.data || []);


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


  function ProfitChart({ data }) {
    const canvasRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
      if (!canvasRef.current) return;

      // 🔥 destroy old chart
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = canvasRef.current.getContext("2d");

      chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: data.map(d => d.date),
          datasets: [
            {
              label: "Profit",
              data: data.map(d => Number((d.revenue || 0) - (d.cost || 0))),
              borderColor: "#22c55e",
              backgroundColor: "rgba(34,197,94,0.2)",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
        },
      });

      // 🔥 resize fix (destroy + recreate)
      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.destroy();
          chartInstance.current = null;
        }

        const ctx = canvasRef.current.getContext("2d");

        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels: data.map(d => d.date),
            datasets: [
              {
                label: "Profit",
                data: data.map(d => Number((d.revenue || 0) - (d.cost || 0))),
                borderColor: "#22c55e",
                backgroundColor: "rgba(34,197,94,0.2)",
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
          },
        });
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }
      };
    }, [data]);

    return (
      <div className="bg-white p-6 rounded-2xl shadow overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">Profit Trend</h2>

        <div className="w-full h-[250px] relative">
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }

  return (

    <div className="flex-1 min-w-0 overflow-x-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 py-6 space-y-6">

        <h1 className="text-3xl font-semibold flex items-center gap-3 tracking-tight">

          Dashboard

          <span className="flex items-center gap-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">

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

        <div className="bg-white/80 backdrop-blur-xl 
rounded-2xl p-6 
border border-gray-200/50 
shadow-[0_8px_30px_rgba(0,0,0,0.06)]">

          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
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
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
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

          {plan?.plan?.max_monthly_clicks &&
            stats?.monthly_clicks >= plan.plan.max_monthly_clicks && (
              <div className="mt-3 text-sm text-red-600 font-medium">
                🚫 Monthly limit reached — campaigns paused
              </div>
            )}

          {/* Clicks */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Clicks</span>
              <span>
                {formatNumber(stats?.monthly_clicks || 0)} / {formatNumber(plan?.plan?.max_monthly_clicks || 0)}
              </span>
            </div>

            {plan?.plan?.max_monthly_clicks && (
              <div className="w-full bg-gray-200 h-3 rounded">
                <div
                  className="bg-green-500 h-3 rounded"
                  style={{
                    width: `${((stats.monthly_clicks || 0) / plan.plan.max_monthly_clicks) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

        </div>

        {advancedProfit && (
          <div className="space-y-6">

            {/* 🔥 INSIGHT (TOP - FULL WIDTH) */}
            {/* 🚨 AUTO ALERTS */}

            {/* <div className={`flex items-center justify-between p-4 rounded-xl border
  ${advancedProfit.roi > 50
              ? "bg-green-50 border-green-200"
              : advancedProfit.roi > 0
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
            }`}>

            <div className="flex items-center gap-3">

              <span className="text-xl">
                {advancedProfit.roi > 50 ? "🚀" : advancedProfit.roi > 0 ? "⚖️" : "❌"}
              </span>

              <div className="text-sm font-medium">
                {advancedProfit.roi > 50 && "Scale campaigns aggressively"}
                {advancedProfit.roi > 0 && advancedProfit.roi <= 50 && "Optimize for better ROI"}
                {advancedProfit.roi <= 0 && "Stop or fix campaigns immediately"}
              </div>

            </div>

            <div className="text-xs text-gray-500">
              ROI: {advancedProfit.roi.toFixed(1)}%
            </div>

          </div> */}

            {/* 🔥 STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

              <StatCard
                title="💰 Profit"
                value={`$${Number(advancedProfit.profit || 0).toFixed(2)}`}
              />

              <StatCard
                title="📈 ROI"
                value={
                  advancedProfit.roi > 50
                    ? `🔥 ${advancedProfit.roi.toFixed(1)}%`
                    : advancedProfit.roi > 0
                      ? `🟢 ${advancedProfit.roi.toFixed(1)}%`
                      : `🔴 ${advancedProfit.roi.toFixed(1)}%`
                }
              />

              <StatCard
                title="⚡ EPC"
                value={`${Number(advancedProfit.epc || 0).toFixed(4)}`}
              />

              <StatCard
                title="🎯 CPA"
                value={`$${Number(advancedProfit.cpa || 0).toFixed(2)}`}
              />

              <StatCard
                title="🤖 Bot %"
                value={`${Number(advancedProfit.bot_percent || 0).toFixed(1)}%`}
              />

              <StatCard
                title="🎯 CVR"
                value={`${Number(advancedProfit.cvr || 0).toFixed(2)}%`}
              />

            </div>

            <div className="bg-white p-4 rounded-xl shadow border flex justify-between text-sm">

              <div>
                <p className="text-gray-400 text-xs">Clicks</p>
                <p className="font-semibold">{advancedProfit.clicks}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Conversions</p>
                <p className="font-semibold">{advancedProfit.conversions}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Revenue</p>
                <p className="font-semibold">${advancedProfit.revenue.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">Cost</p>
                <p className="font-semibold">${advancedProfit.cost.toFixed(2)}</p>
              </div>

            </div>

            {advancedProfit?.alerts?.length > 0 && (
              <div className="space-y-3">

                {advancedProfit.alerts.map((alert, i) => {

                  const isGood = alert.includes("🚀");
                  const isBad = alert.includes("❌") || alert.includes("🚨");
                  const isWarn = alert.includes("⚠️");

                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition

        ${isGood && "bg-green-50 border-green-200 text-green-700"}
        ${isBad && "bg-red-50 border-red-200 text-red-700"}
        ${isWarn && "bg-yellow-50 border-yellow-200 text-yellow-700"}
        `}
                    >

                      {/* LEFT */}
                      <div className="flex items-center gap-2">
                        <span className="text-base">{alert.split(" ")[0]}</span>

                        <span className="font-medium">
                          {alert.replace(alert.split(" ")[0], "").trim()}
                        </span>
                      </div>

                      {/* RIGHT (ROI highlight only if exists) */}
                      {/* {alert.includes("ROI") && (
                      <span className="text-xs font-semibold opacity-70">
                        {alert.match(/\(ROI:.*\)/)?.[0]}
                      </span>
                    )} */}

                    </div>
                  );

                })}

              </div>
            )}

            {/* 🔥 CHART */}
            {advancedProfit?.graph && (
              <ProfitChart data={advancedProfit.graph} />
            )}

            {/* 🌍 GEO ROI */}
            {/* {advancedProfit?.geo_roi?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow border mt-6">

                <h3 className="text-lg font-semibold mb-4">
                  🌍 Top GEO ROI
                </h3>

                <div className="space-y-3">

                  {advancedProfit.geo_roi
                    .sort((a, b) => b.roi - a.roi)
                    .slice(0, 5)
                    .map((g, i) => (

                      <div key={i} className="flex justify-between items-center 
          p-3 rounded-lg bg-gray-50 border">

                        <span className="text-gray-700">
                          {g.country}
                        </span>

                        <span className={`font-semibold 
              ${g.roi > 0 ? "text-green-600" : "text-red-600"}`}>
                          {g.roi}%
                        </span>

                      </div>

                    ))}

                </div>

              </div>
            )} */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">


          <StatCard title="Total Clicks" value={formatNumber(stats.total_clicks)} />
          <StatCard title="Today Clicks" value={stats.today_clicks} />
          <StatCard title="Unique Visitors" value={stats.unique_ips} />
          <StatCard title="Passed Traffic" value={stats.passed} />
          <StatCard title="Blocked Traffic" value={stats.blocked} />
          {/* <StatCard
          title="Total Profit"
          value={`$${Number(stats.total_profit || 0).toFixed(2)}`}
        />

        <StatCard
          title="ROI"
          value={`${Number(stats.roi || 0).toFixed(2)}%`}
        /> */}

        </div>



        <div className="bg-white/70 backdrop-blur-xl 
rounded-2xl pt-3 pb-4 px-4
border border-gray-200/60 
shadow-[0_10px_40px_rgba(0,0,0,0.08)]">

          {/* 🔥 HEADER */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🌍 Live Traffic
            </h2>

            <span className="text-xs text-gray-400">
              Last activity
            </span>
          </div>

          {/* 🔥 MAP WRAPPER */}
          <div className="w-full max-w-full overflow-hidden rounded-xl border border-gray-100 -mt-2 relative">

            <div className="w-full max-w-full overflow-hidden flex">
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{ scale: 120, center: [10, 20] }}
                style={{ width: "100%", height: "320px" }}
              >

                {/* 🌍 MAP BASE */}
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#e2e8f0"              // 🔥 better visible base color
                        stroke="#94a3b8"            // 🔥 clear borders
                        strokeWidth={0.4}
                        style={{
                          default: {
                            outline: "none",
                            transition: "all 0.2s ease-in-out",
                          },
                          hover: {
                            fill: "#60a5fa",        // 🔥 blue highlight on hover
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: {
                            fill: "#3b82f6",
                            outline: "none",
                          },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {/* 🔥 SMART MARKERS */}
                {Array.isArray(recent) &&
                  recent.slice(0, 12).map((log, i) => {

                    const countryName = getCountryName(log.country);
                    const coords = countryCoords[countryName];

                    if (!coords) return null;

                    return (
                      <Marker key={i} coordinates={coords}>

                        {/* 🔵 SOFT GLOW */}
                        <circle r={6} fill="rgba(34,197,94,0.15)">
                          <animate
                            attributeName="r"
                            values="4;8;4"
                            dur="2.2s"
                            repeatCount="indefinite"
                          />
                        </circle>

                        {/* 🟢 CORE DOT */}
                        <circle r={2.5} fill="#22c55e" />

                      </Marker>
                    );
                  })}

              </ComposableMap>

            </div>

            {/* 🔥 FOOTER STATS */}
            <div className="flex justify-between mt-4 text-xs text-gray-500">

              <div className="flex gap-4 text-sm text-gray-600">

                {/* <span>
                  📊 Today: {recent?.length || 0}
                </span> */}

                <span>
                  🟢 Live: {
                    recent?.filter(r => {
                      const time = new Date(r.created_at);
                      const now = new Date();
                      return (now - time) / 1000 < 60;
                    }).length || 0
                  }
                </span>

              </div>

              <span>
                Live tracking enabled
              </span>

            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 
shadow-[0_10px_30px_rgba(0,0,0,0.08)] 
border border-gray-100 
hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] 
transition-all duration-300">

          <h2 className="text-xl font-semibold mb-6">
            Live Traffic
          </h2>

          <div className="w-full overflow-x-auto rounded-xl border border-gray-100">

            <table className="w-full text-sm">

              <thead className="bg-gray-100/70 backdrop-blur">
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
                      {log.created_at ? new Date(log.created_at + "Z").toLocaleString() : "-"}
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
              className="px-3 py-1 rounded-md bg-white border border-gray-200 
hover:bg-gray-100 hover:shadow-md 
transition-all duration-200 disabled:opacity-50 transition"
            >
              Prev
            </button>

            <span className="text-sm text-gray-600">
              Page {page} / {Math.ceil(recent.length / rowsPerPage)}
            </span>

            <button
              disabled={page >= Math.ceil(recent.length / rowsPerPage)}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 rounded-md bg-white border border-gray-200 
hover:bg-gray-100 hover:shadow-md 
transition-all duration-200 disabled:opacity-50 transition"
            >
              Next
            </button>

          </div>

        </div>


        {/* 🌍 GEO ROI */}
        {advancedProfit?.geo_roi?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow border mt-6">

            <h3 className="text-lg font-semibold mb-4">
              🌍 Top GEO ROI
            </h3>

            <div className="space-y-3">

              {advancedProfit.geo_roi
                .sort((a, b) => b.roi - a.roi)
                .slice(0, 5)
                .map((g, i) => (

                  <div key={i} className="flex justify-between items-center 
          p-3 rounded-lg bg-gray-50 border">

                    <span className="text-gray-700">
                      {g.country}
                    </span>

                    <span className={`font-semibold 
              ${g.roi > 0 ? "text-green-600" : "text-red-600"}`}>
                      {g.roi}%
                    </span>

                  </div>

                ))}

            </div>

          </div>
        )}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100">

          <h2 className="text-xl font-semibold mb-6">
            📊 Campaign Performance
          </h2>

          <div className="space-y-4">

            {campaignSummary.map((c, i) => {

              const profit = c.revenue - c.cost;
              const roi =
                c.cost > 0
                  ? ((profit / c.cost) * 100)
                  : 0;

              return (
                <div
                  key={i}
                  className="flex flex-col md:flex-row justify-between items-center p-4 rounded-xl border bg-gray-50 hover:bg-white hover:shadow transition-all"
                >

                  {/* LEFT */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">

                    <div className="font-semibold text-lg">
                      {c.campaign}
                    </div>

                    <div className="text-sm text-gray-500">
                      {c.clicks} clicks
                    </div>

                  </div>

                  {/* RIGHT */}
                  <div className="flex gap-6 mt-3 md:mt-0 text-sm items-center">

                    <div>
                      <p className="text-gray-400">Cost</p>
                      <p className="text-red-500 font-medium">
                        ${c.cost.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Revenue</p>
                      <p className="text-green-600 font-medium">
                        ${c.revenue.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Profit</p>
                      <p className={`font-semibold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${profit.toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">ROI</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${roi >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${roi > 50
                            ? "bg-green-200 text-green-800"
                            : roi > 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                            }`}
                        >
                          {roi.toFixed(1)}%
                        </span>
                      </span>
                    </div>

                  </div>
                </div>
              );

            })}

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
          <div className="w-full overflow-x-auto rounded-xl border border-gray-100">

            <table className="w-full text-sm">

              <thead className="bg-gray-100/70 backdrop-blur">
                <tr>
                  <th className="p-3 border-b">Campaign</th>
                  <th className="p-3 border-b">Total</th>
                  <th className="p-3 border-b">Passed</th>
                  <th className="p-3 border-b">Fallback</th>
                  <th className="p-3 border-b">Blocked</th>
                </tr>
              </thead>

              <tbody>

                {campaignTraffic.map((c, i) => {

                  const total = c.total || 0;
                  const passed = c.passed || 0;
                  const blocked = c.blocked || 0;
                  const fallback = c.fallback ?? (total - passed - blocked);
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
                      <td className="p-3 border-b text-yellow-500 font-semibold">
                        {fallback}
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
                  🟢 Best Zones
                </h3>

                <div className="space-y-3">

                  {profitZones
                    .sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))
                    .slice(0, 2)
                    .map((z, i) => {

                      const profit = z.revenue - z.cost;
                      const roi = z.cost > 0 ? ((profit / z.cost) * 100).toFixed(1) : 0;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 rounded-xl
              bg-green-50 border border-green-100
              hover:bg-white hover:shadow-md transition"
                        >

                          {/* LEFT (NO WRAP) */}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium truncate">
                              {z.campaign_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              Zone {z.zone_id}
                            </p>
                          </div>

                          {/* RIGHT */}
                          <div className="ml-4 text-green-600 font-semibold whitespace-nowrap">
                            +{roi}%
                          </div>

                        </div>
                      );
                    })}

                </div>

              </div>

              {/* ❌ WORST */}
              <div>

                <h3 className="text-red-600 font-semibold mb-3">
                  🔴 Worst Zones
                </h3>

                <div className="space-y-3">

                  {lossZones
                    .sort((a, b) => (a.revenue - a.cost) - (b.revenue - a.cost))
                    .slice(0, 2)
                    .map((z, i) => {

                      const profit = z.revenue - z.cost;
                      const roi = z.cost > 0 ? ((profit / z.cost) * 100).toFixed(1) : 0;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 rounded-xl
              bg-red-50 border border-red-100
              hover:bg-white hover:shadow-md transition"
                        >

                          {/* LEFT (NO WRAP) */}
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium truncate">
                              {z.campaign_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              Zone {z.zone_id}
                            </p>
                          </div>

                          {/* RIGHT */}
                          <div className="ml-4 text-red-600 font-semibold whitespace-nowrap">
                            {roi}%
                          </div>

                        </div>
                      );
                    })}

                </div>

              </div>

            </div>

          </div>


        </div>

        {
          showUpgrade && (
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
          )
        }

      </div >

    </div >


  );

}

function StatCard({ title, value }) {

  return (

    <div className="relative overflow-hidden 
bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 
text-white rounded-2xl p-6 
shadow-[0_10px_40px_rgba(0,0,0,0.25)] 
hover:scale-[1.01] transition duration-300">

      <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">
        {title}
      </p>

      <p className="text-2xl font-medium tracking-wider leading-tight">
        {value || 0}
      </p>

    </div>

  );

}

