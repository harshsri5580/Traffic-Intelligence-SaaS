"use client";
import { useState } from "react";

export default function DocsPage() {
    const [open, setOpen] = useState(null);

    const toggle = (section) => {
        setOpen(open === section ? null : section);
    };

    const Section = ({ title, children, id }) => (
        <div className="border border-gray-700 rounded-xl overflow-hidden">
            <button
                onClick={() => toggle(id)}
                className="w-full text-left px-5 py-4 bg-[#111827] hover:bg-[#1f2937] transition flex justify-between items-center"
            >
                <span className="font-semibold text-white">{title}</span>
                <span className="text-gray-400">{open === id ? "-" : "+"}</span>
            </button>

            {open === id && (
                <div className="px-5 py-4 bg-[#0b0f1a] text-gray-300 space-y-2 text-sm leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-6">Documentation</h1>

            <div className="space-y-4">

                <Section title="Getting Started" id="start">
                    <p>1. Create a campaign</p>
                    <p>2. Add rules to filter traffic</p>
                    <p>3. Use tracking link in ads</p>
                </Section>

                <Section title="Campaign Setup" id="campaign">
                    <p>Create a campaign from dashboard</p>
                    <p>Add offer destination URL</p>
                    <p>Enable or pause anytime</p>
                </Section>

                <Section title="Rules Setup" id="rules">
                    <p>Filter traffic using:</p>
                    <p>- Country</p>
                    <p>- Device (mobile / desktop)</p>
                    <p>- Browser</p>
                    <p>- Bot score (recommended: ≤ 50)</p>
                </Section>

                <Section title="Tracking Link" id="tracking">
                    <p>Use this format:</p>
                    <p>/r/your-slug</p>
                    <p>Add it inside ads or landing pages</p>
                </Section>

                <Section title="Proxy Mode" id="proxy">
                    <p>Use proxy for cloaking traffic</p>
                    <p>Parameter:</p>
                    <p>__ti_url__=your_offer_url</p>
                </Section>

                <Section title="Traffic Logs" id="logs">
                    <p>View all clicks</p>
                    <p>Check status: PASS / BLOCKED / FALLBACK</p>
                    <p>Analyze user behavior</p>
                </Section>

                <Section title="Analytics" id="analytics">
                    <p>Track performance</p>
                    <p>See clicks, conversions, devices</p>
                </Section>

            </div>
        </div>
    );
}