"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "../../../../services/api";
import { toast } from "react-hot-toast";

export default function ScriptPage(){

const behaviorScript = `
<script>
(function(){
  let mouse=0,scroll=0,clicks=0,start=Date.now();

  document.addEventListener("mousemove",()=>mouse++);
  document.addEventListener("scroll",()=>scroll++);
  document.addEventListener("click",()=>clicks++);

  setInterval(()=>{
    try{
      fetch("${process.env.NEXT_PUBLIC_API_URL}/api/behavior/track",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          mouse,
          scroll,
          click:clicks,
          time:Math.floor((Date.now()-start)/1000)
        })
      });
    }catch(e){}
    mouse=0;scroll=0;clicks=0;
  },4000);
})();
</script>
`;

const params = useSearchParams();
const slug = params.get("slug");

const [scripts,setScripts] = useState(null);
const [loading,setLoading] = useState(true);

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

{/* DIRECT LINK */}

<div className="mb-8">

<h2 className="font-semibold mb-2">
Direct Link
</h2>

<input
className="border p-2 w-full rounded"
value={scripts.direct_link}
readOnly
/>

<button
onClick={()=>copy(scripts.direct_link)}
className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
>
Copy
</button>

</div>


{/* PHP SCRIPT */}

<div className="mb-8">

<h2 className="font-semibold mb-2">
PHP Script
</h2>

<textarea
className="border p-2 w-full rounded"
rows={5}
value={scripts.php_script + "\n\n" + behaviorScript}
readOnly
/>

<button
onClick={()=>copy(scripts.php_script + "\n\n" + behaviorScript)}
className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
>
Copy
</button>

</div>


{/* JS LOADER */}

<div className="mb-8">

<h2 className="font-semibold mb-2">
JavaScript Loader
</h2>

<textarea
className="border p-2 w-full rounded"
rows={8}
value={scripts.js_loader + "\n\n" + behaviorScript}
readOnly
/>

<button
onClick={()=>copy(scripts.js_loader + "\n\n" + behaviorScript)}
className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
>
Copy
</button>

</div>


{/* IFRAME */}

<div className="mb-8">

<h2 className="font-semibold mb-2">
iFrame Cloak
</h2>

<textarea
className="border p-2 w-full rounded"
rows={3}
value={scripts.iframe_cloak}
readOnly
/>

<button
onClick={()=>copy(scripts.iframe_cloak)}
className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
>
Copy
</button>

</div>


{/* WORDPRESS */}

<div className="mb-8">

<h2 className="font-semibold mb-2">
WordPress Snippet
</h2>

<textarea
className="border p-2 w-full rounded"
rows={5}
value={scripts.wordpress_snippet}
readOnly
/>

<button
onClick={()=>copy(scripts.wordpress_snippet)}
className="bg-blue-600 text-white px-4 py-2 mt-2 rounded"
>
Copy
</button>

</div>

</div>

);

}