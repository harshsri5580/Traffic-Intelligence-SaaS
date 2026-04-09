"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
export default function FiltersPage() {

    const [filters, setFilters] = useState([]);
    const [value, setValue] = useState("");
    const [category, setCategory] = useState("ip");
    const [form, setForm] = useState({ category: "domain", value: "" });

    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        const res = await api.get("/filters/");
        setFilters(res.data);
    };

    const addFilter = async () => {

        let val = value?.trim().toLowerCase();

        if (!val) {
            toast.error("Value required");
            return;
        }

        // IP validation
        if (category === "ip") {
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

            if (!ipRegex.test(val)) {
                toast.error("Invalid IP address");
                return;
            }
        }

        // Domain normalize
        if (category === "domain") {
            val = val
                .replace(/^https?:\/\//, "")
                .replace(/\/$/, "");
        }

        try {
            await api.post("/filters", {
                category,
                value: val
            });

            toast.success(`${category.toUpperCase()} filter added`);

            setValue("");
            loadFilters();

        } catch (err) {
            toast.error("Failed to add filter");
        }
    };

    const deleteFilter = async (f) => {
        try {

            await api.delete(`/filters/${f.id}`);

            toast.success(`${f.category.toUpperCase()} filter removed`);

            loadFilters();

        } catch (err) {
            toast.error("Failed to delete filter");
        }
    };



    return (

        <div className="p-8">

            <h1 className="text-2xl font-bold mb-6">
                Traffic Filters
            </h1>

            {/* ADD FILTER */}

            <div className="flex gap-2 mb-6">

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="ip">IP</option>
                    <option value="domain">Domain</option>
                    <option value="isp">ISP</option>
                    <option value="ua">User Agent</option>
                </select>

                <input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="value"
                />

                <button
                    onClick={addFilter}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Add
                </button>

            </div>

            {/* TABLE */}

            <div className="bg-white shadow rounded overflow-x-auto">

                <table className="w-full text-sm border">

                    <thead className="bg-gray-100">

                        <tr>

                            {/* <th className="p-2 border">ID</th> */}
                            <th className="p-2 border">Category</th>
                            <th className="p-2 border">Value</th>
                            <th className="p-2 border">Status</th>
                            <th className="p-2 border">Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filters.map(f => (

                            <tr key={f.id} className="text-center hover:bg-gray-50">

                                {/* <td className="p-2 border">{f.id}</td> */}

                                <td className="p-2 border uppercase">
                                    {f.category}
                                </td>

                                <td className="p-2 border font-mono text-xs">
                                    {f.value}
                                </td>

                                <td className="p-2 border">

                                    <span className={`px-2 py-1 rounded text-xs font-semibold
${f.is_active ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>

                                        {f.is_active ? "BLOCKED" : "ALLOWED"}

                                    </span>

                                </td>

                                <td className="p-2 border space-x-2">


                                    <button
                                        onClick={() => deleteFilter(f)}
                                        className="text-red-600 font-semibold"
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

}