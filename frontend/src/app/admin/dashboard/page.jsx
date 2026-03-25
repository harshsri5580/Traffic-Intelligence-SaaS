"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function AdminDashboard() {

  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);

useEffect(() => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  console.log("ADMIN CHECK:", { token, role });

  if (!token) {
    window.location.href = "/login";
    return;
  }
  
  // 🔥 wait until role exists
  if (!role) return;

  if (role !== "admin") {
    window.location.href = "/dashboard";
    return;
  }

  loadStats();
  loadChart();

}, []);

const loadChart = async () => {
  try {
    const res = await api.get("/admin/stats/chart");

    setChartData({
      labels: res.data.labels,
      datasets: [
        {
          label: "Clicks (Last 7 Days)",
          data: res.data.clicks,
          borderWidth: 2,
          tension: 0.3
        }
      ]
    });

  } catch (err) {
    console.error("chart error", err);
  }
};

  const loadStats = async () => {

    try {

      const res = await api.get("/admin/stats");
      setStats(res.data);

    } catch (err) {

      console.error("admin stats error", err);

    }

  };

  if (!stats) {
    return <div className="p-8">Loading admin dashboard...</div>;
  }

  return (

    <div className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">

        <StatCard title="Total Users" value={stats.total_users} />
        <StatCard title="Total Campaigns" value={stats.total_campaigns} />
        <StatCard title="Total Clicks" value={stats.total_clicks} />
        <StatCard title="Active Campaigns" value={stats.active_campaigns} />
        <StatCard title="Today Clicks" value={stats.today_clicks} />
        <StatCard title="Revenue" value={`$${stats.revenue}`} />
        <StatCard title="Errors" value={stats.errors} />

  

      </div>

            <div className="mt-10 bg-white p-6 rounded shadow">
  <h2 className="text-lg font-semibold mb-4">
    Clicks (Last 7 Days)
  </h2>

  {chartData ? (
    <Line data={chartData} />
  ) : (
    <p>Loading chart...</p>
  )}
</div>

    </div>

  );

}


// ✅ reusable
function StatCard({ title, value }) {

  return (

    <div className="bg-white shadow rounded p-6">

      <p className="text-gray-500 text-sm">
        {title}
      </p>

      <p className="text-3xl font-bold">
        {value}
      </p>

    </div>

  );

}