"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { toast } from "react-hot-toast";

export default function Campaigns() {

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const router = useRouter();

  const [sources, setSources] = useState([]);
  const [sub1, setSub1] = useState("zoneid")
  const [sub2, setSub2] = useState("cost")
  const macros = [
    { value: "clickid", label: "Click ID" },
    { value: "zoneid", label: "Zone ID" },
    { value: "campaignid", label: "Campaign ID" },
    // { value: "source", label: "Traffic Source" },
    // { value: "keyword", label: "Keyword" },
    { value: "cost", label: "Cost (Required for ROI)" }
  ]

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const res = await api.get("/sources/");
      setSources(res.data || []);
    } catch (err) {
      console.error("Source load error", err);
      setSources([]);
    }
  };

  const generateProxyLink = (c) => {
    const getDomain = (url) => {
      try {
        if (!url) return null;

        // 🔥 CLEAN URL
        url = url.trim();

        // 🔥 ADD https if missing
        if (!url.startsWith("http")) {
          url = "https://" + url;
        }

        return new URL(url).origin;
      } catch {
        return null;
      }
    };

    const BASE_URL = getDomain(c.tracking_domain) || process.env.NEXT_PUBLIC_BASE_URL;

    // 🔥 HARD FAIL (no localhost fallback)
    if (!BASE_URL) {
      console.error("❌ Invalid safe_page_url", c);
      return "⚠️ Invalid domain (set safe page URL)";
    }

    let url = `${BASE_URL}/r/${c.slug}`;

    const params = [];

    if (c.sub1) params.push(`sub1={${c.sub1}}`);
    if (c.sub2) params.push(`sub2={${c.sub2}}`);

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    return url;
  };

  const generateTrackingLink = (c) => {
    const BASE_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" && window.location.origin) ||
      "http://127.0.0.1:8000";

    if (!BASE_URL) {
      console.error("❌ BASE URL missing");
      return "⚠️ Base URL not set";
    }

    const url = `${BASE_URL}/r/${c.slug}?sub1={zoneid}&sub2={cost}`;
    return url;
  };


  const [form, setForm] = useState({
    name: "",
    fallback_url: "",
    safe_page_url: "",
    bot_url: "",
    traffic_source: "direct"
  });

  const [autoOptimize, setAutoOptimize] = useState(false)
  const [roiThreshold, setRoiThreshold] = useState(0)
  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadCampaigns();

  }, []);

  const loadCampaigns = async () => {

    try {

      const res = await api.get("/campaigns/");
      const sorted = (res.data || []).sort((a, b) => a.id - b.id);
      setCampaigns(sorted);

    } catch (err) {

      console.error("Campaign load error", err);
      setCampaigns([]);

    } finally {

      setLoading(false);

    }

  };

  const toggleCampaign = async (id) => {

    try {

      const res = await api.put(`/campaigns/${id}/toggle`);

      // 🔥 ADD THIS (SUCCESS CASE)
      if (res.data?.is_active) {
        toast.success("Campaign activated ✅");
      } else {
        toast("Campaign paused ⏸️");
      }

      loadCampaigns();

    } catch (err) {

      if (err.response?.status === 403) {
        toast("Limit reached 🚫 Upgrade your plan to activate", {
          icon: "⚠️",
        });
      } else {
        toast.error("Toggle failed");
      }

    }

  };

  const deleteCampaign = async () => {

    if (!selectedCampaign) return;

    const campaign = campaigns.find(c => c.id === selectedCampaign);

    if (!campaign) return;

    if (campaign.is_active) {
      toast("Pause campaign before deleting");
      return;
    }

    if (Number(campaign.offer_count) > 0 || Number(campaign.rule_count) > 0) {
      toast("Delete offers and rules first");
      return;
    }

    try {
      await api.delete(`/campaigns/${selectedCampaign}`);
      toast.success("Campaign deleted 🗑️");

      setShowDeleteModal(false);
      setSelectedCampaign(null);

      loadCampaigns();

    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }

  };


  const createCampaign = async () => {
    if (!form.name) {
      toast.error("Campaign name required");
      return;
    }

    if (!form.safe_page_url) {
      toast.error("Safe Page URL required (Domain required)");
      return;
    }

    // if (!form.traffic_source) {
    //   toast.error("Select traffic source");
    //   return;
    // }

    setCreating(true);

    try {
      const payload = {
        name: form.name,
        fallback_url: form.fallback_url || null,
        safe_page_url: form.safe_page_url || null,
        bot_url: form.bot_url || null,
        traffic_source: form.traffic_source, // ✅ FIXED
        tracking_domain: form.tracking_domain || null,
        sub1: sub1,
        sub2: sub2,
        auto_optimize: autoOptimize,
        roi_threshold: Number(roiThreshold),
      };

      console.log("PAYLOAD 👉", payload); // 🔥 DEBUG

      const res = await api.post("/campaigns/", payload);

      if (res.data?.limit_reached) {
        toast("Limit reached ⚠️ Campaign created as inactive", {
          icon: "⚠️",
        });
      } else {
        toast.success("Campaign Created 🚀");
      }

      setForm({
        name: "",
        fallback_url: "",
        safe_page_url: "",
        tracking_domain: "",
        bot_url: "",
        traffic_source: "direct"  // ✅ ADD THIS

      });
      setAutoOptimize(false)
      setRoiThreshold(0)
      setSub1(null);
      setSub2(null);

      loadCampaigns();

    } catch (err) {
      console.error(err);
      toast.error("Campaign creation failed");
    }

    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (

    <div className="p-8">

      <h1 className="text-3xl font-semibold tracking-tight text-gray-800 mb-6">
        Campaign Manager
      </h1>

      {/* CREATE CAMPAIGN */}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-10 hover:shadow-md transition">

        <h2 className="font-semibold mb-4">
          Create Campaign
        </h2>



        <div className="grid grid-cols-3 gap-3">

          <input
            className="px-3 py-2.5 rounded-lg border border-gray-300 
text-sm shadow-sm bg-white
focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Campaign Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            className="px-3 py-2.5 rounded-lg border border-gray-300 
text-sm shadow-sm bg-white
focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Fallback URL"
            value={form.fallback_url}
            onChange={(e) => setForm({ ...form, fallback_url: e.target.value })}
          />

          <input
            className="px-3 py-2.5 rounded-lg border border-gray-300 
text-sm shadow-sm bg-white
focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Safe Page URL"
            value={form.safe_page_url}
            onChange={(e) => setForm({ ...form, safe_page_url: e.target.value })}
          />
          <input
            className="px-3 py-2.5 rounded-lg border border-gray-300 
text-sm shadow-sm bg-white
focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Tracking Domain (https://yourdomain.com)"
            value={form.tracking_domain}
            onChange={(e) => setForm({ ...form, tracking_domain: e.target.value })}
          />
          <input
            className="px-3 py-2.5 rounded-lg border border-gray-300 
text-sm shadow-sm bg-white
focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Bot URL"
            value={form.bot_url}
            onChange={(e) => setForm({ ...form, bot_url: e.target.value })}
          />

          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm shadow-sm 
focus:ring-2 focus:ring-indigo-500 outline-none"
            value={form.traffic_source || "direct"}  // ✅ ensure
            onChange={(e) => setForm({ ...form, traffic_source: e.target.value })}
          >
            <option value="">Select Source</option>

            {sources.map(s => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>



        </div>

        {/* AUTO OPTIMIZATION */}

        <div className="mt-6 border-t pt-4">

          <div className="font-semibold mb-3">
            Auto Optimization
          </div>

          <div className="grid grid-cols-2 gap-4">

            {/* TOGGLE */}
            <div>
              <label className="text-sm">Enable Auto Optimize</label>
              <div className="mt-1">
                <button
                  onClick={() => setAutoOptimize(!autoOptimize)}
                  className={`relative w-12 h-6 flex items-center rounded-full p-1 transition
${autoOptimize ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transform transition
  ${autoOptimize ? "translate-x-6" : ""}`} />
                </button>
              </div>
            </div>

            {/* ROI INPUT */}
            <div className="w-full">
              <label className="text-sm font-medium text-gray-700">
                ROI Threshold (%)
              </label>

              <input
                type="range"
                min={-100}
                max={100}
                step={1}
                value={roiThreshold || 0}
                onChange={(e) => setRoiThreshold(Number(e.target.value))}
                className="w-full mt-2 accent-blue-500"
              />

              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>-100%</span>
                <span>0%</span>
                <span>100%</span>
              </div>

              <div className={`text-sm mt-1 ${roiThreshold < 0 ? "text-red-500" : "text-green-600"
                }`}>
                Current: {roiThreshold || 0}%
              </div>
            </div>

          </div>

        </div>

        {/* MACRO SELECTOR */}

        <div className="mt-6 border-t pt-4">

          <div className="font-semibold mb-3">
            Tracking Macros
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <div className="text-sm mb-1">Sub1</div>
              <Select
                options={macros}
                value={macros.find(m => m.value === sub1)}
                onChange={(v) => setSub1(v?.value || null)}
              />
            </div>

            <div>
              <div className="text-sm mb-1">Sub2</div>
              <Select
                options={macros}
                value={macros.find(m => m.value === sub2)}
                onChange={(v) => setSub2(v?.value || null)}
              />
            </div>

          </div>

        </div>


        <button
          onClick={createCampaign}
          disabled={creating}
          className="mt-5 px-6 py-2.5 rounded-lg text-white text-sm font-medium
bg-gradient-to-r from-indigo-500 to-blue-600
hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
        >
          {creating ? "Creating..." : "Create Campaign"}
        </button>

      </div>

      {/* CAMPAIGN TABLE */}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">

            <tr>

              <th className="p-3 border">Campaign</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Source</th>
              <th className="p-3 border">Pass</th>
              <th className="p-3 border">Block</th>
              <th className="p-3 border">Offers</th>
              <th className="p-3 border">Rules</th>
              <th className="p-3 border">Logs</th>
              <th className="p-3 border">Actions</th>

            </tr>

          </thead>

          <tbody className="divide-y">

            {campaigns.map(c => (

              <tr key={c.id} className="text-center">

                <td className="p-3 border">

                  <div className="font-semibold text-gray-800 truncate max-w-[180px]">
                    {c.name}
                  </div>

                  <div className="text-xs text-gray-400 truncate">
                    {c.slug}
                  </div>

                </td>

                <td className="p-3 border">

                  <button
                    onClick={() => toggleCampaign(c.id)}
                    className={`w-[90px] h-[30px] flex items-center justify-center
rounded-full text-xs font-medium transition
${c.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-700"}`}
                  >
                    {c.is_active ? "Active" : "Paused"}
                  </button>

                </td>


                <td className="p-3 border">

                  <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize
${c.traffic_source === "facebook" ? "bg-blue-50 text-blue-600" :
                      c.traffic_source === "google" ? "bg-green-50 text-green-600" :
                        c.traffic_source === "push" ? "bg-purple-50 text-purple-600" :
                          c.traffic_source === "adult" ? "bg-red-50 text-red-600" :
                            "bg-gray-100 text-gray-600"}`}>

                    {c.traffic_source || "Direct"}

                  </span>

                </td>

                <td className="p-3 border text-green-600 font-semibold">
                  {Number(c.pass_count) || 0}
                </td>

                <td className="p-3 border text-red-600 font-semibold">
                  {Number(c.block_count) || 0}
                </td>

                <td className="p-3 border">
                  {Number(c.offer_count) || 0}
                </td>
                <td className="p-3 border">
                  {c.rule_count || 0}
                </td>
                <td className="p-3 border">

                  <button
                    onClick={() => {
                      localStorage.setItem("campaign_id", c.id);
                      router.push("/dashboard/logs");
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                  >
                    Logs
                  </button>

                </td>

                <td className="p-3 border flex justify-center gap-2 flex-wrap">

                  <button
                    onClick={async () => {
                      const link = generateProxyLink(c)

                      try {
                        await navigator.clipboard.writeText(link)
                        toast.success("Copied!")
                      } catch {
                        toast.error("Copy failed")
                      }
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                  >
                    Proxy Link
                  </button>

                  <button
                    onClick={async () => {
                      const link = generateTrackingLink(c)

                      try {
                        await navigator.clipboard.writeText(link)
                        toast.success("Tracking Link Copied!")
                      } catch {
                        toast.error("Copy failed")
                      }
                    }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 transition"
                  >
                    Tracking Link
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/campaigns/manage?id=${c.id}`)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                  >
                    Manage
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard/campaigns/edit?id=${c.id}`)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard/campaigns/scripts?slug=${c.slug}`)}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 transition"
                  >
                    Scripts
                  </button>

                  {!c.is_active &&
                    Number(c.offer_count) === 0 &&
                    Number(c.rule_count) === 0 && (
                      <button
                        onClick={() => {
                          setSelectedCampaign(c.id);
                          setShowDeleteModal(true);
                        }}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                      >
                        Delete
                      </button>
                    )}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

            <div className="bg-white rounded-2xl p-6 w-[380px] shadow-2xl border border-gray-200">

              <h2 className="text-lg font-semibold mb-2">
                Delete Campaign
              </h2>

              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this campaign?
              </p>

              <div className="flex justify-end gap-3">

                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>

                <button
                  onClick={deleteCampaign}
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Delete
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </div>

  );

}