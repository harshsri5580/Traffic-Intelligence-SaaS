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

  const saveOffer = async () => {

    if (!formData.campaign_id || !formData.url || !formData.name) {
      toast.error("Fill all required fields");
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
      <div className="flex justify-center items-center h-screen">
        Loading offers...
      </div>
    );

  }

  return (

    <div className="p-8">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Offer Manager
        </h1>

        <div className="flex gap-3 items-center">

          <select
            className="border rounded px-3 py-2"
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

          <button
            onClick={loadOffers}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
          >
            Load Offers
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
              className="border p-2 rounded"
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
              className="border p-2 rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="Offer URL"
              className="border p-2 rounded"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
            />

            <input
              type="number"
              className="border p-2 rounded"
              value={formData.weight}
              onChange={(e) =>
                setFormData({ ...formData, weight: e.target.value })
              }
            />

            <select
              className="border p-2 rounded"
              value={formData.redirect_mode}
              onChange={(e) =>
                setFormData({ ...formData, redirect_mode: e.target.value })
              }
            >

              <option value="direct">Direct</option>
              <option value="token">Token</option>
              {/* <option value="proxy">Proxy</option>
              <option value="full_proxy">Full Proxy</option> */}

            </select>

          </div>

          <div className="mt-4 flex gap-3">

            <button
              onClick={saveOffer}
              disabled={creating}
              className="bg-green-600 text-white px-4 py-2 rounded"
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

          <thead className="bg-gray-100">

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

              <tr key={offer.id} className="text-center hover:bg-gray-50 transition">

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
                    className={`px-3 py-1 text-sm rounded-full ${offer.is_active
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
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
                      className="px-3 py-1 text-sm rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
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

      </div>

    </div>

  );

}