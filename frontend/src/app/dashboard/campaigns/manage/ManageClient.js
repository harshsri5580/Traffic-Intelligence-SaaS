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

<h1 className="text-3xl font-bold">
Manage Campaign
</h1>

<div className="bg-white border shadow-sm rounded-lg p-6 flex justify-between items-center">

<div>
<div className="text-3xl font-bold mt-1">
{campaign?.name}
</div>

<div className="text-gray-500 text-sm mt-1">
Slug: {campaign?.slug}
</div>
</div>

<button
onClick={toggleCampaign}
className={`px-4 py-2 rounded-md text-sm font-medium transition ${
campaign?.is_active
? "bg-green-500 hover:bg-green-600 text-white"
: "bg-gray-500 hover:bg-gray-600 text-white"
}`}
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

<div className="bg-white border shadow-sm rounded-lg p-6 hover:shadow-md transition">

<div className="flex justify-between items-center mb-4">

<h2 className="text-lg font-semibold text-gray-700">
Offers
</h2>



</div>

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">

<tr>
{/* <th className="p-3 border">ID</th> */}
<th className="p-3 border text-left max-w-[50px] truncate">URL</th>
<th className="p-3 border">Weight</th>
<th className="p-3 border">Mode</th>
<th className="p-3 border">Status</th>
<th className="p-3 border">Actions</th>
</tr>

</thead>

<tbody>

{offers.length === 0 ? (
<tr>
<td colSpan="6" className="p-4 text-center text-gray-500">
No offers yet
</td>
</tr>
) : (
offers.map(o=>(

<tr key={o.id} className="text-center hover:bg-gray-50 transition">

{/* <td className="p-3 border">{o.id}</td> */}

<td className="p-3 border text-left max-w-[130px] truncate">
{o.url}
</td>

<td className="p-3 border">
{o.weight}
</td>

<td className="p-3 border">
{o.redirect_mode || "-"}
</td>

<td className="p-3 border">
<button
onClick={()=>toggleOffer(o.id,o.is_active)}
className={`px-3 py-1 rounded-full text-xs font-medium transition ${
o.is_active
? "bg-green-100 text-green-700 hover:bg-green-200"
: "bg-gray-200 text-gray-700 hover:bg-gray-300"
}`}
>
{o.is_active ? "Active" : "Paused"}
</button>
</td>

<td className="p-3 border flex justify-center gap-2 flex-wrap">

<button
onClick={()=>!o.is_active && deleteOffer(o.id)}
disabled={o.is_active}
title={o.is_active ? "Deactivate offer first" : "Delete offer"}
className={`px-3 py-1 rounded-full text-xs font-medium transition
${o.is_active
? "bg-gray-200 text-gray-400 cursor-not-allowed"
: "bg-red-100 text-red-700 hover:bg-red-200"}
`}
>
Delete
</button>
</td>

</tr>

))
)}

</tbody>

</table>

</div>

</div>

{/* RULES SECTION */}

<div className="bg-white border shadow-sm rounded-lg p-6 hover:shadow-md transition">

<div className="flex justify-between items-center mb-4">

<h2 className="text-lg font-semibold text-gray-700">
Rules
</h2>


</div>

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">

<tr>
{/* <th className="p-3 border">ID</th> */}
<th className="p-3 border">Name</th>
<th className="p-3 border">Country</th>
<th className="p-3 border">Action</th>
<th className="p-3 border">Status</th>
<th className="p-3 border">Actions</th>
</tr>

</thead>

<tbody>

{rules.length === 0 ? (
<tr>
<td colSpan="5" className="p-4 text-center text-gray-500">
No rules yet
</td>
</tr>
) : (
rules.map(r=>(

<tr key={r.id} className="text-center">

{/* <td className="p-3 border">{r.id}</td> */}

<td className="p-3 border">{r.name}</td>
<td className="p-3 border">
{r.conditions?.find(c=>c.field==="country")?.value || "-"}
</td>
<td className="p-3 border">{r.action_type}</td>

<td className="p-3 border">
<button
onClick={()=>toggleRule(r.id,r.is_active)}
className={`px-3 py-1 rounded-full text-xs font-medium transition ${
r.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
}`}
>
{r.is_active ? "Active" : "Paused"}
</button>
</td>

<td className="p-3 border flex justify-center gap-2 flex-wrap">

<button
onClick={()=>!r.is_active && deleteRule(r.id)}
disabled={r.is_active}
title={r.is_active ? "Deactivate rule first" : "Delete rule"}
className={`px-3 py-1 rounded-full text-xs font-medium transition
${r.is_active
? "bg-gray-200 text-gray-400 cursor-not-allowed"
: "bg-red-100 text-red-700 hover:bg-red-200"}
`}
>
Delete
</button>

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

<div className="grid grid-cols-2 gap-3">

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_vpn}
onChange={()=>toggleProtection("block_vpn")}
/>
VPN Detection
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_proxy}
onChange={()=>toggleProtection("block_proxy")}
/>
Proxy Detection
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_tor}
onChange={()=>toggleProtection("block_tor")}
/>
Tor Network Block
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_datacenter}
onChange={()=>toggleProtection("block_datacenter")}
/>
Datacenter ASN Block
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_automation}
onChange={()=>toggleProtection("block_automation")}
/>
Headless Browser Detection
</label>

<label className="flex items-center gap-2">
<input
type="checkbox"
checked={protection.block_canvas}
onChange={()=>toggleProtection("block_canvas")}
/>
Canvas Fingerprint Detection
</label>

</div>

</div>

</div>

</div>

</div>

);

}

function StatCard({title,value}){

return(

<div className="bg-white shadow rounded p-6">

<div className="text-gray-500 text-sm">
{title}
</div>

<div className="text-3xl font-bold mt-1">
{value || 0}
</div>

</div>

);

}