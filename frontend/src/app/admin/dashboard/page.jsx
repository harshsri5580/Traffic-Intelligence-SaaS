"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

import {
  Users,
  Globe,
  Activity,
  MousePointerClick,
  DollarSign,
  AlertTriangle
} from "lucide-react";

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

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "#E5E7EB"
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#9CA3AF"
        },
        grid: {
          color: "rgba(255,255,255,0.05)"
        }
      },
      y: {
        ticks: {
          color: "#9CA3AF"
        },
        grid: {
          color: "rgba(255,255,255,0.05)"
        }
      }
    }
  };
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

    const interval = setInterval(() => {
      loadStats();
      loadChart();
    }, 15000);

    return () => clearInterval(interval);

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
            borderWidth: 1.8,
            tension: 0.3,
            borderColor: "#60A5FA",
            backgroundColor: "rgba(96,165,250,0.15)",
            pointBackgroundColor: "#93C5FD",
            pointBorderColor: "#93C5FD",
            pointRadius: 3,
            hoverRadius: 5,
            fill: true,
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

    <div className="min-h-screen bg-[#F3F4F6] px-8 py-7">

      <div className="flex items-start justify-between mb-14">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            Admin Dashboard
          </h1>

          <p className="text-gray-400 mt-2 text-sm font-medium">
            TrafficIntelAI Control Center
          </p>
        </div>

        <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <span className="text-green-500 text-lg">
            🟢
          </span>

          <span className="text-sm font-medium text-gray-700">
            Live Monitoring Enabled
          </span>
        </div>

      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">

        <StatCard
          title="Total Users"
          value={stats.total_users}
          icon={<Users size={18} />}
        />

        <StatCard
          title="Campaigns"
          value={stats.total_campaigns}
          icon={<Globe size={18} />}
        />

        <StatCard
          title="Total Clicks"
          value={stats.total_clicks}
          icon={<MousePointerClick size={18} />}
        />

        <StatCard
          title="Active Campaigns"
          value={stats.active_campaigns}
          icon={<Activity size={18} />}
        />

        <StatCard
          title="Today Clicks"
          value={stats.today_clicks}
          icon={<Activity size={18} />}
        />

        <StatCard
          title="Revenue"
          value={`$${Number(stats.revenue).toLocaleString()}`}
          icon={<DollarSign size={18} />}
        />

        <StatCard
          title="Errors"
          value={stats.errors}
          icon={<AlertTriangle size={18} />}
        />



      </div>


      <div className="mt-12 bg-[#111827] border border-[#1F2937] rounded-[32px] p-8">
        <h2 className="text-lg font-semibold mb-4">
          Clicks (Last 7 Days)
        </h2>

        {chartData ? (
          <div className="h-[320px]">
            <Line
              data={chartData}
              options={{
                ...chartOptions,
                maintainAspectRatio: false
              }}
            />
          </div>
        ) : (
          <p>Loading chart...</p>
        )}
      </div>



      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7 mt-8">

        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5">
          <h3 className="text-xl font-bold mb-5 text-white">
            Threat Monitor
          </h3>

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                Suspicious Users
              </span>

              <span className="text-red-400 font-bold">
                0
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                VPN Traffic
              </span>

              <span className="text-yellow-400 font-bold">
                0%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                Duplicate IPs
              </span>

              <span className="text-blue-400 font-bold">
                0
              </span>
            </div>

          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5">
          <h3 className="text-xl font-bold mb-5 text-white">
            Server Health
          </h3>

          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                API
              </span>

              <span className="text-green-400 font-bold">
                Online
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                Database
              </span>

              <span className="text-green-400 font-bold">
                Healthy
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">
                Queue Engine
              </span>

              <span className="text-green-400 font-bold">
                Running
              </span>
            </div>

          </div>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-3xl p-5">
          <h3 className="text-xl font-bold mb-5 text-white">
            Quick Actions
          </h3>

          <div className="flex flex-col gap-4">

            <button
              onClick={() => {
                loadStats();
                loadChart();
              }}
              className="bg-white text-black rounded-2xl py-3 font-medium hover:opacity-90 transition-all"
            >
              Refresh Dashboard
            </button>

            <button className="bg-[#DC2626] rounded-2xl py-3 font-medium hover:bg-red-700 transition-all text-white">
              Review Threats
            </button>

          </div>
        </div>

      </div>

    </div>


  );



}



function StatCard({ title, value, icon }) {

  return (

    <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] px-5 py-4 hover:border-[#334155] transition-all duration-300">

      <div className="flex items-center justify-between mb-5">

        <div className="text-[11px] uppercase tracking-[0.16em] text-gray-500 font-medium">
          {title}
        </div>

        <div className="text-gray-500 scale-90">
          {icon}
        </div>

      </div>

      <div className="text-[34px] leading-none font-semibold text-white tracking-tight">
        {value}
      </div>

    </div>

  );

}