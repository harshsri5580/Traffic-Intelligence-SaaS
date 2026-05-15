"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function AdminBillingPage() {

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {

    try {

      const res = await api.get("/billing/admin/all");

      setPayments(res.data || []);

    } catch (err) {

      console.error("billing load error", err);

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-[#F3F4F6]">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#111827]">
            Billing
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            Monitor subscriptions, payments and revenue
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
          {payments.length} Payments
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-[#111827] rounded-[28px] px-6 py-5">
          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Total Revenue
          </div>

          <div className="text-3xl font-semibold text-white">
            $
            {payments.reduce((a, b) => a + (b.amount || 0), 0)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[28px] px-6 py-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Successful
          </div>

          <div className="text-3xl font-semibold text-green-600">
            {
              payments.filter(p => p.status === "active").length
            }
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[28px] px-6 py-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.18em] text-gray-400 mb-4">
            Pending
          </div>

          <div className="text-3xl font-semibold text-yellow-500">
            {
              payments.filter(p => p.status !== "active").length
            }
          </div>
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm">

        <table className="w-full text-sm text-left">

          <thead className="bg-[#F9FAFB] border-b border-gray-200">

            <tr>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">User</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Plan</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Date</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="5" className="text-center py-14 text-gray-500">
                  Loading billing data...
                </td>
              </tr>
            )}

            {!loading && payments.map((p, i) => (

              <tr
                key={i}
                className="border-b border-gray-100 hover:bg-gray-50 transition-all"
              >

                <td className="px-6 py-5 font-semibold text-[#111827]">
                  {p.user}
                </td>

                <td className="px-6 py-5">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    {p.plan}
                  </span>
                </td>

                <td className="px-6 py-5 font-semibold text-green-600">
                  ${p.amount}
                </td>

                <td className="px-6 py-5">

                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === "paid"
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                    }`}>

                    {p.status}

                  </span>

                </td>

                <td className="px-6 py-5 text-gray-700">
                  {new Date(p.date).toLocaleDateString()}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}