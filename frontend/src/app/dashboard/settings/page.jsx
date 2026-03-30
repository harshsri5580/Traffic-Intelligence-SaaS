"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import { toast } from "react-hot-toast";

export default function SettingsPage(){

const [profile,setProfile]=useState({
name:"",
email:"",
timezone:"UTC",
webhook_url:"",
api_key:""
});

const [password,setPassword]=useState({
current_password:"",
new_password:""
});

const [sources,setSources]=useState([]);
const [newSource,setNewSource]=useState("");

const [loading,setLoading]=useState(true);
const [saving,setSaving]=useState(false);

useEffect(()=>{

const token=localStorage.getItem("token");

if(!token){
window.location.href="/login";
return;
}

loadProfile();
loadSources();

},[]);

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const postbackURL = `${BASE_URL}/track/conversion?click_id={clickid}&payout={payout}`;
// ================= PROFILE =================

const loadProfile=async()=>{
try{
const res=await api.get("/user/profile");
setProfile(res.data || {});
}catch(err){
toast.error("Failed to load profile");
}
setLoading(false);
};

const updateProfile=async()=>{
setSaving(true);
try{
await api.put("/user/profile",profile);
toast.success("Profile updated 🚀");
}catch(err){
toast.error("Update failed");
}
setSaving(false);
};

// ================= PASSWORD =================

const changePassword=async()=>{
if(!password.current_password || !password.new_password){
toast.error("Fill all fields");
return;
}

try{
await api.post("/user/change-password",password);

setPassword({
current_password:"",
new_password:""
});

toast.success("Password changed 🔐");

}catch(err){
toast.error("Password change failed");
}
};

const copyPostback = () => {
  navigator.clipboard.writeText(postbackURL);
  toast.success("Postback copied 🚀");
};

// ================= API KEY =================

const generateAPIKey=async()=>{
if(!confirm("Generate new API key?")) return;

try{
const res=await api.post("/user/api-key");
setProfile({...profile,api_key:res.data.api_key});
toast.success("New API key generated");
}catch(err){
toast.error("Failed to generate key");
}
};

const copyKey=()=>{
if(!profile.api_key) return;
navigator.clipboard.writeText(profile.api_key);
toast.success("Copied!");
};

// ================= SOURCES =================

const loadSources=async()=>{
try{
const res=await api.get("/sources/");
setSources(res.data || []);
}catch(err){
toast.error("Failed to load sources");
}
};

const addSource=async()=>{
if(!newSource.trim()){
toast.error("Source name required");
return;
}

try{
await api.post(`/sources/?name=${newSource.trim()}`);
setNewSource("");
loadSources();
toast.success("Source added");
}catch(err){
toast.error("Add failed");
}
};

const deleteSource=async(id)=>{
if(!confirm("Delete source?")) return;

try{
await api.delete(`/sources/${id}`);
loadSources();
toast.success("Deleted");
}catch(err){
toast.error("Delete failed");
}
};

// ================= UI =================

if(loading){
return <div className="p-10 text-gray-500">Loading settings...</div>
}

return(

<div className="p-8 max-w-5xl space-y-8">

<h1 className="text-3xl font-bold">Settings</h1>

{/* PROFILE */}

<div className="bg-white shadow-lg rounded-xl p-6 border">

<h2 className="text-xl font-semibold mb-4">Profile</h2>

<div className="grid gap-4">

<input
className="input"
placeholder="Name"
value={profile.name || ""}
onChange={(e)=>setProfile({...profile,name:e.target.value})}
/>

<input
className="input"
placeholder="Email"
value={profile.email || ""}
onChange={(e)=>setProfile({...profile,email:e.target.value})}
/>

<select
className="input"
value={profile.timezone || "UTC"}
onChange={(e)=>setProfile({...profile,timezone:e.target.value})}
>
<option value="UTC">UTC</option>
<option value="Asia/Kolkata">India</option>
<option value="America/New_York">USA</option>
<option value="Europe/London">UK</option>
</select>

<input
className="input"
placeholder="Webhook URL"
value={profile.webhook_url || ""}
onChange={(e)=>setProfile({...profile,webhook_url:e.target.value})}
/>

<button
onClick={updateProfile}
disabled={saving}
className="btn-primary"
>
{saving ? "Saving..." : "Update Profile"}
</button>

</div>

</div>

{/* TRAFFIC SOURCES (UNCHANGED LOGIC) */}

<div className="bg-white shadow-lg rounded-xl p-6 border">

<h2 className="text-xl font-semibold mb-4">Traffic Sources</h2>

<div className="flex gap-2 mb-4">

<input
className="input flex-1"
placeholder="New Source"
value={newSource}
onChange={(e)=>setNewSource(e.target.value)}
/>

<button onClick={addSource} className="btn-primary">
Add
</button>

</div>

<table className="w-full text-sm border rounded overflow-hidden">

<thead className="bg-gray-100">
<tr>
{/* <th className="p-2 border">ID</th> */}
<th className="p-2 border">Name</th>
<th className="p-2 border">Action</th>
</tr>
</thead>

<tbody>

{sources.map(s=>(
<tr key={s.id} className="text-center hover:bg-gray-50">
{/* <td className="p-2 border">{s.id}</td> */}
<td className="p-2 border">{s.name}</td>
<td className="p-2 border">
<button
onClick={()=>deleteSource(s.id)}
className="text-red-600 font-semibold hover:underline"
>
Delete
</button>
</td>
</tr>
))}

</tbody>

</table>

</div>

{/* PASSWORD */}

<div className="bg-white shadow-lg rounded-xl p-6 border">

<h2 className="text-xl font-semibold mb-4">Change Password</h2>

<div className="grid gap-4">

<input
type="password"
placeholder="Current Password"
className="input"
value={password.current_password}
onChange={(e)=>setPassword({...password,current_password:e.target.value})}
/>

<input
type="password"
placeholder="New Password"
className="input"
value={password.new_password}
onChange={(e)=>setPassword({...password,new_password:e.target.value})}
/>

<button
onClick={changePassword}
className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
>
Change Password
</button>

</div>

</div>

{/* API KEY */}

<div className="bg-white shadow-lg rounded-xl p-6 border">

<h2 className="text-xl font-semibold mb-4">API Key</h2>

<div className="flex gap-3">

<input
className="input flex-1"
value={profile.api_key || ""}
readOnly
/>

<button onClick={copyKey} className="btn-dark">
Copy
</button>

<button onClick={generateAPIKey} className="btn-danger">
Generate
</button>

</div>

</div>

{/* POSTBACK URL */}

<div className="bg-white shadow-lg rounded-xl p-6 border">

<h2 className="text-xl font-semibold mb-4">Postback URL</h2>

<div className="flex gap-3">

<input
className="input flex-1"
value={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/track/conversion?click_id={clickid}&payout={payout}`}
readOnly
/>

<button
onClick={()=>{
navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/track/conversion?click_id={clickid}&payout={payout}`)
toast.success("Copied!")
}}
className="btn-dark"
>
Copy
</button>

</div>

</div>

</div>

);
}

// ================= COMMON STYLES =================
