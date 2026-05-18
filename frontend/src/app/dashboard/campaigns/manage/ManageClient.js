"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../../services/api";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function ManageCampaign(){
const router = useRouter();
const params = useSearchParams();
const campaignId = params.get("id");

const [campaign,setCampaign] = useState(null);
const [offers,setOffers] = useState([]);
const [rules,setRules] = useState([]);
const [stats,setStats] = useState({offers:0,rules:0});
const [loading,setLoading] = useState(true);
const [deleteModal,setDeleteModal] = useState({
open:false,
type:null,
id:null
});
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

setDeleteModal({
open:true,
type:"offer",
id
});

return;



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

setDeleteModal({
open:true,
type:"rule",
id
});

return;



};

if(!campaignId){
return <div className="p-10">No campaign selected</div>
}
const confirmDelete = async()=>{

try{

if(deleteModal.type === "offer"){

await api.delete(`/offers/${deleteModal.id}`);

toast.success("Offer deleted");

}

if(deleteModal.type === "rule"){

await api.delete(`/rules/${deleteModal.id}`);

toast.success("Rule deleted");

}

setDeleteModal({
open:false,
type:null,
id:null
});

loadData();

}catch(err){

console.error("Delete error:",err);

toast.error("Delete failed");

}

};
if(loading){
return <div className="p-10">Loading campaign...</div>
}

return(
<>

<div className="p-8 space-y-8 bg-[#f6f8fc] min-h-screen">

<h1 className="text-2xl font-semibold text-gray-800 tracking-tight">
  Manage Campaign
</h1>

<div className="
relative overflow-hidden
rounded-[34px]
border border-white/10
bg-gradient-to-br
from-[#0b1020]
via-[#111827]
to-[#312e81]
p-7
shadow-[0_20px_60px_rgba(15,23,42,0.45)]
">

  {/* BACKGROUND GLOW */}
  <div className="
  absolute
  -top-24
  -right-24
  w-72
  h-72
  bg-indigo-500/20
  blur-3xl
  rounded-full
  " />

  <div className="
  relative z-10
  flex flex-col lg:flex-row
  lg:items-center
  lg:justify-between
  gap-6
  ">

    {/* LEFT */}
    <div>

      <div className="
      inline-flex
      items-center
      gap-2
      px-4
      py-1.5
      rounded-full
      bg-white/10
      border border-white/10
      text-xs
      tracking-[0.18em]
      uppercase
      text-gray-300
      mb-5
      backdrop-blur-xl
      ">
        Campaign Overview
      </div>

      <h1 className="
      text-2xl
      md:text-4xl
      font-semibold
      tracking-tight
      text-white
      leading-tight
      ">
        {campaign?.name}
      </h1>

      <div className="
      flex flex-wrap
      items-center
      gap-3
      mt-4
      ">

        <div className="
        px-4
        py-2
        rounded-xl
        bg-white/5
        border border-white/10
        text-sm
        text-gray-300
        backdrop-blur-xl
        ">
          Slug:
          <span className="text-white ml-2 font-medium">
            {campaign?.slug}
          </span>
        </div>

        <div className="
        px-4
        py-2
        rounded-xl
        bg-white/5
        border border-white/10
        text-sm
        text-gray-300
        backdrop-blur-xl
        ">
          Campaign ID:
          <span className="text-white ml-2 font-medium">
            #{campaign?.id}
          </span>
        </div>

      </div>

    </div>

    {/* RIGHT */}
    <div className="flex items-center gap-4">

      <button
        onClick={toggleCampaign}
        className={`
        relative
        inline-flex
        items-center
        justify-center
        min-w-[140px]
        h-[52px]
        rounded-2xl
        px-6
        font-semibold
        text-sm
        transition-all
        duration-300
        shadow-lg
        border

        ${campaign?.is_active
          ? `
          bg-gradient-to-r
          from-emerald-400
          to-green-500
          text-black
          border-green-300
          hover:scale-[1.03]
          `
          : `
          bg-white/10
          text-white
          border-white/10
          hover:bg-white/20
          `
        }
      `}
      >
       

        {campaign?.is_active ? "Active" : "Paused"}
      </button>

    </div>

  </div>
</div>


{/* STATS */}
<div className="grid grid-cols-2 xl:grid-cols-4 gap-5">

  <StatCard
    title="Offers"
    value={stats.offers}
    icon="🎯"
    color="from-indigo-500 to-violet-500"
  />

  <StatCard
    title="Rules"
    value={stats.rules}
    icon="🛡️"
    color="from-cyan-500 to-blue-500"
  />

  <StatCard
    title="Passed Traffic"
    value={campaign?.pass_count}
    icon="✅"
    color="from-emerald-500 to-green-500"
  />

  <StatCard
    title="Blocked Traffic"
    value={campaign?.block_count}
    icon="🚫"
    color="from-rose-500 to-red-500"
  />

</div>

{/* OFFERS SECTION */}

<div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-300">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-5">
    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
      Offers
    </h2>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

    <table className="w-full text-sm table-auto">

      {/* HEAD */}
      <thead className="bg-[#f8fafc] text-gray-400 text-[11px] uppercase tracking-[0.14em]">
        <tr>
          <th className="px-4 py-3 text-left">URL</th>
          <th className="px-4 py-3 text-center">Weight</th>
          <th className="px-4 py-3 text-center">Mode</th>
          <th className="px-4 py-3 text-center">Status</th>
          <th className="px-4 py-3 text-center">Actions</th>
        </tr>
      </thead>

      {/* BODY */}
      <tbody className="space-y-3">

        {offers.length === 0 ? (
          <tr>
            <td colSpan="5" className="py-6 text-center text-gray-400">
              No offers yet
            </td>
          </tr>
        ) : (
          offers.map(o => (

            <tr
  key={o.id}
  className="
  border-b border-gray-100
  hover:bg-indigo-50/50
  transition-all duration-200
  align-middle
"
>

              {/* URL */}
             <td className="px-4 py-4 min-w-[320px]">

  <a
    href={o.url}
    target="_blank"
    rel="noopener noreferrer"
    className="
    font-semibold
    text-[14px]
    leading-relaxed
    text-indigo-600
    hover:text-indigo-700
    hover:underline
    break-all
    transition
    "
  >
    {o.url}
  </a>

</td>

              {/* WEIGHT */}
              <td className="px-4 py-3 text-center">
                <span className="px-2 py-1 text-xs rounded-md bg-gray-100">
                  {o.weight}%
                </span>
              </td>

              {/* MODE */}
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center h-[32px] px-3 text-xs rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-100 capitalize">
                  {o.redirect_mode || "-"}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleOffer(o.id, o.is_active)}
                  className={`mx-auto w-[92px] h-[34px] inline-flex items-center justify-center
                  rounded-full text-xs font-medium transition-all duration-200
                  ${o.is_active
                    ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-300"}`}
                >
                  {o.is_active ? "Active" : "Paused"}
                </button>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3">

                <div className="flex items-center justify-center gap-2 h-full">

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

<div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-300">

  {/* HEADER */}
  <div className="flex justify-between items-center mb-5">
   <h2 className="text-xl font-bold text-gray-900 tracking-tight">
      Rules
    </h2>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">

   <table className="w-full text-sm table-auto">

      {/* HEAD */}
      <thead className="bg-[#f8fafc] text-gray-400 text-[11px] uppercase tracking-[0.14em]">
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

            <tr
  key={r.id}
  className="
  border-b border-gray-100
  hover:bg-indigo-50/50
  transition-all duration-200
  align-middle
"
>

              {/* NAME */}
              <td className="px-4 py-4 min-w-[240px]">
                <div className="font-medium text-gray-800 break-all">
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
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"}`}
                >
                  {r.action_type}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => toggleRule(r.id, r.is_active)}
                  className={`mx-auto w-[92px] h-[34px] inline-flex items-center justify-center
                  rounded-full text-xs font-medium transition-all duration-200
                  ${r.is_active
                    ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-300"}`}
                >
                  {r.is_active ? "Active" : "Paused"}
                </button>
              </td>

              {/* ACTIONS */}
              <td className="px-4 py-3">

                <div className="flex items-center justify-center gap-2 h-full">

                  <button
                    onClick={() => !r.is_active && deleteRule(r.id)}
                    disabled={r.is_active}
                    title={r.is_active ? "Deactivate first" : "Delete rule"}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                    ${r.is_active
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-red-50 text-red-500 hover:bg-red-100 border border-red-100"}`}
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


<div className="bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#1B2335] rounded-[32px] p-7 mt-10 border border-[#273041] shadow-2xl shadow-black/20">

  {/* HEADER */}
  <div className="flex items-start justify-between gap-4 mb-7">

    <div>

      <h2 className="text-[26px] font-bold tracking-tight text-white">
        Traffic Protection
      </h2>

      <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-2xl">
        Control how suspicious traffic is filtered. 
        Disabled protections are ignored in scoring, while all other active protections still protect your campaigns.
      </p>

    </div>

    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">

      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />

      <span className="text-sm font-medium text-emerald-300">
        Protection Active
      </span>

    </div>

  </div>

  {/* CARDS */}
  <div className="grid xl:grid-cols-2 gap-5">

    {[
      {
        key: "block_vpn",
        label: "VPN Detection",
        desc: "Detects traffic coming from VPN services like NordVPN, ProtonVPN, Surfshark and similar providers."
      },
      {
        key: "block_proxy",
        label: "Proxy Detection",
        desc: "Blocks residential, rotating and anonymous proxy traffic commonly used for cloaking and bot activity."
      },
      {
        key: "block_tor",
        label: "TOR Network Block",
        desc: "Filters visitors coming from the TOR anonymity network and hidden relay nodes."
      },
      {
        key: "block_datacenter",
        label: "Datacenter ASN Block",
        desc: "Detects VPS and server traffic from AWS, OVH, Vultr, Hetzner, M247 and other hosting providers."
      },
      {
        key: "block_automation",
        label: "Headless Browser Detection",
        desc: "Detects Selenium, Puppeteer, Playwright, webdriver automation and hidden headless browsers."
      },
      {
        key: "block_canvas",
        label: "Canvas Fingerprint Detection",
        desc: "Analyzes browser fingerprint mismatches, anti-detect browsers and spoofed device environments."
      },
    ].map((item) => (

      <div
        key={item.key}
        className="group relative overflow-hidden rounded-2xl border border-[#313B4F] bg-[#131A2B]/90 backdrop-blur-xl p-5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
      >

        {/* TOP */}
        <div className="flex items-start justify-between gap-4">

          <div className="flex-1">

            <h3 className="text-[15px] font-semibold text-white tracking-wide">
              {item.label}
            </h3>

            <p className="text-sm text-gray-400 leading-relaxed mt-2">
              {item.desc}
            </p>

          </div>

          {/* SWITCH */}
          <button
            onClick={() => toggleProtection(item.key)}
            className={`relative w-[54px] h-[30px] rounded-full p-1 transition-all duration-300 shrink-0 ${
              protection[item.key]
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30"
                : "bg-[#374151]"
            }`}
          >

            <div
              className={`w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md ${
                protection[item.key]
                  ? "translate-x-6"
                  : "translate-x-0"
              }`}
            />

          </button>

        </div>

        {/* STATUS */}
        <div className="mt-5 flex items-center justify-between">

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
            protection[item.key]
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
          }`}>

            <div className={`w-2 h-2 rounded-full ${
              protection[item.key]
                ? "bg-emerald-400"
                : "bg-gray-500"
            }`} />

            {protection[item.key]
              ? "Protection Enabled"
              : "Ignored In Scoring"}

          </div>

          <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
            Security Layer
          </span>

        </div>

      </div>

    ))}

  </div>

</div>


</div>

{deleteModal.open && (

<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

  <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">

    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mx-auto mb-5">
      <span className="text-3xl">🗑️</span>
    </div>

    <h2 className="text-2xl font-bold text-center text-gray-900">
      Delete {deleteModal.type}
    </h2>

    <p className="text-gray-500 text-center mt-3 leading-relaxed">
      This action cannot be undone.
      The selected {deleteModal.type} will be permanently removed.
    </p>

    <div className="flex gap-3 mt-7">

      <button
        onClick={() =>
          setDeleteModal({
            open:false,
            type:null,
            id:null
          })
        }
        className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
      >
        Cancel
      </button>

      <button
        onClick={confirmDelete}
        className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm transition"
      >
        Delete
      </button>

    </div>

  </div>

</div>

)}
<Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: "#111827",
      color: "#fff",
      border: "1px solid #374151",
      borderRadius: "14px",
    },
  }}
/>
</>
);

}


function StatCard({title,value}){

return(
<div className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">

  <div className="text-gray-400 text-[11px] uppercase tracking-[0.15em] font-medium">
    {title}
  </div>

  <div className="text-3xl font-bold mt-3 text-gray-900">
    {value || 0}
  </div>

</div>

);

}