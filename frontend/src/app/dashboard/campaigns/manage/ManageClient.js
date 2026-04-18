"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../../services/api";
import { useRouter } from "next/navigation";

export default function ManageCampaign(){
const router = useRouter();
const params = useSearchParams();
const campaignId = params.get("id");

const [campaign,setCampaign] = useState(null);
const [offers,setOffers] = useState([]);
const [rules,setRules] = useState([]);
const [stats,setStats] = useState({offers:0,rules:0});
const [loading,setLoading] = useState(true);
const [protection,setProtection]=useState({
block_vpn:false,
block_proxy:false,
block_tor:false,
block_datacenter:false,
block_automation:false,
block_canvas:false
})

useEffect(()=>{

const token = localStorage.getItem("token");

if(!token){
window.location.href="/login";
return;
}

if(campaignId && campaignId !== "null"){
loadData();
}

},[campaignId]);

const loadData = async()=>{

try{

// campaign
if(!campaignId) return;

const campaignRes = await api.get(`/campaigns/${campaignId}`);
setCampaign(campaignRes.data);
setProtection({
block_vpn:campaignRes.data.block_vpn || false,
block_proxy:campaignRes.data.block_proxy || false,
block_tor:campaignRes.data.block_tor || false,
block_datacenter:campaignRes.data.block_datacenter || false,
block_automation:campaignRes.data.block_automation || false,
block_canvas:campaignRes.data.block_canvas || false
});

// offers
const offersRes = await api.get(`/offers/campaign/${campaignId}`);
const offersData = Array.isArray(offersRes.data) ? offersRes.data : [];
setOffers(
(offersData || []).sort((a,b)=> a.id - b.id)
);

// rules
try{

const rulesRes = await api.get(`/rules/campaign/${campaignId}`);
const rulesData = Array.isArray(rulesRes.data) ? rulesRes.data : [];

const enriched = await Promise.all(

rulesData.map(async(rule)=>{

const details = await api.get(`/rules/${rule.id}`);

return{
...rule,
conditions: details.data.conditions || []
};

})

);

setRules(
(rulesData || []).sort((a,b)=> a.id - b.id)
);

setStats({
offers: offersData.length,
rules: rulesData.length
});

}catch{

setRules([]);
setStats({
offers: offersData.length,
rules: 0
});

}

}catch(err){
console.error("Load error:",err);
}

setLoading(false);

};

const toggleOffer = async (id, current) => {

try{

await api.put(`/offers/${id}/toggle`,{
is_active: !current
});

loadData();

}catch(err){
console.error("Toggle offer error:",err);
}

};


const deleteOffer = async(id)=>{

if(!confirm("Delete offer?")) return;

try{

await api.delete(`/offers/${id}`);
loadData();

}catch(err){
console.error("Delete offer error:",err);
}

};

const toggleCampaign = async () => {

try{

await api.put(`/campaigns/${campaignId}/toggle`);

loadData();

}catch(err){
console.error("Toggle error:",err);
}

};

const toggleProtection = async(field)=>{

const updated={
...protection,
[field]:!protection[field]
};

setProtection(updated);

try{

await api.put(`/campaigns/${campaignId}/protection`,updated);

}catch(err){

console.error("Protection update error",err);

}

};

const toggleRule = async (id,current)=>{

try{

await api.post(`/rules/${id}/toggle`,{
is_active: !current
});

loadData();

}catch(err){
console.error("Rule toggle error:",err);
}

};

const deleteRule = async(id)=>{

if(!confirm("Delete rule?")) return;

try{

await api.delete(`/rules/${id}`);
loadData();

}catch(err){
console.error("Delete rule error:",err);
}

};

if(!campaignId){
return <div className="p-10">No campaign selected</div>
}

if(loading){
return <div className="p-10">Loading campaign...</div>
}

return(

<div className="p-8 space-y-8">

<h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
  Manage Campaign
</h1>

<div className="bg-gradient-to-r from-indigo-500 to-blue-600 
text-white rounded-2xl p-6 shadow-lg flex justify-between items-center">

  <div>
    <div className="text-2xl font-semibold">
      {campaign?.name}
    </div>

    <div className="text-white/80 text-sm mt-1">
      Slug: {campaign?.slug}
    </div>
  </div>

  <button
    onClick={toggleCampaign}
    className={`px-5 py-2 rounded-full text-sm font-medium shadow
    ${campaign?.is_active
      ? "bg-green-400 text-black"
      : "bg-gray-800 text-white"}
    transition`}
  >
    {campaign?.is_active ? "Active" : "Paused"}
  </button>

</div>

<div className="grid grid-cols-2 md:grid-cols-4 gap-5">

<StatCard title="Offers" value={stats.offers} />
<StatCard title="Rules" value={stats.rules} />
<StatCard title="Pass Traffic" value={campaign?.pass_count} />
<StatCard title="Blocked Traffic" value={campaign?.block_count} />



</div>

{/* OFFERS SECTION */}

<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-lg font-semibold text-gray-800">
      Offers
    </h2>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

    <table className="w-full text-sm">

      {/* HEAD */}
      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
        <tr>
          <th className="px-4 py-3 text-left">URL</th>
          <th className="px-4 py-3 text-center">Weight</th>
          <th className="px-4 py-3 text-center">Mode</th>
          <th className="px-4 py-3 text-center">Status</th>
          <th className="px-4 py-3 text-center">Actions</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="divide-y">

        {offers.length === 0 ? (
          <tr>
            <td colSpan="5" className="py-6 text-center text-gray-400">
              No offers yet
            </td>
          </tr>
        ) : (
          offers.map(o => (

            <tr key={o.id} className="hover:bg-gray-50 transition-all duration-200">

              {/* URL */}
              <td className="px-4 py-3 max-w-[220px]">
                <div className="truncate font-medium text-gray-700">
                  {o.url}
                </div>
              </td>

              {/* WEIGHT */}
              <td className="px-4 py-3 text-center">
                <span className="px-2 py-1 text-xs rounded-md bg-gray-100">
                  {o.weight}%
                </span>
              </td>

              {/* MODE */}
              <td className="px-4 py-3 text-center">
                <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-600 capitalize">
                  {o.redirect_mode || "-"}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleOffer(o.id, o.is_active)}
                  className={`w-[90px] h-[30px] flex items-center justify-center
                  rounded-full text-xs font-medium transition-all duration-200
                  ${o.is_active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  {o.is_active ? "Active" : "Paused"}
                </button>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3">

                <div className="flex justify-center gap-2">

                  <button
                    onClick={() => !o.is_active && deleteOffer(o.id)}
                    disabled={o.is_active}
                    title={o.is_active ? "Deactivate first" : "Delete offer"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${o.is_active
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                  >
                    Delete
                  </button>

                </div>

              </td>

            </tr>

          ))
        )}

      </tbody>

    </table>

  </div>

</div>

{/* RULES SECTION */}

<div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-lg font-semibold text-gray-800">
      Rules
    </h2>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

    <table className="w-full text-sm">

      {/* HEAD */}
      <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
        <tr>
          <th className="px-4 py-3 text-left">Name</th>
          <th className="px-4 py-3 text-center">Country</th>
          <th className="px-4 py-3 text-center">Action</th>
          <th className="px-4 py-3 text-center">Status</th>
          <th className="px-4 py-3 text-center">Actions</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="divide-y">

        {rules.length === 0 ? (
          <tr>
            <td colSpan="5" className="py-6 text-center text-gray-400">
              No rules yet
            </td>
          </tr>
        ) : (
          rules.map(r => (

            <tr key={r.id} className="hover:bg-gray-50 transition-all duration-200">

              {/* NAME */}
              <td className="px-4 py-3 text-left max-w-[180px]">
                <div className="truncate font-medium text-gray-700">
                  {r.name}
                </div>
              </td>

              {/* COUNTRY */}
              <td className="px-4 py-3 text-center">
                <span className="px-2 py-1 text-xs rounded-md bg-gray-100">
                  {r.conditions?.find(c => c.field === "country")?.value || "-"}
                </span>
              </td>

              {/* ACTION */}
              <td className="px-4 py-3 text-center">
                <span className={`text-xs px-2 py-1 rounded-md capitalize
                  ${r.action_type === "block"
                    ? "bg-red-50 text-red-600"
                    : "bg-blue-50 text-blue-600"}`}
                >
                  {r.action_type}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleRule(r.id, r.is_active)}
                  className={`w-[90px] h-[30px] flex items-center justify-center
                  rounded-full text-xs font-medium transition-all duration-200
                  ${r.is_active
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                  {r.is_active ? "Active" : "Paused"}
                </button>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3">

                <div className="flex justify-center gap-2">

                  <button
                    onClick={() => !r.is_active && deleteRule(r.id)}
                    disabled={r.is_active}
                    title={r.is_active ? "Deactivate first" : "Delete rule"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${r.is_active
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                  >
                    Delete
                  </button>

                </div>

              </td>

            </tr>

          ))
        )}

      </tbody>

    </table>


<div className="bg-white shadow rounded p-6 mt-8">

<h2 className="text-lg font-semibold mb-4">
Traffic Protection
</h2>

<div className="grid sm:grid-cols-2 gap-4">

  {[
    { key: "block_vpn", label: "VPN Detection" },
    { key: "block_proxy", label: "Proxy Detection" },
    { key: "block_tor", label: "Tor Network Block" },
    { key: "block_datacenter", label: "Datacenter ASN Block" },
    { key: "block_automation", label: "Headless Browser Detection" },
    { key: "block_canvas", label: "Canvas Fingerprint Detection" },
  ].map((item) => (

    <div
      key={item.key}
      className="flex items-center justify-between 
      bg-white border border-gray-200 rounded-xl px-4 py-3
      hover:shadow-sm transition"
    >

      {/* LABEL */}
      <span className="text-sm font-medium text-gray-700">
        {item.label}
      </span>

      {/* SWITCH */}
      <button
        onClick={() => toggleProtection(item.key)}
        className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300
        ${protection[item.key] ? "bg-green-500" : "bg-gray-300"}`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300
          ${protection[item.key] ? "translate-x-6" : "translate-x-0"}`}
        />
      </button>

    </div>

  ))}

</div>

</div>

</div>

</div>

</div>

);

}

function StatCard({title,value}){

return(
<div className="bg-white/70 backdrop-blur-xl 
border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">

  <div className="text-gray-500 text-xs uppercase tracking-wide">
    {title}
  </div>

  <div className="text-2xl font-semibold mt-2">
    {value || 0}
  </div>

</div>

);

}