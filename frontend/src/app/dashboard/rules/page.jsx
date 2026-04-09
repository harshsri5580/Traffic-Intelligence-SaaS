"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { countries } from "../../../data/countries";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import toast from "react-hot-toast";
const SUSPICIOUS_ISPS = [
  "Amazon AWS",
  "Amazon Technologies",
  "Google Cloud",
  "Microsoft Azure",
  "DigitalOcean",
  "OVH",
  "Hetzner",
  "Vultr",
  "Linode",
  "Scaleway",
  "Alibaba Cloud",
  "Tencent Cloud",
  "Leaseweb",
  "Contabo",
  "M247",
  "Choopa",
  "Psychz",
  "DataCamp",
  "Server Hosting",
  "Hostinger",
  "Namecheap",
  "Oracle Cloud",
  "IBM Cloud",
  "Cloudflare",
  "Fastly",
  "Akamai"
];

const SUSPICIOUS_ASNS = [
  14061, // DigitalOcean
  16509, // AWS
  14618, // AWS
  15169, // Google
  8075,  // Microsoft
  16276, // OVH
  24940, // Hetzner
  20473, // Vultr
  63949, // Linode
  12876, // Scaleway
  45102, // Alibaba
  132203,// Tencent
  20454, // Leaseweb
  51167, // Contabo
  9009,  // M247
  36351, // SoftLayer
  13335, // Cloudflare
  20940  // Akamai
];

export default function RulesPage() {

  const [rules, setRules] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const offerOptions = offers.map(o => ({
    value: o.id,
    label: o.url
  }));
  const [editingRuleId, setEditingRuleId] = useState(null);
  const countryOptions = countries.map(c => ({
    value: c.value,
    label: `${c.label} (${c.value})`
  }));

  const [formData, setFormData] = useState({
    campaign_id: "",
    name: "",
    priority: 1,
    country: [],
    device: [],
    browser: [],   // ⭐ add this
    os: [],
    asn: "",
    isp: "",
    referrer: "",
    bot_score: 40,
    timezone: "",
    language: "",
    action: "rotate",
    match_type: "AND",   // 🔥 ADD
    selected_offers: [],
    rule_offer_ids: []
  });

  const devices = ["mobile", "desktop", "tablet"];
  const osList = ["windows", "mac os x", "android", "ios", "linux"];
  const browsers = ["chrome", "safari", "firefox", "edge", "opera"];


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
      setCampaigns(res.data || []);

    } catch (err) {
      console.error(err);
    }

  };

  const fetchRules = async () => {

    if (!formData.campaign_id) {
      toast.error("Select campaign");
      return;
    }

    try {

      setLoading(true);

      const res = await api.get(`/rules/campaign/${formData.campaign_id}`);

      setRules(
        (res.data || []).sort((a, b) => a.priority - b.priority)
      );

    } catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }

  };

  const loadOffers = async (campaignId) => {

    try {

      const res = await api.get(`/offers/campaign/${campaignId}`);
      setOffers(res.data || []);

    } catch (err) {
      console.error(err);
    }

  };

  const resetForm = () => {

    setEditingRuleId(null);

    setFormData({
      campaign_id: "",
      name: "",
      country: [],
      device: [],
      browser: [],
      os: [],
      asn: "",
      isp: "",
      referrer: "",
      bot_score: 40,
      timezone: "",
      language: "",
      action: "rotate",
      match_type: "AND",   // 🔥 ADD
      priority: 1,
      selected_offers: [],
      rule_offer_ids: []
    });

  };



  const saveRule = async () => {

    const duplicate = rules.find(
      r => r.priority == formData.priority &&
        r.campaign_id == formData.campaign_id &&
        r.id !== editingRuleId
    );

    if (duplicate) {
      toast.error("Priority already used");
      return;
    }

    try {

      if (!formData.name || !formData.campaign_id) {
        toast.error("Fill required fields");
        return;
      }

      if (formData.selected_offers.length === 0) {
        toast.error("Select at least one offer");
        return;
      }

      let ruleId;

      if (editingRuleId) {

        await api.put(`/rules/${editingRuleId}`, {
          name: formData.name,
          action_type: formData.action,
          priority: Number(formData.priority),
          match_type: formData.match_type   // 🔥 ADD
        });

        await api.delete(`/rules/${editingRuleId}/conditions`);
        for (const roId of formData.rule_offer_ids) {
          await api.delete(`/rules/offers/${Number(roId)}`);
        }
        ruleId = editingRuleId;

      } else {

        const res = await api.post("/rules/", {
          campaign_id: Number(formData.campaign_id),
          name: formData.name,
          priority: Number(formData.priority),
          action_type: formData.action,
          match_type: formData.match_type   // 🔥 ADD
        });

        ruleId = res.data.rule_id;

      }

      const conditions = [];

      (formData.country || []).forEach(c => {
        conditions.push({ field: "country", value: c });
      });

      (formData.device || []).forEach(d => {
        conditions.push({ field: "device", value: d });
      });

      (formData.browser || []).forEach(b => {
        conditions.push({ field: "browser", value: b });
      });

      (formData.os || []).forEach(o => {
        conditions.push({ field: "os", value: o });
      });

      conditions.push({
        field: "asn",
        operator: "asn_match",
        value: formData.asn
      });

      if (formData.isp)
        conditions.push({
          field: "isp",
          operator: "isp_match",   // 🔥 IMPORTANT
          value: formData.isp
        });

      if (formData.referrer)
        conditions.push({ field: "referrer", value: formData.referrer });

      conditions.push({ field: "bot_score", value: formData.bot_score });

      for (const cond of conditions) {

        let operator = cond.operator || "equals";

        if (cond.field === "bot_score") {
          operator = "less_or_equal";
        }

        await api.post(`/rules/${ruleId}/conditions`, {
          field: cond.field,
          operator: operator,
          value: String(cond.value)
        });

      }

      for (const offerId of (formData.selected_offers || [])) {

        await api.post(`/rules/${ruleId}/offers`, {
          offer_id: Number(offerId),
          weight: 100
        });

      }
      setShowForm(false);
      resetForm();
      fetchRules();

    } catch (err) {
      console.error(err);
    }
    toast.success("Rule saved successfully 🚀");

  };

  const editRule = (rule) => {

    setEditingRuleId(rule.id);

    setFormData({
      campaign_id: rule.campaign_id,
      name: rule.name,
      priority: rule.priority,
      match_type: rule.match_type || "AND",
      country: rule.conditions
        ?.filter(c => c.field === "country")
        .map(c => c.value) || [],
      device: rule.conditions
        ?.filter(c => c.field === "device")
        .map(c => c.value) || [],
      browser: rule.conditions
        ?.filter(c => c.field === "browser")
        .map(c => c.value) || [],
      os: rule.conditions
        ?.filter(c => c.field === "os")
        .map(c => c.value) || [],
      asn: getCondition(rule.conditions, "asn"),
      isp: getCondition(rule.conditions, "isp"),
      referrer: getCondition(rule.conditions, "referrer"),
      bot_score: getCondition(rule.conditions, "bot_score") || 40,
      timezone: getCondition(rule.conditions, "timezone"),
      language: getCondition(rule.conditions, "language"),
      action: rule.action_type,
      selected_offers: (rule.offers || []).map(o => Number(o.offer_id)),
      rule_offer_ids: (rule.offers || []).map(o => Number(o.rule_offer_id)),
    });

    setShowForm(true);

  };

  const deleteRule = async (rule) => {

    if (rule.is_active) {
      alert("Deactivate rule before deleting");
      return;
    }

    if (!confirm("Delete rule?")) return;

    await api.delete(`/rules/${rule.id}`);

    fetchRules();

  };

  const toggleRule = async (rule) => {

    await api.post(`/rules/${rule.id}/toggle`, {
      is_active: !rule.is_active
    });

    fetchRules();

  };

  const getCondition = (conditions, field) => {

    if (!conditions) return "";

    const cond = conditions.find(c => c.field === field);

    return cond ? cond.value : "";

  };
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium">Loading rules...</p>
      </div>
    );
  }

  return (

    <div className="p-8">

      <div className="flex justify-between items-center mb-6">

        <h1 className="text-3xl font-bold">
          Rule Engine
        </h1>

        <div className="flex gap-3 items-center">

          <select
            className="border rounded px-3 py-2"
            value={formData.campaign_id}
            disabled={editingRuleId !== null}
            onChange={(e) => {
              setFormData({ ...formData, campaign_id: e.target.value });
              loadOffers(e.target.value);
            }}
          >

            <option value="">Select Campaign</option>

            {campaigns.map(c => (

              <option key={c.id} value={c.id}>
                {c.name}
              </option>

            ))}

          </select>

          <button
            onClick={fetchRules}
            className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
          >
            Load Rules
          </button>

          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Rule
          </button>

        </div>

      </div>



      {showForm && (

        <div className="bg-white shadow p-6 rounded mb-6">

          <h2 className="text-xl font-semibold mb-4">
            {editingRuleId ? "Edit Rule" : "Create Rule"}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

            <input
              className="border p-2 rounded"
              placeholder="Rule Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <select
              className="border p-2 rounded"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >

              <option value="1">Priority 1 (Highest)</option>
              <option value="2">Priority 2</option>
              <option value="3">Priority 3</option>
              <option value="4">Priority 4</option>
              <option value="5">Priority 5</option>

            </select>


            <CreatableSelect
              isMulti
              options={countryOptions}
              placeholder="Select Countries..."
              value={countryOptions.filter(o =>
                formData.country.includes(o.value)
              )}
              onChange={(selected) => {

                setFormData({
                  ...formData,
                  country: selected ? selected.map(s => s.value) : []
                });

              }}
            />

            <CreatableSelect
              isMulti
              options={devices.map(d => ({
                value: d,
                label: d.charAt(0).toUpperCase() + d.slice(1)
              }))}

              placeholder="Select Devices..."

              value={devices
                .filter(d => formData.device.includes(d))
                .map(d => ({
                  value: d,
                  label: d.charAt(0).toUpperCase() + d.slice(1)
                }))}

              onChange={(selected) => {

                setFormData({
                  ...formData,
                  device: selected ? selected.map(s => s.value) : []
                });

              }}
            />

            <CreatableSelect
              isMulti
              options={browsers.map(b => ({
                value: b,
                label: b.charAt(0).toUpperCase() + b.slice(1)
              }))}

              placeholder="Select Browsers..."

              value={browsers
                .filter(b => formData.browser.includes(b))
                .map(b => ({
                  value: b,
                  label: b.charAt(0).toUpperCase() + b.slice(1)
                }))}

              onChange={(selected) => {

                setFormData({
                  ...formData,
                  browser: selected ? selected.map(s => s.value) : []
                });

              }}
            />

            <CreatableSelect
              isMulti
              options={osList.map(o => ({
                value: o,
                label: o.toUpperCase()
              }))}

              placeholder="Select OS..."

              value={osList
                .filter(o => formData.os.includes(o))
                .map(o => ({
                  value: o,
                  label: o.toUpperCase()
                }))}

              onChange={(selected) => {

                setFormData({
                  ...formData,
                  os: selected ? selected.map(s => s.value) : []
                });

              }}
            />

            <CreatableSelect
              isMulti
              options={SUSPICIOUS_ASNS.map(a => ({
                value: a,
                label: `AS${a}`
              }))}
              placeholder="Select or type ASN..."
              value={(formData.asn || "")
                .split(",")
                .filter(Boolean)
                .map(v => ({ value: v, label: `AS${v}` }))
              }
              onChange={(selected) => {
                const values = selected ? selected.map(s => s.value) : [];
                setFormData({
                  ...formData,
                  asn: values.join(",")
                });
              }}
            />

            <CreatableSelect
              isMulti
              options={SUSPICIOUS_ISPS.map(i => ({ value: i, label: i }))}
              placeholder="Select or type ISP..."
              value={(formData.isp || "")
                .split(",")
                .filter(Boolean)
                .map(v => ({ value: v, label: v }))
              }
              onChange={(selected) => {
                const values = selected ? selected.map(s => s.value) : [];
                setFormData({
                  ...formData,
                  isp: values.join(",")   // ✅ store as string
                });
              }}
              isClearable
              isSearchable
              isCreatable   // 🔥 allow custom add
            />

            <input
              className="border p-2 rounded"
              placeholder="Referrer"
              value={formData.referrer}
              onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
            />

            <div className="col-span-2">

              <label className="text-sm font-medium mb-1 block">
                Bot Score Threshold
              </label>

              <div className="flex items-center gap-3">

                <span className="text-xs text-gray-500">0</span>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.bot_score}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bot_score: Number(e.target.value)
                    })
                  }
                  className="w-full accent-blue-600"
                />

                <span className="text-xs text-gray-500">100</span>

              </div>

              <div className="mt-2 text-sm text-blue-600 font-semibold">
                Current: {formData.bot_score}
              </div>

            </div>

            <input
              className="border p-2 rounded"
              placeholder="Timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            />

            <input
              className="border p-2 rounded"
              placeholder="Language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            />

            <select
              className="border p-2 rounded"
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
            >
              <option value="rotate">Rotate</option>
              <option value="block">Block</option>
            </select>

            <select
              className="border p-2 rounded"
              value={formData.match_type}
              onChange={(e) => setFormData({ ...formData, match_type: e.target.value })}
            >
              <option value="AND">Match ALL (AND)</option>
              <option value="OR">Match ANY (OR)</option>
            </select>


            <CreatableSelect
              isMulti
              options={offerOptions}
              placeholder="Attach Offers..."
              value={offerOptions.filter(o =>
                (formData.selected_offers || []).includes(o.value)
              )}
              onChange={(selected) => {

                setFormData({
                  ...formData,
                  selected_offers: selected
                    ? selected.map(s => s.value)
                    : []
                });

              }}
            />

          </div>

          <div className="flex gap-3 mt-4">

            <button
              onClick={saveRule}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {editingRuleId ? "Update Rule" : "Save Rule"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>

          </div>

        </div>

      )}

      {loading ? (
        <div>Loading rules...</div>
      ) : (

        <div className="bg-white shadow rounded overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">

              <tr className="text-center hover:bg-gray-50">
                {/* <th className="p-3 border">ID</th> */}
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Priority</th>
                <th className="p-3 border">Country</th>
                <th className="p-3 border">Device</th>
                <th className="p-3 border">Browser</th>
                <th className="p-3 border">OS</th>
                <th className="p-3 border">ASN</th>
                <th className="p-3 border">ISP</th>
                <th className="p-3 border">Bot</th>
                <th className="p-3 border">Status</th>
                <th className="p-3 border">ROUTING</th>
                <th className="p-3 border">Offers</th>
                <th className="p-3 border">Action</th>
                <th className="p-3 border">Logic</th>

              </tr>

            </thead>

            <tbody>

              {rules.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-4">
                    No rules
                  </td>
                </tr>
              ) : (rules.map(rule => (

                <tr key={rule.id} className="text-center hover:bg-gray-50 transition">

                  {/* <td className="p-3 border">{rule.id}</td> */}
                  <td className="p-3 border">{rule.name}</td>
                  <td className="p-3 border">{rule.priority}</td>
                  <td className="p-3 border">{rule.conditions
                    ?.filter(c => c.field === "country")
                    .map(c => c.value)
                    .join(", ")}</td>
                  <td className="p-3 border">{rule.conditions
                    ?.filter(c => c.field === "device")
                    .map(c => c.value)
                    .join(", ")}</td>
                  <td className="p-3 border">{rule.conditions
                    ?.filter(c => c.field === "browser")
                    .map(c => c.value)
                    .join(", ")}</td>
                  <td className="p-3 border">{rule.conditions
                    ?.filter(c => c.field === "os")
                    .map(c => c.value)
                    .join(", ")}</td>
                  <td className="p-3 border">{getCondition(rule.conditions, "asn")}</td>
                  <td className="p-3 border">{getCondition(rule.conditions, "isp")}</td>
                  <td className="p-3 border">{getCondition(rule.conditions, "bot_score")}</td>
                  <td className="p-3 border">

                    <button
                      onClick={() => toggleRule(rule)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${rule.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        }`}
                    >
                      {rule.is_active ? "Active" : "Paused"}
                    </button>

                  </td>

                  <td className="p-3 border">{rule.action_type}</td>
                  <td className="p-3 border">
                    {rule.offers?.length ?? 0}
                  </td>

                  <td className="p-3 border flex justify-center gap-3">

                    <button
                      onClick={() => editRule(rule)}
                      className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium"
                    >
                      Edit
                    </button>

                    {!rule.is_active && (
                      <button
                        onClick={() => deleteRule(rule)}
                        className="px-3 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium"
                      >
                        Delete
                      </button>
                    )}

                  </td>
                  <td className="p-3 border">
                    {rule.match_type || "AND"}
                  </td>

                </tr>

              )))}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

}