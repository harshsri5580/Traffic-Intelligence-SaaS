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

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Billing
      </h1>

      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-3 border">User</th>
              <th className="p-3 border">Plan</th>
              <th className="p-3 border">Amount</th>
              <th className="p-3 border">Status</th>
              <th className="p-3 border">Date</th>
            </tr>

          </thead>

          <tbody>

            {loading && (
              <tr>
                <td colSpan="5" className="text-center p-6">
                  Loading billing data...
                </td>
              </tr>
            )}

            {!loading && payments.map((p, i) => (

              <tr key={i} className="text-center">

                <td className="p-2 border">
                  {p.user}
                </td>

                <td className="p-2 border">
                  {p.plan}
                </td>

                <td className="p-2 border">
                  ${p.amount}
                </td>

                <td className="p-2 border">
                  {p.status}
                </td>

                <td className="p-2 border">
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