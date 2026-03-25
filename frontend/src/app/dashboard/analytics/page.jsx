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

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [chartData, setChartData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search,setSearch] = useState("");
  const [botStats, setBotStats] = useState({
  human: 0,
  bot: 0,
  suspicious: 0
});

  const loadData = async () => {

    try {

      setLoading(true);

      const [logsRes, overviewRes] = await Promise.all([
        api.get(`/analytics/recent?page=${page}&limit=${rowsPerPage}`),
        api.get("/analytics/overview")
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

      if(page === 1){
  buildCharts(logsData);
}

    } catch (err) {

      console.error("Analytics load error", err);

    } finally {

      setLoading(false);

    }
    

  };

 useEffect(() => {
  loadData();
}, [page]);

useEffect(()=>{

const interval = setInterval(()=>{

loadData()

},10000)

return ()=>clearInterval(interval)

},[])

  const refresh = async () => {

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
  const countryMap = {};
  const deviceMap = {};
  const fraudMap = {
    vpn:0,
    datacenter:0,
    residential:0
  };

  logs.forEach((log)=>{

    if(!log.created_at) return;

    const hour = new Date(log.created_at).getHours();

    trafficByHour[hour] = (trafficByHour[hour] || 0) + 1;

    if(log.country){
      countryMap[log.country] = (countryMap[log.country] || 0) + 1;
    }

    if(log.device_type){
      deviceMap[log.device_type] = (deviceMap[log.device_type] || 0) + 1;
    }

    if(log.connection_type === "vpn") fraudMap.vpn++
    else if(log.connection_type === "datacenter") fraudMap.datacenter++
    else fraudMap.residential++

  });

  const hours = Array.from({length:24},(_,i)=>i);

  setChartData(
    hours.map(h=>({
      hour:`${h}:00`,
      clicks:trafficByHour[h] || 0
    }))
  );

  setCountryData(
    Object.entries(countryMap)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)
      .map(([c,v])=>({
        name:getCountryName(c),
        value:v
      }))
  );

  setDeviceData(
    Object.entries(deviceMap).map(([d,v])=>({
      name:d,
      value:v
    }))
  );

};

 const filteredLogs = logs.filter((log) => {

  if (statusFilter !== "all" && log.status !== statusFilter) return false;

  if(search){
    const q = search.toLowerCase();
    return (
      log.ip_address?.toLowerCase().includes(q) ||
      log.campaign_name?.toLowerCase().includes(q)
    );
  }

  return true;

});

  const statusColor = (status) => {

   if (status === "blocked") return "bg-red-500";
if (status === "passed") return "bg-green-600";
if (status === "offer") return "bg-green-500";
if (status === "rule") return "bg-blue-500";
if (status === "fallback") return "bg-yellow-500";

    return "bg-gray-400";

  };

  return (

    <div className="p-8 max-w-[1200px] mx-auto">

      <h1 className="text-3xl font-bold mb-8">
        Traffic Analytics
      </h1>

      {overview && (

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          <StatCard title="Total Clicks" value={overview.total_clicks} />
          <StatCard title="Real Traffic" value={overview.real_traffic} />
          <StatCard title="Blocked" value={overview.blocked} />

        </div>

      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

 <StatCard title="VPN Traffic" value={overview?.vpn || 0}/>
<StatCard title="Datacenter Traffic" value={overview?.datacenter || 0}/>
<StatCard title="Residential Traffic" value={overview?.residential || 0}/>

</div>

<div className="bg-white shadow rounded p-6 mb-10">

  <h2 className="text-xl font-semibold mb-4">
    Bot vs Human Analysis
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

    <div className="p-4 rounded-lg bg-green-50 border">
      <div className="text-sm text-gray-500">Human</div>
      <div className="text-2xl font-bold text-green-600">
        {botStats.human}
      </div>
    </div>

    <div className="p-4 rounded-lg bg-yellow-50 border">
      <div className="text-sm text-gray-500">Suspicious</div>
      <div className="text-2xl font-bold text-yellow-600">
        {botStats.suspicious}
      </div>
    </div>

    <div className="p-4 rounded-lg bg-red-50 border">
      <div className="text-sm text-gray-500">Bots</div>
      <div className="text-2xl font-bold text-red-600">
        {botStats.bot}
      </div>
    </div>

  </div>

</div>

      <div className="bg-white p-6 shadow rounded mb-10">

        <h2 className="text-lg font-semibold mb-4">
          Traffic By Hour
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <LineChart data={chartData}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="hour" />

            <YAxis />

            <Tooltip />

            <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={3} />

          </LineChart>

        </ResponsiveContainer>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">

        <ChartCard title="Country Distribution" data={countryData} />
        <ChartCard title="Device Distribution" data={deviceData} />

      </div>

      <div className="flex gap-3 mb-6">

        <select
          className="border px-3 py-2 rounded"
          value={statusFilter}
          onChange={(e)=>setStatusFilter(e.target.value)}
        >

          <option value="all">All</option>
<option value="offer">Passed</option>
<option value="blocked">Blocked</option>
<option value="fallback">Safe</option>
<option value="rule">Rule Redirect</option>

        </select>

        <select
  className="border px-3 py-2 rounded"
  value={rowsPerPage}
  onChange={(e)=>{
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }}
>
  <option value="25">25 rows</option>
  <option value="50">50 rows</option>
  <option value="100">100 rows</option>
</select>

        <button
          onClick={refresh}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      <div className="bg-white shadow rounded overflow-x-auto max-h-[600px]">

        <table className="w-full text-sm">

          <thead className="bg-gray-100 sticky top-0">

            <tr>

               <th className="p-3">ClickID</th>
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

          <tbody>

            {filteredLogs.length === 0 && (
<tr>
<td colSpan="11" className="p-6 text-center text-gray-500">
No analytics data found
</td>
</tr>
)}

            {filteredLogs.map((log, i)=> (

               <tr key={`${log.click_id}-${i}`} className="border-t hover:bg-gray-50 text-center">

                <td className="p-3 font-mono text-xs">
  {log.click_id || "-"}
</td>
                <td className="p-3">{log.ip_address || "-"}</td>
                <td className="p-3">{getCountryName(log.country)}</td>
                <td className="p-3">{log.device_type}</td>
                <td className="p-3">{log.browser}</td>
                <td className="p-3">{log.isp}</td>
                <td className="p-3">{log.campaign_name || "-"}</td>
                <td className="p-3">{log.offer_name || "-"}</td>
                <td className="p-3">
<span className={`px-2 py-1 rounded text-xs
${log.bot_score >= 70 ? "bg-red-100 text-red-700":
log.bot_score >= 40 ? "bg-yellow-100 text-yellow-700":
"bg-green-100 text-green-700"}`}>
{log.bot_score}
</span>
</td>

                <td className="p-3">

                  <span className={`text-white text-xs px-2 py-1 rounded ${statusColor(log.status)}`}>
                    {log.status}
                  </span>

                </td>

                <td className="p-3">
                  {log.created_at ? new Date(log.created_at).toLocaleString() : "-"}
                </td>


                <td className="p-3 text-green-600 font-semibold">
  ${log.revenue || 0}
</td>

<td className="p-3 text-blue-600 font-semibold">
  {log.epc || 0}
</td>

<td className={`p-3 font-semibold ${
  log.roi > 0 ? "text-green-600" : "text-red-600"
}`}>
  {log.roi || 0}%
</td>

              </tr>

            ))}

          </tbody>

        </table>


      </div>

      
        <div className="flex justify-between items-center p-4">

  <button
    disabled={page === 1}
    onClick={()=>setPage(page-1)}
    className="px-3 py-1 bg-gray-200 rounded"
  >
    Previous
  </button>

  <span>
    Page {page} / {totalPages}
  </span>

  <button
    disabled={page === totalPages}
    onClick={()=>setPage(page+1)}
    className="px-3 py-1 bg-gray-200 rounded"
  >
    Next
  </button>

</div>

    </div>

  );

}

function StatCard({ title, value }) {

  return (

    <div className="bg-white shadow p-6 rounded">

      <div className="text-gray-500 text-sm mb-1">
        {title}
      </div>

      <div className="text-2xl font-bold">
        {value || 0}
      </div>

    </div>

  );

}

function ChartCard({ title, data }) {

  const colors = ["#6366f1","#10b981","#f59e0b","#ef4444"];

  return (

    <div className="bg-white p-6 shadow rounded">

      <h2 className="text-lg font-semibold mb-4">
        {title}
      </h2>

      <ResponsiveContainer width="100%" height={250}>

        <PieChart>

          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
          >

            {data.map((entry, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}

          </Pie>

          <Tooltip />

        </PieChart>

      </ResponsiveContainer>

    </div>

  );

}