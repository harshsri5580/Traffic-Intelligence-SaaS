"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function ReportsPage() {

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [error, setError] = useState("");

    // 🔥 SAFE API BASE (NO UNDEFINED BUG)
    const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    useEffect(() => {
        load();
    }, []);

    // ===============================
    // 📥 LOAD REPORTS
    // ===============================
    const load = async () => {
        try {
            setError("");
            const res = await api.get("/reports");
            setFiles(res.data.reports || []);
        } catch (err) {
            console.error("Failed to load reports", err);
            setError("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (file) => {
        try {
            const res = await api.get(`/reports/download/${file}`, {
                responseType: "blob", // 🔥 important
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", file);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Download failed (auth issue?)");
        }
    };

    // ===============================
    // 🗑 DELETE REPORT
    // ===============================
    const handleDelete = async (file) => {
        if (!confirm(`Delete ${file}?`)) return;

        try {
            setDeleting(file);

            await api.delete(`/reports/delete/${file}`);

            // UI update
            setFiles(prev => prev.filter(f => f !== file));

        } catch (err) {
            console.error("Delete failed", err);
            alert("Delete failed");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="p-8">

            {/* HEADER */}
            <h1 className="text-3xl font-bold mb-6">📊 Reports</h1>

            {/* ERROR */}
            {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <p className="text-gray-500">Loading reports...</p>
            )}

            {/* EMPTY */}
            {!loading && files.length === 0 && (
                <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500">
                    No reports available yet
                </div>
            )}

            {/* REPORT LIST */}
            <div className="grid md:grid-cols-2 gap-4">

                {files.map((f) => (
                    <div
                        key={f}
                        className="flex items-center justify-between bg-white p-4 rounded-xl shadow hover:shadow-md transition"
                    >
                        {/* FILE INFO */}
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="text-2xl">📁</div>
                            <div className="truncate">
                                <p className="font-medium text-gray-800 truncate">
                                    {f}
                                </p>
                                <p className="text-xs text-gray-400">
                                    Report file
                                </p>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-2 flex-shrink-0">

                            {/* ✅ DOWNLOAD FIX */}
                            <a
                                onClick={(e) => {
                                    e.preventDefault();
                                    downloadFile(f);
                                }}
                                href="#"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm cursor-pointer"
                            >
                                Download
                            </a>

                            {/* DELETE */}
                            <button
                                onClick={() => handleDelete(f)}
                                disabled={deleting === f}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition disabled:opacity-50"
                            >
                                {deleting === f ? "Deleting..." : "Delete"}
                            </button>

                        </div>
                    </div>
                ))}

            </div>

        </div>
    );
}