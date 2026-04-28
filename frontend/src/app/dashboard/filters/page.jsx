"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";
import toast from "react-hot-toast";
export default function FiltersPage() {

    const [filters, setFilters] = useState([]);
    const [value, setValue] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all | block | allow
    const [category, setCategory] = useState("ip");
    const [filterType, setFilterType] = useState("block"); // NEW
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
        // ❌ SAME VALUE CHECK (no duplicate)
        const exists = filters.find(
            f => f.category === category && f.value === val
        );

        if (exists) {
            // ❌ same type
            if (exists.filter_type === filterType) {
                toast.error("Already exists");
                return;
            }

            // ❌ conflict (block vs allow)
            toast.error("Same value can't be in Block & Allow");
            return;
        }
        try {
            await api.post("/filters/", {
                category,
                value: val,
                filter_type: filterType // NEW
            });

            toast.success(`${category.toUpperCase()} filter added`);

            setValue("");
            setFilterType("block");
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

    const filteredData = filters.filter(f => {
        if (statusFilter === "all") return true;
        return f.filter_type === statusFilter;
    });

    return (

        <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">

                <h1 className="text-3xl font-semibold tracking-tight">
                    Traffic Filters
                </h1>

            </div>

            {/* ADD FILTER CARD */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-8">

                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm shadow-sm"
                    >
                        <option value="all">All</option>
                        <option value="block">Blocked </option>
                        <option value="allow">Allowed </option>
                    </select>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 
                text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="ip">IP</option>
                        <option value="domain">Domain</option>
                        <option value="isp">ISP</option>
                        <option value="ua">User Agent</option>
                    </select>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm shadow-sm"
                    >
                        <option value="block">Block (Blacklist) </option>
                        <option value="allow">Allow (Whitelist) </option>
                    </select>

                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Enter ${category}...`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 
                text-sm shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />

                    <button
                        onClick={addFilter}
                        className="px-5 py-2 rounded-lg text-white text-sm font-medium
                bg-gradient-to-r from-indigo-500 to-blue-600
                hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
                    >
                        Add Filter
                    </button>

                </div>

            </div>

            {/* TABLE CARD */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 text-sm text-gray-500">
                    Showing {filteredData.length} filters
                </div>
                <div className="overflow-x-auto">

                    <table className="w-full text-sm">

                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">

                            <tr>
                                <th className="p-3 text-left">Category</th>
                                <th className="p-3 text-left">Value</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>

                        </thead>

                        <tbody>

                            {filters.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-6 text-center text-gray-400">
                                        No filters added yet
                                    </td>
                                </tr>

                            ) :
                                filteredData.map(f => (

                                    <tr key={f.id} className="border-t hover:bg-gray-50 transition">

                                        <td className="p-3 font-medium uppercase text-gray-700">
                                            {f.category}
                                        </td>

                                        <td className="p-3 font-mono text-xs text-gray-600 max-w-[250px] truncate">
                                            {f.value}
                                        </td>

                                        <td className="p-3 text-center">

                                            <span className={`inline-flex items-center justify-center
    w-[90px] h-[28px]
    text-xs font-medium rounded-full
    ${f.filter_type === "allow"
                                                    ? "bg-green-100 text-green-600"
                                                    : "bg-red-100 text-red-600"
                                                }`}>

                                                {f.filter_type === "allow" ? "Allowed" : "Blocked"}

                                            </span>

                                        </td>

                                        <td className="p-3 text-center">

                                            <button
                                                onClick={() => deleteFilter(f)}
                                                className="px-3 py-1 text-xs rounded-lg
                                    bg-red-50 text-red-600
                                    hover:bg-red-100 transition"
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

        </div>

    );

}