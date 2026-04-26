"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../../services/api";
import { toast } from "react-hot-toast";

export default function ScriptPage(){

// const behaviorScript = `
// <script>
// (function(){
//   let mouse=0,scroll=0,clicks=0,start=Date.now();

//   document.addEventListener("mousemove",()=>mouse++);
//   document.addEventListener("scroll",()=>scroll++);
//   document.addEventListener("click",()=>clicks++);

//   setInterval(()=>{
//     try{
//       fetch("${process.env.NEXT_PUBLIC_API_URL}/behavior/track",{
//         method:"POST",
//         headers:{"Content-Type":"application/json"},
//         body:JSON.stringify({
//           mouse,
//           scroll,
//           click:clicks,
//           time:Math.floor((Date.now()-start)/1000)
//         })
//       });
//     }catch(e){}
//     mouse=0;scroll=0;clicks=0;
//   },4000);
// })();
// </script>
// `;

const params = useSearchParams();
const slug = params.get("slug");

const [scripts,setScripts] = useState(null);
const [loading,setLoading] = useState(true);
const [activeTab, setActiveTab] = useState("auto");

useEffect(()=>{

if(!slug) return;

loadScripts();

},[slug]);

const loadScripts = async ()=>{

try{

const res = await api.get(`/tools/script/${slug}`);

setScripts(res.data);

}catch(err){

console.error("Script load failed",err);

}finally{

setLoading(false);

}

};

const copy = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // fallback (important for localhost / http)
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    toast.success("Copied!");
  } catch (err) {
    console.error("Copy failed", err);
    toast.error("Copy failed");
  }
};


const getScript = () => {

  if(activeTab === "auto"){
  return scripts.script || scripts.php_script;
}

  if(activeTab === "php") return scripts.script || scripts.php_script;
  if(activeTab === "js") return scripts.js_loader;
  if(activeTab === "iframe") return scripts.iframe_cloak;
  if(activeTab === "wp") return scripts.wordpress_snippet;
  if(activeTab === "hybrid") return scripts.hybrid_script;

};

if(loading){

return <div className="p-10">Loading scripts...</div>;

}

if(!scripts){

return <div className="p-10 text-red-500">Script not found</div>;

}

return(

<div className="p-8 max-w-4xl">

<h1 className="text-3xl font-bold mb-8">
Script Generator
</h1>
<p className="text-gray-500 mb-6">
  Campaign: <span className="font-semibold text-gray-800">
    {scripts?.campaign_name || slug}
  </span>
</p>
<div className="flex gap-2 mb-6">

  {["auto","hybrid","php","js","iframe","wp"].map(tab => (
    <button
      key={tab}
      onClick={()=>setActiveTab(tab)}
      className={`px-4 py-2 rounded text-sm transition ${
  activeTab === tab 
  ? "bg-blue-600 text-white shadow" 
  : "bg-gray-200 hover:bg-gray-300"
}`}
    >
      {tab.toUpperCase()}
    </button>
  ))}

</div>

{/* DIRECT LINK */}

{/* ========================= */}
{/* 🔥 SCRIPT BOX (DYNAMIC) */}
{/* ========================= */}

<div className="mb-10">

  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
    Script

    {activeTab === "auto" && (
      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
        Recommended ({scripts.mode})
      </span>
    )}
  </h2>

  <pre className="border p-4 w-full rounded bg-gray-50 text-sm overflow-auto max-h-[400px]">
    <code>
      {getScript()}
    </code>
  </pre>

  <button
    onClick={()=>copy(getScript())}
    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 mt-2 rounded transition"
  >
    Copy Script
  </button>

</div>
</div>

);

}