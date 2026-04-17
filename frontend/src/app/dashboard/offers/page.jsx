"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";

export default function OffersPage() {

  const [offers, setOffers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [step, setStep] = useState(1);
  const workerCode = `export default {
  async fetch(request) {

    const url = new URL(request.url)
    const backend = "https://api.trafficintelai.com"

    // =========================
    // 🔥 ONLY /r ROUTE → BACKEND
    // =========================
    if (!url.pathname.startsWith("/r")) {
      return fetch(request) // 🔥 bypass → real website load
    }

    const cache = caches.default

    const isStatic = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|mp4|mp3)$/i.test(url.pathname)

    // 🔥 CACHE ONLY STATIC
    if (isStatic && request.method === "GET") {
      const cached = await cache.match(request)
      if (cached) return cached
    }

    // =========================
    // 🔥 HEADERS
    // =========================
    const headers = new Headers(request.headers)

    headers.set("x-forwarded-for", request.headers.get("cf-connecting-ip") || "")
    headers.set("x-forwarded-proto", "https")
    headers.set("x-forwarded-host", url.host)
    headers.set("range", request.headers.get("range") || "")

    // =========================
    // 🔥 BODY SAFE
    // =========================
    let body = null
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer()
    }

   // =========================
  // 🔥 FETCH BACKEND
  // =========================
  let backendResponse = await fetch(backend + url.pathname + url.search, {
    method: request.method,
    headers,
    body,
    redirect: "manual" // 🔥 IMPORTANT
  })

  // =========================
  // 🔥 HANDLE REDIRECT
  // =========================
  if (backendResponse.status === 301 || backendResponse.status === 302) {
    const location = backendResponse.headers.get("location")
    if (location) {
      return Response.redirect(location, backendResponse.status)
    }
  }

  // =========================
  // 🔥 NORMAL RESPONSE
  // =========================
  let response = new Response(backendResponse.body, backendResponse)

    response = new Response(response.body, response)

    // =========================
    // 🔥 CACHE LOGIC
    // =========================
    if (isStatic && request.method === "GET") {
      response.headers.set("Cache-Control", "public, max-age=86400")
      await cache.put(request, response.clone())
    } else {
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate")
    }

    // =========================
    // 🔥 CORS
    // =========================
    response.headers.set("Access-Control-Allow-Origin", "*")

    return response
  }
}`
  const [formData, setFormData] = useState({
    campaign_id: "",
    name: "",
    url: "",
    weight: 50,
    redirect_mode: "direct"
  });

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchData();

  }, []);


  useEffect(() => {
    if (selectedCampaign) {
      loadOffers();
    }
  }, [selectedCampaign]);

  const fetchData = async () => {

    try {

      const campaignsRes = await api.get("/campaigns/");

      setCampaigns(campaignsRes.data || []);

    } catch (err) {

      console.error("Fetch campaigns error", err);

    } finally {

      setLoading(false);

    }

  };

  const loadOffers = async () => {

    if (!selectedCampaign) {
      toast.error("Please select a campaign");
      return;
    }

    try {

      const res = await api.get(`/offers/campaign/${selectedCampaign}`);

      const sorted = (res.data || []).sort((a, b) => a.id - b.id);
      setOffers(sorted);

    } catch (err) {

      console.error("Load offers error", err);

    }

  };
  const getTotalWeight = () => {
    return offers.reduce((sum, o) => {
      // agar edit kar rahe ho to current offer exclude karo
      if (editingOfferId && o.id === editingOfferId) return sum;
      return sum + Number(o.weight || 0);
    }, 0);
  };

  const saveOffer = async () => {

    if (!formData.campaign_id || !formData.url || !formData.name) {
      toast.error("Fill all required fields");
      return;
    }

    const currentTotal = getTotalWeight();
    const newWeight = Number(formData.weight);

    if (newWeight <= 0) {
      toast.error("Weight must be greater than 0");
      return;
    }

    if (currentTotal + newWeight > 100) {
      toast.error(`Total weight cannot exceed 100%. Current: ${currentTotal}%`);
      return;
    }
    setCreating(true);

    try {

      if (editingOfferId) {

        await api.put(`/offers/${editingOfferId}`, {
          campaign_id: Number(formData.campaign_id),
          name: formData.name,
          url: formData.url,
          weight: Number(formData.weight),
          redirect_mode: formData.redirect_mode
        });

      } else {

        await api.post("/offers/", {
          campaign_id: Number(formData.campaign_id),
          name: formData.name,
          url: formData.url,
          weight: Number(formData.weight),
          redirect_mode: formData.redirect_mode
        });

      }

      setFormData({
        campaign_id: "",
        name: "",
        url: "",
        weight: 50,
        redirect_mode: "direct"
      });

      setEditingOfferId(null);
      setShowForm(false);

      loadOffers();

    } catch (err) {

      console.error(err);
      toast.error("Failed to save offer");

    } finally {

      setCreating(false);

    }
    toast.success("Offer saved successfully 🚀");

  };

  const editOffer = (offer) => {

    setEditingOfferId(offer.id);

    setFormData({
      campaign_id: String(offer.campaign_id),
      name: offer.name,
      url: offer.url,
      weight: offer.weight,
      redirect_mode: offer.redirect_mode
    });

    setShowForm(true);

  };

  const deleteOffer = async (id) => {

    const confirmDelete = window.confirm("Delete offer?");
    if (!confirmDelete) return;

    try {

      await api.delete(`/offers/${id}`);

      // remove deleted offer from UI instantly
      setOffers(prev => prev.filter(o => o.id !== id));

    } catch (err) {

      console.error(err);

    }

  };

  const toggleOffer = async (id) => {

    await api.put(`/offers/${id}/toggle`);

    setOffers(prev =>
      prev.map(o =>
        o.id === id ? { ...o, is_active: !o.is_active } : o
      )
    );

  };

  const getCampaignName = (id) => {

    const campaign = campaigns.find(c => c.id === id);

    return campaign ? campaign.name : id;

  };

  if (loading) {

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading offers...</p>
      </div>
    );
  }


  return (

    <div className="p-8 min-h-screen 
bg-gradient-to-br from-gray-50 via-white to-gray-100 space-y-8">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          Offer Manager
        </h1>

        <div className="flex flex-wrap gap-3 items-center 
bg-white/80 backdrop-blur-xl 
border border-gray-200/50 
rounded-2xl p-4 shadow-sm">

          <select
            className="px-3 py-2 rounded-lg border border-gray-300 
bg-white text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
          >
            <option value="">Select Campaign</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* <button
            onClick={loadOffers}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
          >
            Load Offers
          </button> */}

          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium
bg-gradient-to-r from-blue-500 to-indigo-600
hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
          >
            Create Offer
          </button>

        </div>

      </div>

      {showForm && (

        <div className="bg-white shadow p-6 rounded mb-8">

          <h2 className="font-semibold mb-4">
            {editingOfferId ? "Edit Offer" : "Create Offer"}
          </h2>

          <div className="grid md:grid-cols-5 gap-3">

            <select
              className="px-3 py-2 rounded-lg border border-gray-300 
text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.campaign_id}
              onChange={(e) =>
                setFormData({ ...formData, campaign_id: e.target.value })
              }
            >

              <option value="">Select Campaign</option>

              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}

            </select>

            <input
              placeholder="Offer Name *"
              className="px-3 py-2 rounded-lg border border-gray-300 
text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="Offer URL"
              className="px-3 py-2 rounded-lg border border-gray-300 
text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />

            <input
              type="number"
              min="1"
              max="100"
              className="px-3 py-2 rounded-lg border border-gray-300 
text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.weight}
              onChange={(e) => {
                let value = Number(e.target.value);

                if (value > 100) value = 100;
                if (value < 0) value = 0;

                setFormData({ ...formData, weight: value });
              }}
            />

            <select
              className="px-3 py-2 rounded-lg border border-gray-300 
text-sm shadow-sm 
focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.redirect_mode}
              onChange={(e) =>
                setFormData({ ...formData, redirect_mode: e.target.value })
              }
            >

              <option value="direct">Direct</option>
              <option value="token">Token</option>
              <option value="proxy">Proxy</option>
              {/* <option value="full_proxy">Full Proxy</option> */}

            </select>
            {formData.redirect_mode === "proxy" && (
              <button
                onClick={() => setShowProxyModal(true)}
                className="bg-purple-600 text-white px-3 py-2 rounded"
              >
                Setup Proxy 🚀
              </button>
            )}

          </div>

          <div className="text-sm text-gray-600">
            Total Weight: {getTotalWeight() + Number(formData.weight || 0)} / 100
          </div>

          <div className="mt-4 flex gap-3">

            <button
              onClick={saveOffer}
              disabled={creating}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium
bg-gradient-to-r from-green-500 to-emerald-600
hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
            >
              {creating ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="text-red-600"
            >
              Cancel
            </button>

          </div>

        </div>

      )}

      <div className="bg-white shadow rounded overflow-hidden">

        <table className="w-full">

          <thead className="bg-gray-100/70 backdrop-blur">

            <tr>

              {/* <th className="p-3 border">ID</th> */}
              <th className="p-3 border">Offer</th>
              <th className="p-3 border">Campaign</th>
              <th className="p-3 border">Weight</th>
              <th className="p-3 border">Mode</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Actions</th>

            </tr>

          </thead>

          <tbody>

            {offers.map(offer => (

              <tr key={offer.id} className="text-center hover:bg-gray-100/70 transition-all duration-200 transition">

                {/* <td className="p-3 border">
                  {offer.id}
                </td> */}

                <td className="p-3 border font-medium">
                  {offer.name}
                </td>

                <td className="p-3 border">
                  {getCampaignName(offer.campaign_id)}
                </td>

                <td className="p-3 border">
                  {offer.weight}
                </td>

                <td className="p-3 border">
                  {offer.redirect_mode}
                </td>

                <td className="p-3 border">

                  <button
                    onClick={() => toggleOffer(offer.id)}
                    className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm tracking-wide ${offer.is_active
                      ? "bg-green-100 text-green-600 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                  >
                    {offer.is_active ? "Active" : "Paused"}
                  </button>

                </td>

                <td className="p-3 border">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() => editOffer(offer)}
                      className="px-3 py-1 text-xs rounded-lg 
bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                    >
                      Edit
                    </button>

                    {!offer.is_active && (
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        className="px-3 py-1 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
        {showProxyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

            <div className="bg-white/90 backdrop-blur-xl 
w-[820px] max-h-[90vh] overflow-y-auto 
rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.25)] p-6">

              {/* HEADER */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  🚀 Proxy Setup Guide
                </h2>
                <button
                  onClick={() => setShowProxyModal(false)}
                  className="text-gray-500 hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>

              {/* STEP INDICATOR */}
              <div className="flex justify-between mb-6 text-sm font-medium">
                <div className={`${step === 1 ? "text-blue-600" : "text-gray-400"}`}>1. Domain</div>
                <div className={`${step === 2 ? "text-blue-600" : "text-gray-400"}`}>2. Worker</div>
                <div className={`${step === 3 ? "text-blue-600" : "text-gray-400"}`}>3. Routes</div>
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">🌐 Domain Setup (Cloudflare)</h3>

                  <ul className="list-disc pl-5 text-gray-700 space-y-2">
                    <li>Login to Cloudflare</li>
                    <li>Add your domain</li>
                    <li>Go to DNS settings</li>
                    <li>Turn ON proxy (🟠 Orange Cloud)</li>
                  </ul>

                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg mt-4 text-sm">
                    ⚠️ Proxy must be ON, otherwise cloaking will NOT work.
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">

                  <h3 className="text-lg font-semibold">⚙️ Create Worker + Paste Code</h3>

                  <ul className="list-disc pl-5 text-gray-700 space-y-1 text-sm">
                    <li>Go to Cloudflare → Workers</li>
                    <li>Create new Worker</li>
                    <li>Delete default code</li>
                    <li>Paste below code</li>
                  </ul>

                  {/* COPY BUTTON */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(workerCode)
                        toast.success("Copied 🚀")
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Copy Code
                    </button>
                  </div>

                  {/* CODE BOX */}
                  <textarea
                    readOnly
                    className="w-full h-64 border rounded p-3 font-mono text-xs bg-gray-100"
                    value={workerCode}
                  />

                  <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                    ⚠️ Note: Some websites may break (CSS/JS/images not load properly).
                    This is normal in proxy mode. Use high-quality landing pages.
                  </div>

                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-4">

                  <h3 className="text-lg font-semibold">🔗 Add Routes</h3>

                  <p className="text-sm text-gray-600">
                    Go to Worker → Settings → Routes → Add:
                  </p>

                  {/* COPY ROUTE 1 */}
                  <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                    <code>yourdomain.com/*</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("yourdomain.com/*")
                        toast.success("Copied")
                      }}
                      className="text-blue-600 text-sm"
                    >
                      Copy
                    </button>
                  </div>

                  {/* COPY ROUTE 2 */}
                  <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                    <code>*.yourdomain.com/*</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText("*.yourdomain.com/*")
                        toast.success("Copied")
                      }}
                      className="text-blue-600 text-sm"
                    >
                      Copy
                    </button>
                  </div>

                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm">
                    ⚠️ If routes are configured incorrectly, the proxy will not work properly.
                  </div>
                </div>
              )}

              {/* NAVIGATION */}
              <div className="flex justify-between mt-6">

                {/* <button
                  onClick={() => setShowProxyModal(false)}
                  className="text-gray-500"
                >
                  Close
                </button> */}

                <div className="flex gap-2">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Back
                    </button>
                  )}

                  {step < 3 && (
                    <button
                      onClick={() => setStep(step + 1)}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Next →
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>

  );

}