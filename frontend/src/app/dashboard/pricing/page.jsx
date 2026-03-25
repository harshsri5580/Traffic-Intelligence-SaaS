"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function PricingPage() {

  const [plans, setPlans] = useState([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const res = await api.get("/billing/plans");
    setPlans(res.data || []);
  };

  const subscribe = async (id) => {
    await api.post(`/billing/subscribe/${id}`);
    alert("Plan activated!");
    window.location.href = "/dashboard";
  };

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-8">Pricing</h1>

      <div className="grid grid-cols-3 gap-6">

        {plans.map((p) => (

          <div key={p.id} className="border p-6 rounded shadow">

            <h2 className="text-xl font-bold">{p.name}</h2>

            <p className="text-2xl my-4">${p.price}</p>

            <p>Campaigns: {p.max_campaigns}</p>
            <p>Clicks: {p.max_monthly_clicks || "Unlimited"}</p>

            <button
              onClick={() => subscribe(p.id)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Choose Plan
            </button>

          </div>

        ))}

      </div>

    </div>

  );

}