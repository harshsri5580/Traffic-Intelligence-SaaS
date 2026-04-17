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
  tracking_domain:"",
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
  tracking_domain: res.data.tracking_domain || "",
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

  // 🔥 ADD THIS VALIDATION
  if (!form.safe_page_url) {
    toast.error("Safe Page URL required (Domain required)");
    return;
  }

  try{
    await api.put(`/campaigns/${id}`,{
      ...form,
      tracking_domain: form.tracking_domain || null
    });
    toast.success("Campaign updated 🚀");
    router.push("/dashboard/campaigns");
  }catch(err){
    console.error(err);
    toast.error("Campaign Failed to Update");
  }
};

if (!id) return <div>Loading...</div>;

return(
<div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">

  <h1 className="text-3xl font-semibold tracking-tight mb-8">
    Edit Campaign
  </h1>

  <div className="max-w-3xl">

    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition">

      <h2 className="text-lg font-semibold text-gray-700 mb-6">
        Campaign Update
      </h2>

      <div className="grid md:grid-cols-2 gap-4">

        {/* NAME */}
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Campaign Name"
          value={form.name}
          onChange={(e)=>setForm({...form,name:e.target.value})}
        />

        {/* SOURCE */}
        <select
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none"
          value={form.traffic_source}
          onChange={(e)=>setForm({...form,traffic_source:e.target.value})}
        >
          <option value="direct">Direct</option>
          {sources.map((s)=>(
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>

        {/* FALLBACK */}
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Fallback URL"
          value={form.fallback_url}
          onChange={(e)=>setForm({...form,fallback_url:e.target.value})}
        />

        {/* SAFE PAGE */}
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Safe Page URL (Required)"
          value={form.safe_page_url}
          onChange={(e)=>setForm({...form,safe_page_url:e.target.value})}
        />

        {/* TRACKING DOMAIN */}
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Tracking Domain (https://yourdomain.com)"
          value={form.tracking_domain}
          onChange={(e)=>setForm({...form,tracking_domain:e.target.value})}
        />

        {/* BOT URL */}
        <input
          className="px-3 py-2.5 rounded-lg border border-gray-300 
          text-sm shadow-sm bg-white
          focus:ring-2 focus:ring-indigo-500 outline-none md:col-span-2"
          placeholder="Bot URL"
          value={form.bot_url}
          onChange={(e)=>setForm({...form,bot_url:e.target.value})}
        />

      </div>

      {/* ACTIONS */}
      <div className="mt-8 flex gap-3">

        <button
          onClick={updateCampaign}
          disabled={!form.safe_page_url}
          className="px-6 py-2.5 rounded-lg text-white text-sm font-medium
          bg-gradient-to-r from-indigo-500 to-blue-600
          hover:shadow-lg hover:scale-[1.03] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update Campaign
        </button>

        <button
          onClick={()=>router.push("/dashboard/campaigns")}
          className="px-6 py-2.5 rounded-lg text-sm font-medium
          bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
        >
          Cancel
        </button>

      </div>

    </div>

  </div>

</div>
);
}