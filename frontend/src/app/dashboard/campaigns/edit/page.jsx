"use client";
export const dynamic = "force-dynamic";
import { useEffect,useState } from "react";
import { useSearchParams,useRouter } from "next/navigation";
import api from "../../../../services/api";
import { toast } from "react-hot-toast";
function EditCampaign(){

const params = useSearchParams();
const router = useRouter();
const [sources,setSources] = useState([]);

const id = typeof window !== "undefined" ? params.get("id") : null;

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

{/* CARD */}

<div className="bg-white shadow rounded p-6 max-w-3xl">

<h2 className="text-lg font-semibold mb-6">
Campaign Settings
</h2>

<div className="grid grid-cols-2 gap-4">

{/* Campaign Name */}

<input
className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Campaign Name"
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

{/* Traffic Source */}

<select
className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

{/* TRACKING MACROS */}

<div className="col-span-2 mt-4 border-t pt-4">

<div className="font-semibold mb-3">Tracking Macros</div>

<div className="grid grid-cols-2 gap-4">

<div>
<div className="text-sm mb-1">Sub1</div>
<select
className="border p-2 rounded w-full"
value={form.sub1 || ""}
onChange={(e)=>setForm({...form,sub1:e.target.value})}
>
<option value="">None</option>
<option value="clickid">Click ID</option>
<option value="zoneid">Zone ID</option>
<option value="campaignid">Campaign ID</option>
<option value="source">Source</option>
<option value="keyword">Keyword</option>
<option value="cost">Cost</option>
</select>
</div>

<div>
<div className="text-sm mb-1">Sub2</div>
<select
className="border p-2 rounded w-full"
value={form.sub2 || ""}
onChange={(e)=>setForm({...form,sub2:e.target.value})}
>
<option value="">None</option>
<option value="clickid">Click ID</option>
<option value="zoneid">Zone ID</option>
<option value="campaignid">Campaign ID</option>
<option value="source">Source</option>
<option value="keyword">Keyword</option>
<option value="cost">Cost</option>
</select>
</div>

</div>
</div>

{/* Fallback URL */}

<input
className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Fallback URL"
value={form.fallback_url}
onChange={(e)=>setForm({...form,fallback_url:e.target.value})}
/>

{/* Safe Page */}

<input
className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
placeholder="Safe Page URL"
value={form.safe_page_url}
onChange={(e)=>setForm({...form,safe_page_url:e.target.value})}
/>

{/* Bot URL */}

<input
className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
placeholder="Bot URL"
value={form.bot_url}
onChange={(e)=>setForm({...form,bot_url:e.target.value})}
/>

</div>

{/* BUTTONS */}

<div className="mt-6 flex gap-3">

<button
onClick={updateCampaign}
className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
>
Update Campaign
</button>

<button
onClick={()=>router.push("/dashboard/campaigns")}
className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300 transition"
>
Cancel
</button>

</div>

</div>

</div>

);

}

import dynamic from "next/dynamic";

export default dynamic(() => Promise.resolve(EditCampaign), {
  ssr: false,
});
