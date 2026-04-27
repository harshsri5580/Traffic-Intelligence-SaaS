"use client";

import { useEffect, useState } from "react";
import api from "../../../services/api";

export default function ReportsPage() {

    const [files, setFiles] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const u = JSON.parse(localStorage.getItem("user"));

        if (u) {
            setUser(u);
            load(u);
        }
    }, []);

    const load = async (u) => {
        try {
            const res = await api.get(`/reports?user_id=${u.id}`);
            setFiles(res.data);
        } catch (err) {
            console.error("Report load failed", err);
        }
    };

    return (
        <div className="p-8">

            <h1 className="text-2xl font-bold mb-6">📊 Reports</h1>

            {files.length === 0 && (
                <p className="text-gray-400">No reports yet</p>
            )}

            <div className="space-y-3">
                {files.map(f => (
                    <div key={f} className="flex justify-between bg-white p-4 rounded shadow">
                        <span>{f}</span>

                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/reports/download/${f}`}
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                            Download
                        </a>
                    </div>
                ))}
            </div>

        </div>
    );
}