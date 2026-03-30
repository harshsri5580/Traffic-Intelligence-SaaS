"use client";

import { useEffect, useState } from "react";
import api from "../../services/api";
import { countries } from "../../data/countries";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

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
  const [page,setPage] = useState(1);
  const rowsPerPage = 10;
  const [stats, setStats] = useState({});
  const [recent, setRecent] = useState([]);
  const start = (page - 1) * rowsPerPage;
  const paginatedRecent = recent.slice(start, start + rowsPerPage);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState([]);
  const [offers,setOffers] = useState([]);
  const [range,setRange] = useState("today");
  const [campaigns,setCampaigns] = useState([]);
  const [zones,setZones] = useState([]);
  const [plan, setPlan] = useState({});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  
  
useEffect(() => {


  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login";
    return;
  }


  loadDashboard();

  const ws = new WebSocket("ws://localhost:8000/ws/live")

  ws.onopen = () => {
    console.log("Realtime connected");
  };

 ws.onmessage = (event) => {

  console.log("WS RAW:", event.data);

  const data = JSON.parse(event.data);

 

  const mapped = {
    ip_address: data.ip,
    country: data.country,
    device_type: data.device,
    campaign_name: data.campaign,
    status: data.status,
    created_at: data.time
  };

  console.log("WS MAPPED:", mapped);

  setRecent((prev) => {

  const today = new Date().toDateString();
  const logDate = new Date(mapped.created_at).toDateString();

  if (logDate !== today) return prev;

  const updated = [mapped, ...prev];

  return updated.slice(0, 20);

});
};
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
    setPlan(planRes.data || {});
    setDaysLeft(planRes.data?.days_left || 0);
    setExpired(planRes.data?.expired || false);

    await loadRecent();
    await loadSources(range);
    await loadOffers();   // 👈 add this
    await loadCampaigns();
    await loadZones();   // 👈 ADD THIS

    setLoading(false);

  } catch (err) {

    console.error("Dashboard load error", err);

  }

};


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

try{

const res = await api.get("/analytics/offer-performance");

setOffers(res.data || []);

}catch(err){

console.error("Offer analytics error",err);

}

};

const statusColor = (status) => {

  if (status === "blocked") return "bg-red-500";

  if (status === "pass" || status === "offer")
    return "bg-green-500";

  if (status === "safe")
    return "bg-yellow-500 text-black";

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

  const campaignSummary = {};

recent.forEach((log) => {

  const isValidCampaign = campaigns.some(
    (c) => c.name === log.campaign_name
  );

  if (!isValidCampaign) return; // ❌ skip deleted

  const name = log.campaign_name || "Unknown";

  if (!campaignSummary[name]) {
    campaignSummary[name] = {
      total: 0,
      pass: 0,
      blocked: 0
    };
  }

  campaignSummary[name].total++;

  if (log.status === "offer" || log.status === "pass") {
    campaignSummary[name].pass++;
  } else {
    campaignSummary[name].blocked++;
  }

});

  if (loading) {
    return (
      <div className="p-8 text-gray-500">
        Loading dashboard...
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

{/* 🔥 SMART PLAN STATUS */}
{!expired && daysLeft > 3 && (
  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded text-center font-medium">
    ⏳ {daysLeft} days left in your plan
  </div>
)}

{!expired && daysLeft <= 3 && (
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
    className={`h-3 rounded ${
      stats.active_campaigns >= plan?.plan?.max_campaigns
        ? "bg-red-500"
        : "bg-blue-500"
    }`}
    style={{
      width: `${
        plan?.plan?.max_campaigns
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
            width: `${
              (stats.total_clicks / plan.plan.max_monthly_clicks) * 100
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

      <div className="bg-white shadow rounded p-6">

        <h2 className="text-xl font-semibold mb-4">
          Live Traffic
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-3 border">IP</th>
                <th className="p-3 border">Country</th>
                <th className="p-3 border">Device</th>
                <th className="p-3 border">Campaign</th>
                <th className="p-3 border">Decision</th>
                <th className="p-3 border">Time</th>
              </tr>

            </thead>

            <tbody>

              {paginatedRecent.map((log, i) => (

                <tr key={i} className="text-center hover:bg-gray-50">

                 <td className="p-2 border">{log.ip_address}</td>
<td className="p-2 border">{getCountryName(log.country)}</td>
<td className="p-2 border">{log.device_type}</td>
<td className="p-2 border">{log.campaign_name || log.campaign_id || "-"}</td>

                  <td className="p-2 border">

                    <span className={`text-white text-xs px-2 py-1 rounded ${statusColor(log.status)}`}>
                      {log.status}
                    </span>

                  </td>

                  <td className="p-2 border">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString() : "-"}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

          <div className="flex justify-between items-center mt-4">

<button
disabled={page === 1}
onClick={()=>setPage(page-1)}
className="px-3 py-1 bg-gray-200 rounded"
>
Prev
</button>

<span>
Page {page} / {Math.ceil(recent.length / rowsPerPage)}
</span>

<button
disabled={page >= Math.ceil(recent.length / rowsPerPage)}
onClick={()=>setPage(page+1)}
className="px-3 py-1 bg-gray-200 rounded"
>
Next
</button>

</div>

        </div>

      </div>


      <div className="bg-white shadow rounded p-6">

  <h2 className="text-xl font-semibold mb-4">
    💰 Profit Tracking (Per Click)
  </h2>

  <div className="overflow-x-auto">

    <table className="w-full text-sm">

      <thead className="bg-gray-100">
        <tr>
          <th className="p-3 border">Click ID</th>
          <th className="p-3 border">Campaign</th>
          <th className="p-3 border">Cost</th>
          <th className="p-3 border">Revenue</th>
          <th className="p-3 border">ROI</th>
          <th className="p-3 border">Status</th>
        </tr>
      </thead>

      <tbody>

        {recent.slice(0, 10).map((log, i) => {

          const isProfit = log.roi > 0;

          return (
            <tr key={i} className="text-center hover:bg-gray-50">

              <td className="p-2 border">{log.click_id}</td>
              <td className="p-2 border">{log.campaign_name}</td>

              <td className="p-2 border text-red-500">
                {log.cost || 0}
              </td>

              <td className="p-2 border text-green-600">
                {log.revenue || 0}
              </td>

              <td className="p-2 border">
                <span className={isProfit ? "text-green-600" : "text-red-600"}>
                  {log.roi || 0}%
                </span>
              </td>

              <td className="p-2 border">
                {isProfit ? "🔥 Profit" : "💀 Loss"}
              </td>

            </tr>
          );

        })}

      </tbody>

    </table>

  </div>

</div>

      
      <div className="bg-white shadow rounded p-6">

<h2 className="text-xl font-semibold mb-4">
Campaign Traffic Summary
</h2>

<table className="w-full text-sm">

<thead className="bg-gray-100">
<tr>
<th className="p-3 border">Campaign</th>
<th className="p-3 border">Total</th>
<th className="p-3 border">Passed</th>
<th className="p-3 border">Blocked</th>
</tr>
</thead>

<tbody>

{Object.entries(campaignSummary).map(([name,data],i)=>(
<tr key={i} className="text-center">

<td className="p-2 border">{name}</td>
<td className="p-2 border">{data.total}</td>
<td className="p-2 border text-green-600">{data.pass}</td>
<td className="p-2 border text-red-600">{data.blocked}</td>

</tr>
))}

</tbody>

</table>

</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white shadow rounded p-6">

          <h2 className="text-xl font-semibold mb-4">
            Device Traffic
          </h2>

          {(stats.device_stats || []).map((d, i) => (

            <div key={i} className="flex justify-between border-b py-2">
              <span>{d.device_type || "unknown"}</span>
              <span>{d.clicks}</span>
            </div>

          ))}

        </div>

        <div className="bg-white shadow rounded p-6">

          <h2 className="text-xl font-semibold mb-4">
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
    .slice(0, 5); // top 5 only

  return list.map((c, i) => (

    <div key={i} className="flex justify-between border-b py-2">
      <span>{c.country}</span>
      <span>{c.clicks}</span>
    </div>

  ));

})()}

        </div>


        <div className="bg-white shadow rounded p-6">

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
      className="border px-3 py-1 rounded text-sm"
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
      .slice(0, 5); // top 5 sources only

    const max = Math.max(...list.map((s) => s.clicks), 1);

    return list.map((s, i) => (

      <div key={i} className="mb-5">

        <div className="flex justify-between text-sm mb-1">

          <span className="capitalize font-medium text-gray-700">
            {s.source}
          </span>

          <span className="text-gray-500">
            {s.clicks}
          </span>

        </div>

        <div className="w-full bg-gray-200 h-2 rounded">

          <div
            className="bg-green-500 h-2 rounded transition-all"
            style={{ width: `${(s.clicks / max) * 100}%` }}
          />

        </div>

      </div>

    ));

  })()}

</div>

<div className="bg-white shadow rounded p-6 max-h-[300px] overflow-y-auto">

  <h2 className="text-xl font-semibold mb-4">
    Zone Performance (ROI)
  </h2>

  {/* 🔥 PROFIT ZONES */}
  <h3 className="text-green-600 font-semibold mb-2">🔥 Profit Zones</h3>

  {profitZones
    .sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))
    .slice(0, 3)
    .map((z, i) => {

      const roiRaw = z.cost > 0 ? ((z.revenue - z.cost) / z.cost) * 100 : 0;
      const roi = roiRaw.toFixed(2);
      const isProfit = roiRaw > 0;

      return (
        <div key={i} className="mb-4 border-b pb-3">

          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Zone {z.zone_id}</span>

            <div className="text-right">
              <div className="text-green-600 font-semibold">
                {roi}% ROI
              </div>
              <div className="text-xs text-gray-500">🔥 Scale</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex justify-between">
            <span>Cost: {z.cost}</span>
            <span>Revenue: {z.revenue}</span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${Math.min(Math.abs(roi), 100)}%` }}
            />
          </div>

        </div>
      );
    })}

  {/* 🔥 LOSS ZONES */}
  <h3 className="text-red-600 font-semibold mt-6 mb-2">💀 Loss Zones</h3>

  {lossZones
    .sort((a, b) => (a.revenue - a.cost) - (b.revenue - b.cost))
    .slice(0, 3)
    .map((z, i) => {

      const roiRaw = z.cost > 0 ? ((z.revenue - z.cost) / z.cost) * 100 : 0;
      const roi = roiRaw.toFixed(2);

      return (
        <div key={i} className="mb-4 border-b pb-3">

          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">Zone {z.zone_id}</span>

            <div className="text-right">
              <div className="text-red-600 font-semibold">
                {roi}% ROI
              </div>
              <div className="text-xs text-gray-500">💀 Kill</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex justify-between">
            <span>Cost: {z.cost}</span>
            <span>Revenue: {z.revenue}</span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-red-500 h-2 rounded"
              style={{ width: `${Math.min(Math.abs(roi), 100)}%` }}
            />
          </div>

        </div>
      );
    })}

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

