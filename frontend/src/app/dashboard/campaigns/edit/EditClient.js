"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../services/api";
import { toast } from "react-hot-toast";

export default function EditClient() {

const router = useRouter();
const [sources,setSources] = useState([]);
const [id, setId] = useState(null);

const [form,setForm] = useState({
  name:"",
  fallback_url:"",
  safe_page_url:"",
  bot_url:"",
  traffic_source:"",
  sub1:null,
  sub2:null
});

useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    setId(params.get("id"));
  }
}, []);

useEffect(() => {
  if (!id) return;

  loadSources();
  loadCampaign();

}, [id]);

const loadCampaign = async()=>{

try{
const res = await api.get(`/campaigns/${id}`);

setForm({
  name: res.data.name || "",
  fallback_url: res.data.fallback_url || "",
  safe_page_url: res.data.safe_page_url || "",
  bot_url: res.data.bot_url || "",
  traffic_source: res.data.traffic_source || "",
  sub1: res.data.sub1 || null,
  sub2: res.data.sub2 || null
});

}catch(err){
console.error(err);
}
};

const loadSources = async()=>{
try{
const res = await api.get("/sources/");
setSources(res.data || []);
}catch(err){
console.error("Sources load error",err);
}
};

const updateCampaign = async()=>{
try{
await api.put(`/campaigns/${id}`,form);
toast.success("Campaign updated 🚀");
router.push("/dashboard/campaigns");
}catch(err){
console.error(err);
toast.error("Campaign Failed to Update");
}
};

return(
<div className="p-8">

<h1 className="text-3xl font-bold mb-8">
Edit Campaign
</h1>

<div className="bg-white shadow rounded p-6 max-w-3xl">

<h2 className="text-lg font-semibold mb-6">
Campaign Settings
</h2>

<div className="grid grid-cols-2 gap-4">

<input
className="border p-2 rounded"
placeholder="Campaign Name"
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

<select
className="border p-2 rounded"
value={form.traffic_source}
onChange={(e)=>setForm({...form,traffic_source:e.target.value})}
>
<option value="direct">Direct</option>
{sources.map((s)=>(
<option key={s.id} value={s.name}>
{s.name}
</option>
))}
</select>

<input
className="border p-2 rounded"
placeholder="Fallback URL"
value={form.fallback_url}
onChange={(e)=>setForm({...form,fallback_url:e.target.value})}
/>

<input
className="border p-2 rounded"
placeholder="Safe Page URL"
value={form.safe_page_url}
onChange={(e)=>setForm({...form,safe_page_url:e.target.value})}
/>

<input
className="border p-2 rounded col-span-2"
placeholder="Bot URL"
value={form.bot_url}
onChange={(e)=>setForm({...form,bot_url:e.target.value})}
/>

</div>

<div className="mt-6 flex gap-3">

<button
onClick={updateCampaign}
className="bg-blue-600 text-white px-5 py-2 rounded"
>
Update Campaign
</button>

<button
onClick={()=>router.push("/dashboard/campaigns")}
className="bg-gray-200 px-5 py-2 rounded"
>
Cancel
</button>

</div>

</div>
</div>
);
}