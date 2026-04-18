"use client";
import { useState } from "react";

export default function DocsPage() {

    const [open, setOpen] = useState(null);

    const toggle = (id) => {
        setOpen(open === id ? null : id);
    };

    const Section = ({ title, id, children }) => (
        <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-[#0b0f1a] to-[#0a0d16] shadow-lg overflow-hidden">

            <button
                onClick={() => toggle(id)}
                className="w-full px-6 py-5 flex justify-between items-center
        text-left hover:bg-white/5 transition"
            >
                <span className="text-lg font-medium text-white">{title}</span>
                <span className="text-gray-400 text-xl">
                    {open === id ? "−" : "+"}
                </span>
            </button>

            {open === id && (
                <div className="px-6 pb-6 text-gray-300 text-sm space-y-4 leading-relaxed border-t border-gray-800">
                    {children}
                </div>
            )}

        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 text-white">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                    TrafficIntel AI Docs
                </h1>

                <p className="text-gray-500 text-sm">
                    Complete guide to build, track and protect your traffic
                </p>
            </div>

            {/* SECTIONS */}
            <div className="space-y-5">

                {/* 1 */}
                <Section title="🚀 Getting Started (Complete System Guide)" id="start">

                    <p>
                        <b>TrafficIntel AI</b> is an advanced traffic routing, cloaking, and optimization platform designed to intelligently control where your traffic goes.
                    </p>

                    <p>
                        Instead of sending all users to the same page, this system analyzes each visitor and decides the best destination in real-time.
                    </p>

                    {/* HOW IT WORKS */}
                    <p className="mt-4"><b>🔁 How the System Works:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Visitor → Tracking Link → Rule Engine → Decision → Redirect
                    </div>

                    <ul className="list-disc ml-5 space-y-1 mt-3">
                        <li>User clicks your tracking link (from ads or traffic source)</li>
                        <li>System analyzes user data (country, device, IP, bot signals, etc.)</li>
                        <li>Rules are evaluated</li>
                        <li>A decision is made (PASS / BLOCK / FALLBACK)</li>
                        <li>User is redirected to the appropriate destination</li>
                    </ul>

                    {/* CORE COMPONENTS */}
                    <p className="mt-5"><b>🧩 Core Components Explained:</b></p>

                    <ul className="list-disc ml-5 space-y-2">

                        <li>
                            <b>Campaign</b>
                            <br />
                            The main container where all traffic flows.
                            Every campaign includes offers, rules, and tracking logic.
                        </li>

                        <li>
                            <b>Offers</b>
                            <br />
                            These are your destination URLs (landing pages, affiliate links, etc.).
                            You can add multiple offers and distribute traffic between them.
                        </li>

                        <li>
                            <b>Rules</b>
                            <br />
                            Rules define <b>who sees what</b>.
                            You can filter traffic based on country, device, browser, ISP, bot score, and more.
                        </li>

                        <li>
                            <b>Tracking Link</b>
                            <br />
                            This is the entry point of your traffic.
                            You use this link in ads, landing pages, or traffic sources.
                        </li>

                    </ul>

                    {/* SETUP FLOW */}
                    <p className="mt-5"><b>⚙️ Recommended Setup Flow:</b></p>

                    <ol className="list-decimal ml-5 space-y-2">

                        <li>
                            <b>Create a Campaign</b>
                            <br />
                            Set basic configuration like:
                            <ul className="list-disc ml-5">
                                <li>Safe Page (for bots)</li>
                                <li>Fallback URL (backup redirect)</li>
                                <li>Tracking Domain (for cloaking)</li>
                            </ul>
                        </li>

                        <li>
                            <b>Add Offers</b>
                            <br />
                            Add one or more destination URLs.
                            Use <b>weight</b> to distribute traffic between offers.
                        </li>

                        <li>
                            <b>Create Rules (Optional but Powerful)</b>
                            <br />
                            Define targeting conditions such as:
                            <ul className="list-disc ml-5">
                                <li>Country targeting</li>
                                <li>Device filtering (mobile/desktop)</li>
                                <li>Bot filtering (recommended)</li>
                            </ul>
                        </li>

                        <li>
                            <b>Use Your Tracking Link</b>
                            <br />
                            Paste it into your ads (Facebook, Google, Native Ads, etc.)
                        </li>

                    </ol>

                    {/* LINK TYPES */}
                    <p className="mt-5"><b>🔗 Link Types (Very Important):</b></p>

                    <ul className="list-disc ml-5 space-y-2">

                        <li>
                            <b>📊 Direct Tracking Link</b>
                            <br />
                            Use when:
                            <ul className="list-disc ml-5">
                                <li>No cloaking required</li>
                                <li>Organic traffic</li>
                                <li>Testing campaigns</li>
                            </ul>
                        </li>

                        <li>
                            <b>🔒 Cloaked / Proxy Link</b>
                            <br />
                            Use when:
                            <ul className="list-disc ml-5">
                                <li>Running Facebook Ads</li>
                                <li>Running Google Ads</li>
                                <li>You want to hide your real offer URL</li>
                            </ul>
                        </li>

                    </ul>

                    {/* TRAFFIC DECISION */}
                    <p className="mt-5"><b>🧠 Traffic Decision Outcomes:</b></p>

                    <ul className="list-disc ml-5 space-y-1">

                        <li>
                            <b>PASS</b> → Real user → redirected to offer
                        </li>

                        <li>
                            <b>BLOCK</b> → Bot / VPN / Suspicious → blocked or safe page
                        </li>

                        <li>
                            <b>FALLBACK</b> → No matching rule → fallback URL is used
                        </li>

                    </ul>

                    {/* SAFE PAGE */}
                    <p className="mt-5"><b>🛡️ Safe Page (Critical for Ads):</b></p>

                    <p>
                        Ad platforms like Facebook and Google send bots to check your link.
                        Instead of showing your real offer, the system shows a safe page.
                    </p>

                    <p>
                        This helps prevent:
                    </p>

                    <ul className="list-disc ml-5">
                        <li>Ad account bans</li>
                        <li>Policy violations</li>
                    </ul>

                    {/* ROI */}
                    <p className="mt-5"><b>💰 ROI Tracking & Optimization:</b></p>

                    <p>
                        The system can track cost and revenue to automatically optimize performance.
                    </p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        ROI = (Revenue - Cost) / Cost × 100
                    </div>

                    <p className="text-gray-400 text-xs">
                        Example: Spend $100 → Earn $150 → ROI = 50%
                    </p>

                    <p>
                        You can set ROI thresholds to automatically pause underperforming offers.
                    </p>

                    {/* REAL EXAMPLE */}
                    <p className="mt-5"><b>🎯 Real-World Example:</b></p>

                    <ul className="list-disc ml-5 space-y-1">

                        <li>India mobile users → Offer A</li>
                        <li>USA desktop users → Offer B</li>
                        <li>Bot traffic → Safe Page</li>

                    </ul>

                    {/* FINAL */}
                    <p className="mt-6 text-blue-400 font-medium">
                        🚀 Summary: You send traffic → TrafficIntel AI analyzes → Best destination is delivered automatically
                    </p>

                </Section>

                {/* 2 */}
                <Section title="🎯 Offer System (Complete Guide)" id="offer">

                    <p>
                        Offers define <b>where your traffic is sent</b>.
                        Every visitor that passes your rules will be redirected to an offer.
                    </p>

                    {/* BASIC FLOW */}
                    <p className="mt-4"><b>🔁 Offer Flow:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Traffic → Campaign → Rule Match → Offer Selected → Redirect
                    </div>

                    <p className="mt-3">
                        You can add multiple offers inside a campaign and control how traffic is distributed.
                    </p>

                    {/* CREATE OFFER */}
                    <p className="mt-5"><b>➕ Step 1: Create an Offer</b></p>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>
                            <b>Select Campaign</b>
                            <br />
                            Every offer must belong to a campaign.
                        </li>

                        <li>
                            <b>Offer Name</b>
                            <br />
                            Just for internal tracking (example: "USA Dating Offer")
                        </li>

                        <li>
                            <b>Offer URL</b>
                            <br />
                            The destination where user will be redirected.
                        </li>

                        <li>
                            <b>Weight (IMPORTANT)</b>
                            <br />
                            Controls traffic distribution between multiple offers.
                        </li>
                    </ul>

                    {/* WEIGHT EXPLANATION */}
                    <p className="mt-5"><b>⚖️ Weight System Explained (VERY IMPORTANT):</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Total Weight = 100 (recommended)
                    </div>

                    <ul className="list-disc ml-5 space-y-1 mt-3">
                        <li>Offer A → Weight 70 → gets 70% traffic</li>
                        <li>Offer B → Weight 30 → gets 30% traffic</li>
                    </ul>

                    <p className="text-yellow-400 text-sm mt-2">
                        ⚠️ Total weight should not exceed 100 for best control.
                    </p>

                    <p className="text-gray-400 text-sm">
                        Use this to test multiple offers and optimize performance.
                    </p>

                    {/* MODE */}
                    <p className="mt-5"><b>⚙️ Offer Modes (CRITICAL):</b></p>

                    <ul className="list-disc ml-5 space-y-3">

                        <li>
                            <b>📊 Direct Mode</b>
                            <br />
                            Traffic is sent directly to the offer URL.
                            <ul className="list-disc ml-5">
                                <li>No cloaking</li>
                                <li>Best for organic traffic</li>
                                <li>Fast & simple</li>
                            </ul>
                        </li>

                        <li>
                            <b>🔑 Token Mode</b>
                            <br />
                            Used when your affiliate network requires dynamic tokens.
                            <ul className="list-disc ml-5">
                                <li>Pass tracking parameters</li>
                                <li>Useful for advanced tracking setups</li>
                            </ul>
                        </li>

                        <li>
                            <b>🛡️ Proxy Mode (CLOAKING)</b>
                            <br />
                            This hides your real offer URL.
                            <ul className="list-disc ml-5">
                                <li>Required for Facebook / Google Ads</li>
                                <li>Prevents bans</li>
                                <li>User sees safe page → real user redirected</li>
                            </ul>
                        </li>

                    </ul>

                    {/* PROXY SETUP */}
                    <p className="mt-5"><b>🚀 Proxy Setup (Step-by-Step)</b></p>

                    <p>
                        When you select <b>Proxy Mode</b>, you will see a <b>"Setup Proxy 🚀"</b> button.
                    </p>

                    <p className="text-yellow-400">
                        ⚠️ Proxy will NOT work unless properly configured.
                    </p>

                    {/* STEP 1 */}
                    <p className="mt-4"><b>🌐 Step 1: Domain Setup (Cloudflare)</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Buy a domain (example: yourdomain.com)</li>
                        <li>Add domain to Cloudflare</li>
                        <li>Change nameservers (given by Cloudflare)</li>
                        <li>Go to DNS settings</li>
                        <li>Create A record → point to your server IP</li>
                        <li>Enable Proxy (🟠 Orange Cloud ON)</li>
                    </ul>

                    <div className="bg-yellow-500/20 p-3 rounded text-yellow-300 text-sm mt-2">
                        ⚠️ Proxy MUST be ON (Orange Cloud), otherwise cloaking will fail.
                    </div>

                    {/* STEP 2 */}
                    <p className="mt-4"><b>⚙️ Step 2: Cloudflare Worker</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Go to Cloudflare → Workers</li>
                        <li>Create new worker</li>
                        <li>Paste script (provided in Script Generator)</li>
                        <li>Deploy worker</li>
                    </ul>

                    {/* STEP 3 */}
                    <p className="mt-4"><b>🔗 Step 3: Route Setup</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Go to Worker Routes</li>
                        <li>Add route like:</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        yourdomain.com/*
                    </div>

                    <ul className="list-disc ml-5 mt-2">
                        <li>Attach your worker to this route</li>
                    </ul>

                    {/* FINAL RESULT */}
                    <p className="mt-5"><b>✅ Final Result:</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Bot → sees Safe Page</li>
                        <li>Real user → redirected to Offer</li>
                    </ul>

                    {/* WHEN TO USE WHAT */}
                    <p className="mt-5"><b>🧠 When to Use What:</b></p>

                    <ul className="list-disc ml-5 space-y-1">

                        <li><b>Direct</b> → Testing / Organic traffic</li>
                        <li><b>Proxy</b> → Ads (Facebook, Google)</li>
                        <li><b>Token</b> → Advanced tracking setups</li>

                    </ul>

                    {/* SUMMARY */}
                    <p className="mt-6 text-blue-400 font-medium">
                        🎯 Summary: Offers control where your traffic goes — use weight to optimize, and proxy to protect campaigns.
                    </p>

                </Section>

                {/* 3 */}
                <Section title="🧠 Rule Engine (Traffic Control System)" id="rules">

                    <p>
                        Rules decide <b>who sees which offer</b>.
                        This is the brain of your entire system.
                    </p>

                    {/* CORE FLOW */}
                    <p className="mt-4"><b>🔁 How Rules Work:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Traffic → Campaign → Rule Match → Action → Offer Redirect / Block
                    </div>

                    <p className="mt-3">
                        Each visitor is checked against rules in order of <b>priority</b>.
                    </p>

                    {/* PRIORITY */}
                    <p className="mt-5"><b>🎯 Priority System (VERY IMPORTANT)</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Priority 1 = highest priority</li>
                        <li>System checks rules from top → bottom</li>
                        <li>First matched rule is applied</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Rule 1 → Rule 2 → Rule 3 → Stop on first match
                    </div>

                    <p className="text-yellow-400 text-sm mt-2">
                        ⚠️ Wrong priority setup = wrong traffic routing
                    </p>

                    {/* CONDITIONS */}
                    <p className="mt-5"><b>⚙️ Rule Conditions (Filters)</b></p>

                    <p>Each rule filters users based on conditions:</p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li><b>Country</b> → GEO targeting</li>
                        <li><b>Device</b> → Mobile / Desktop / Tablet</li>
                        <li><b>Browser</b> → Chrome / Safari etc.</li>
                        <li><b>OS</b> → Android / iOS / Windows</li>
                        <li><b>ASN</b> → Detect datacenter traffic</li>
                        <li><b>ISP</b> → Filter networks</li>
                        <li><b>Referrer</b> → Traffic source filtering</li>
                        <li><b>Bot Score</b> → Bot detection (very important)</li>
                        <li><b>Language / Timezone</b> → Advanced targeting</li>
                    </ul>

                    {/* AND OR */}
                    <p className="mt-5"><b>🧩 Match Logic (AND vs OR)</b></p>

                    <ul className="list-disc ml-5 space-y-3">

                        <li>
                            <b>AND (Match ALL)</b>
                            <br />
                            All conditions must match
                            <div className="bg-black/40 p-2 mt-1 rounded text-green-400 text-xs">
                                Country = India AND Device = Mobile → must match both
                            </div>
                        </li>

                        <li>
                            <b>OR (Match ANY)</b>
                            <br />
                            Any one condition can match
                            <div className="bg-black/40 p-2 mt-1 rounded text-green-400 text-xs">
                                Country = India OR Device = Mobile → any one works
                            </div>
                        </li>

                    </ul>

                    <p className="text-yellow-400 text-sm">
                        ⚠️ Most users should use AND for accuracy
                    </p>

                    {/* ACTION */}
                    <p className="mt-5"><b>⚡ Rule Action (IMPORTANT)</b></p>

                    <ul className="list-disc ml-5 space-y-3">

                        <li>
                            <b>🔁 Rotate</b>
                            <br />
                            Traffic is sent to attached offers
                            <ul className="list-disc ml-5">
                                <li>Uses offer weight system</li>
                                <li>Best for A/B testing</li>
                            </ul>
                        </li>

                        <li>
                            <b>⛔ Block</b>
                            <br />
                            Traffic is blocked or redirected to safe/fallback page
                            <ul className="list-disc ml-5">
                                <li>Used for bots / bad traffic</li>
                                <li>Protects ad accounts</li>
                            </ul>
                        </li>

                    </ul>

                    {/* BOT SCORE */}
                    <p className="mt-5"><b>🤖 Bot Score (CRITICAL)</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Range: 0 → 100</li>
                        <li>Lower = more likely human</li>
                        <li>Higher = bot / suspicious</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Recommended: ≤ 40 = allow traffic
                        Above 40 = block or filter
                    </div>

                    {/* MULTIPLE RULES */}
                    <p className="mt-5"><b>🧠 Multiple Rules (Advanced Logic)</b></p>

                    <p>
                        You can create multiple rules inside one campaign to control different traffic segments.
                    </p>

                    <p className="mt-2"><b>Example Setup:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Rule 1 (Priority 1): USA → Offer A
                        Rule 2 (Priority 2): India → Offer B
                        Rule 3 (Priority 3): Bots → Block
                        Rule 4 (Priority 4): Others → Fallback
                    </div>

                    <p className="mt-2">
                        System checks top → bottom and stops at first match.
                    </p>

                    {/* MULTIPLE OFFERS */}
                    <p className="mt-5"><b>🔀 Multiple Offers per Rule</b></p>

                    <p>
                        Each rule can have multiple offers attached.
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Traffic is distributed using weight</li>
                        <li>Used for testing landing pages</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Rule: India Traffic → Offer A (70%) + Offer B (30%)
                    </div>

                    {/* REAL USE CASE */}
                    <p className="mt-5"><b>🔥 Real World Example</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Rule 1: Bot Score ≤ 50 → Block
                        Rule 2: USA + Mobile → Offer A
                        Rule 3: India + Mobile → Offer B
                        Rule 4: Default → Fallback Page
                    </div>

                    {/* SUMMARY */}
                    <p className="mt-6 text-blue-400 font-medium">
                        🎯 Summary: Rules filter traffic, control routing, and protect your campaigns.
                    </p>

                </Section>

                {/* 4 */}


                {/* 5 */}
                <Section title="🛡️ Traffic Filter System (Advanced Control)" id="filters">

                    <p>
                        Traffic Filters allow you to <b>manually block or allow specific traffic</b>
                        before it even reaches your rules.
                    </p>

                    {/* FLOW */}
                    <p className="mt-4"><b>🔁 Execution Flow:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        Traffic → Filters Check → (Blocked / Allowed) → Rules → Offers
                    </div>

                    <p className="mt-3 text-yellow-400 text-sm">
                        ⚠️ Filters run BEFORE rules → highest priority control
                    </p>

                    {/* PURPOSE */}
                    <p className="mt-5"><b>🎯 Why Use Traffic Filters?</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Block bad traffic instantly</li>
                        <li>Protect ad accounts (Facebook / Google)</li>
                        <li>Remove bots / scrapers</li>
                        <li>Whitelist trusted sources</li>
                    </ul>

                    {/* FILTER TYPES */}
                    <p className="mt-5"><b>⚙️ Filter Types Explained</b></p>

                    <ul className="list-disc ml-5 space-y-4">

                        <li>
                            <b>🌐 IP Filter</b>
                            <br />
                            Block or allow specific IP addresses
                            <ul className="list-disc ml-5">
                                <li>Block competitor IP</li>
                                <li>Block suspicious repeated clicks</li>
                                <li>Allow your own IP (testing)</li>
                            </ul>

                            <div className="bg-black/40 p-2 mt-2 rounded text-green-400 text-xs">
                                Example: 192.168.1.1
                            </div>
                        </li>

                        <li>
                            <b>🌍 Domain Filter</b>
                            <br />
                            Filter traffic based on referrer domain
                            <ul className="list-disc ml-5">
                                <li>Allow only Facebook traffic</li>
                                <li>Block unknown sources</li>
                            </ul>

                            <div className="bg-black/40 p-2 mt-2 rounded text-green-400 text-xs">
                                Example: facebook.com
                            </div>
                        </li>

                        <li>
                            <b>🏢 ISP Filter</b>
                            <br />
                            Block specific internet providers
                            <ul className="list-disc ml-5">
                                <li>Block datacenter traffic (AWS, Google Cloud)</li>
                                <li>Stop VPN / hosting traffic</li>
                            </ul>

                            <div className="bg-black/40 p-2 mt-2 rounded text-green-400 text-xs">
                                Example: Amazon AWS, DigitalOcean
                            </div>
                        </li>

                        <li>
                            <b>🤖 User Agent Filter</b>
                            <br />
                            Detect bots and crawlers
                            <ul className="list-disc ml-5">
                                <li>Block Facebook crawler</li>
                                <li>Block Google bot</li>
                                <li>Block automation tools</li>
                            </ul>

                            <div className="bg-black/40 p-2 mt-2 rounded text-green-400 text-xs">
                                Example: facebookexternalhit, Googlebot
                            </div>
                        </li>

                    </ul>

                    {/* HOW TO USE */}
                    <p className="mt-5"><b>➕ How to Add Filter</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Select filter type (IP / Domain / ISP / User Agent)</li>
                        <li>Enter value</li>
                        <li>Click <b>Add Filter</b></li>
                    </ul>

                    <p className="text-gray-400 text-sm mt-2">
                        Filter becomes active immediately.
                    </p>

                    {/* BLOCK VS ALLOW */}
                    <p className="mt-5"><b>🚦 Block vs Allow Logic</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li><b>Block</b> → Traffic is rejected immediately</li>
                        <li><b>Allow</b> → Only specific traffic is allowed</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Example:
                        Allow → facebook.com
                        Block → everything else
                    </div>

                    {/* REAL USE CASE */}
                    <p className="mt-5"><b>🔥 Real Use Cases</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs space-y-1">
                        Block: AWS + DigitalOcean → remove bots
                        Block: facebookexternalhit → hide real offer
                        Allow: your IP → testing
                        Block: suspicious IPs → prevent fraud
                    </div>

                    {/* ADVANCED STRATEGY */}
                    <p className="mt-5"><b>🧠 Advanced Strategy</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Use Filters + Rules together</li>
                        <li>Filters = hard blocking layer</li>
                        <li>Rules = smart routing layer</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Best Setup:
                        Filters → Block bots
                        Rules → Route real users
                    </div>

                    {/* WARNING */}
                    <p className="mt-5 text-yellow-400 text-sm">
                        ⚠️ Avoid over-filtering — it can block real users.
                    </p>

                    {/* SUMMARY */}
                    <p className="mt-6 text-blue-400 font-medium">
                        🎯 Summary: Filters act as your first defense layer — block bad traffic before routing.
                    </p>

                </Section>

                {/* 6 */}
                <Section title="⚙️ Settings & Tracking System (Complete Guide)" id="settings">

                    <p>
                        This section allows you to configure your <b>account, tracking, traffic sources, and automation</b>.
                    </p>

                    {/* PROFILE */}
                    <p className="mt-5"><b>👤 Profile Settings</b></p>

                    <ul className="list-disc ml-5 space-y-2">
                        <li>
                            <b>Name & Email</b>
                            <br />
                            Used for account identification.
                        </li>

                        <li>
                            <b>Timezone</b>
                            <br />
                            Controls reporting & analytics time.
                            <div className="bg-black/40 p-2 mt-1 rounded text-green-400 text-xs">
                                Example: Asia/Kolkata → stats reset based on your time
                            </div>
                        </li>

                        <li>
                            <b>Webhook URL</b>
                            <br />
                            Used for sending data to external systems automatically.
                        </li>
                    </ul>

                    {/* TRAFFIC SOURCES */}
                    <p className="mt-5"><b>📊 Traffic Sources (VERY IMPORTANT)</b></p>

                    <p>
                        Traffic sources help you identify where your traffic is coming from.
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Facebook Ads</li>
                        <li>Google Ads</li>
                        <li>Native Ads</li>
                        <li>Direct traffic</li>
                    </ul>

                    <p className="mt-2"><b>➕ How to Add Source:</b></p>

                    <ul className="list-disc ml-5">
                        <li>Enter source name (example: Facebook)</li>
                        <li>Click Add</li>
                    </ul>

                    <p className="text-gray-400 text-sm">
                        Then select this source while creating campaigns.
                    </p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Campaign → Source = Facebook → helps in analytics tracking
                    </div>

                    {/* PASSWORD */}
                    <p className="mt-5"><b>🔐 Password Management</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Enter current password</li>
                        <li>Enter new password</li>
                        <li>Click Change Password</li>
                    </ul>

                    <p className="text-yellow-400 text-sm">
                        ⚠️ Use strong password to protect your campaigns
                    </p>

                    {/* API KEY */}
                    <p className="mt-5"><b>🔑 API Key System</b></p>

                    <p>
                        API key is used to connect your tracker with external platforms (affiliate networks, servers, etc).
                    </p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Click <b>Generate API Key</b></li>
                        <li>Copy and store securely</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        API Key = Authentication for tracking & postback system
                    </div>

                    <p className="text-yellow-400 text-sm">
                        ⚠️ Never share your API key publicly
                    </p>

                    {/* POSTBACK */}
                    <p className="mt-5"><b>🔗 Postback URL (Conversion Tracking)</b></p>

                    <p>
                        Postback URL is used to <b>track conversions and revenue automatically</b>.
                    </p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        {`/api/postback?api_key=YOUR_KEY&click_id={clickid}&payout={payout}`}
                    </div>

                    {/* HOW IT WORKS */}
                    <p className="mt-3"><b>🔁 How Postback Works:</b></p>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        User clicks → Tracker generates click_id
                        User converts → Affiliate network fires postback
                        System updates conversion + revenue
                    </div>

                    {/* SETUP */}
                    <p className="mt-5"><b>⚙️ How to Setup Postback</b></p>

                    <ul className="list-disc ml-5 space-y-2">

                        <li>
                            Go to your affiliate network (MaxBounty, CPA Grip, etc)
                        </li>

                        <li>
                            Find <b>Postback / S2S / Global Postback</b> section
                        </li>

                        <li>
                            Paste your postback URL
                        </li>

                        <li>
                            Replace parameters:
                            <ul className="list-disc ml-5">
                                <li>{`{clickid}`} → network click id token</li>
                                <li>{`{payout}`} → payout value</li>
                            </ul>
                        </li>

                    </ul>

                    <p className="text-gray-400 text-sm">
                        Each network uses different tokens — map them correctly.
                    </p>

                    {/* RESULT */}
                    <p className="mt-5"><b>📈 Result:</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Conversions tracked automatically</li>
                        <li>Revenue calculated</li>
                        <li>ROI optimization possible</li>
                    </ul>

                    {/* CLOAKING */}
                    <p className="mt-6"><b>🕵️ Cloaking & Protection System</b></p>

                    <p>
                        This system protects your campaigns from bots and ad platform detection.
                    </p>

                    <ul className="list-disc ml-5 space-y-2">
                        <li><b>VPN Detection</b> → blocks VPN users</li>
                        <li><b>Proxy Detection</b> → blocks proxy traffic</li>
                        <li><b>Tor Blocking</b> → blocks anonymous networks</li>
                        <li><b>Datacenter Detection</b> → blocks AWS, Google Cloud</li>
                        <li><b>Headless Detection</b> → blocks automation bots</li>
                        <li><b>Canvas Fingerprint</b> → detects advanced bots</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs mt-2">
                        Real User → Offer
                        Bot / Suspicious → Safe Page
                    </div>

                    {/* BEST PRACTICE */}
                    <p className="mt-5"><b>🔥 Best Practice Setup</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Enable all protection options</li>
                        <li>Use Proxy Mode for ads</li>
                        <li>Use filters to block known bad traffic</li>
                        <li>Use rules for smart routing</li>
                    </ul>

                    {/* SUMMARY */}
                    <p className="mt-6 text-blue-400 font-medium">
                        🎯 Summary: Settings control your tracking, security, and automation — configure carefully for best performance.
                    </p>

                </Section>

                {/* 7 */}
                <Section title="📜 Scripts Integration (Advanced Setup Guide)" id="scripts">

                    <p><b>Scripts are the core execution layer</b> of TrafficIntel AI.
                        They control how traffic is intercepted, filtered, and redirected based on your campaign + rules.</p>

                    <p>Every campaign provides multiple script types depending on your setup:</p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li><b>AUTO / HYBRID</b> → Recommended (Best balance: speed + cloaking)</li>
                        <li><b>PHP</b> → Server-side redirect (strong cloaking)</li>
                        <li><b>JS</b> → Client-side redirect (easy, but weaker protection)</li>
                        <li><b>IFRAME</b> → Hidden cloaking layer</li>
                        <li><b>WP</b> → WordPress integration</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>📍 Where you get scripts?</b></p>
                    <p>Go to: <b>Campaign Manager → Actions → Scripts</b></p>
                    <p>Each campaign generates its own script (linked to rules + offers).</p>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🔥 SCRIPT TYPES EXPLAINED</b></p>

                    <p><b>1. AUTO / HYBRID (Recommended)</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Combination of server + client logic</li>
                        <li>Fast redirect + strong cloaking</li>
                        <li>Best for Facebook / Google Ads</li>
                        <li>Automatically handles bot filtering</li>
                    </ul>

                    <p><b>👉 Where to place:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Landing page <b>&lt;head&gt;</b> (TOP priority)</li>
                        <li>OR directly in main PHP file before output</li>
                    </ul>

                    <p><b>Result:</b>
                        User hits page → Script executes → TrafficIntel decides → Redirect instantly</p>

                    <hr className="my-3 border-gray-700" />

                    <p><b>2. PHP (Strong Cloaking)</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Runs on server before page loads</li>
                        <li>Best bot protection</li>
                        <li>Invisible to ad networks</li>
                    </ul>

                    <p><b>👉 Where to place:</b></p>
                    <ul className="list-disc ml-5">
                        <li><b>index.php</b> (TOP of file)</li>
                        <li>Before any HTML output</li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        {`<?php include("tracker.php"); ?>`}
                    </div>

                    <p><b>Result:</b>
                        Bot → Safe Page
                        Real User → Offer</p>

                    <hr className="my-3 border-gray-700" />

                    <p><b>3. JavaScript (JS)</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Runs in browser</li>
                        <li>Easy to install</li>
                        <li>Lower cloaking strength</li>
                    </ul>

                    <p><b>👉 Where to place:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Inside <b>&lt;head&gt;</b> OR before <b>&lt;/body&gt;</b></li>
                    </ul>

                    <div className="bg-black/40 p-3 rounded text-green-400 text-xs">
                        {`<script src="https://your-domain.com/tracker.js"></script>`}
                    </div>

                    <p><b>Use when:</b></p>
                    <ul className="list-disc ml-5">
                        <li>No server access</li>
                        <li>Simple tracking needed</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>4. IFRAME Mode</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Loads offer inside iframe</li>
                        <li>Used for soft cloaking</li>
                        <li>Sometimes used for prelanders</li>
                    </ul>

                    <p><b>👉 Where to place:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Inside <b>&lt;body&gt;</b> of landing page</li>
                    </ul>

                    <p><b>Note:</b> Not recommended for strict ad platforms</p>

                    <hr className="my-3 border-gray-700" />

                    <p><b>5. WordPress (WP)</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Use in theme header</li>
                        <li>OR plugin (Header/Footer scripts)</li>
                    </ul>

                    <p><b>👉 Where to place:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Appearance → Theme Editor → <b>header.php</b></li>
                        <li>Paste inside <b>&lt;head&gt;</b></li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>⚡ PERFORMANCE vs PROTECTION</b></p>

                    <ul className="list-disc ml-5">
                        <li>Fastest → JS</li>
                        <li>Balanced → HYBRID ✅</li>
                        <li>Strongest Protection → PHP 🔥</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🧠 HOW FLOW WORKS</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>User clicks ad</li>
                        <li>Landing page loads</li>
                        <li>Script executes</li>
                        <li>Traffic sent to Rule Engine</li>
                        <li>Decision taken:</li>
                    </ul>

                    <ul className="list-disc ml-8">
                        <li>✅ Real → Offer</li>
                        <li>🤖 Bot → Safe Page</li>
                        <li>⚠️ Invalid → Fallback</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🚨 IMPORTANT RULES</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Script must load BEFORE any redirect</li>
                        <li>Do NOT mix multiple script types</li>
                        <li>Always test with VPN ON/OFF</li>
                        <li>Use HTTPS domain (important for ads)</li>
                    </ul>

                    <p><b>💡 PRO TIP:</b>
                        Use <b>HYBRID script</b> + <b>Proxy Mode</b> = Maximum cloaking power 🚀</p>

                </Section>

                {/* 8 */}
                <Section title="📊 Traffic Logs & Analytics (Advanced Insights)" id="logs">

                    <p><b>This is your control center</b> — every click, every decision, every conversion is tracked here.</p>

                    <p>Using Logs + Analytics, you can:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Understand user behavior</li>
                        <li>Detect bots & bad traffic</li>
                        <li>Optimize ROI & profit</li>
                        <li>Scale winning campaigns</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>📍 1. Traffic Logs (Raw Data Level)</b></p>

                    <p>Every click is recorded with full details.</p>

                    <p><b>Each log contains:</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>IP Address</li>
                        <li>Country / City</li>
                        <li>Device (mobile / desktop)</li>
                        <li>Browser & OS</li>
                        <li>ISP / ASN</li>
                        <li>Referrer</li>
                        <li>Bot Score</li>
                        <li>Matched Rule</li>
                        <li>Final Action (Offer / Block / Fallback)</li>
                    </ul>

                    <p><b>🟢 Status Meaning:</b></p>
                    <ul className="list-disc ml-5">
                        <li><b>PASS</b> → Real user → sent to offer</li>
                        <li><b>BLOCK</b> → Bot / VPN / Proxy → blocked or safe page</li>
                        <li><b>FALLBACK</b> → No rule matched → fallback URL</li>
                    </ul>

                    <p><b>🔥 What you can DO from logs:</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Block specific IPs manually</li>
                        <li>Identify bad ISPs / ASN → add to rules</li>
                        <li>Detect bot patterns (same IP, same UA)</li>
                        <li>Analyze which traffic is wasting money</li>
                    </ul>

                    <p><b>💡 Example:</b></p>
                    <p>If same IP clicking 100 times → BLOCK it</p>

                    <hr className="my-3 border-gray-700" />

                    <p><b>📊 2. Dashboard Overview (Quick Stats)</b></p>

                    <p>Dashboard gives a quick summary of performance:</p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Total Clicks</li>
                        <li>PASS Traffic (real users)</li>
                        <li>BLOCKED Traffic (bots)</li>
                        <li>Offers count</li>
                        <li>Rules count</li>
                    </ul>

                    <p><b>Use this to:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Quickly see if campaign is healthy</li>
                        <li>Check bot % vs real traffic</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>📈 3. Analytics (Decision Level Data)</b></p>

                    <p>This is where you make money decisions.</p>

                    <p><b>Analytics shows:</b></p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Clicks over time (daily / hourly)</li>
                        <li>Top countries</li>
                        <li>Device breakdown</li>
                        <li>Best performing offers</li>
                        <li>Conversion tracking</li>
                    </ul>

                    <p><b>🔥 Advanced Metrics:</b></p>

                    <ul className="list-disc ml-5 space-y-2">

                        <li>
                            <b>EPC (Earnings Per Click)</b><br />
                            = Total Revenue / Total Clicks<br />
                            👉 Shows how much you earn per visitor
                        </li>

                        <li>
                            <b>ROI (Return on Investment)</b><br />
                            = (Revenue - Cost) / Cost × 100<br />
                            👉 Tells if campaign is profitable or loss
                        </li>

                        <li>
                            <b>RPC (Revenue Per Click)</b><br />
                            👉 Similar to EPC (used in affiliate systems)
                        </li>

                    </ul>

                    <p><b>💡 Example:</b></p>
                    <ul className="list-disc ml-5">
                        <li>100 clicks → $50 revenue → EPC = $0.5</li>
                        <li>If cost = $30 → ROI = 66% profit</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🏆 Offer Performance Tracking</b></p>

                    <p>You can see:</p>
                    <ul className="list-disc ml-5 space-y-1">
                        <li>Which offer is getting more clicks</li>
                        <li>Which offer converts best</li>
                        <li>Which offer has highest EPC</li>
                    </ul>

                    <p><b>👉 Use case:</b></p>
                    <ul className="list-disc ml-5">
                        <li>Remove low-performing offers</li>
                        <li>Increase weight of high-performing offers</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🧠 How to Optimize Campaign</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>High BLOCK % → improve traffic source</li>
                        <li>Low EPC → change offer</li>
                        <li>Bad country → block in rules</li>
                        <li>Good device → target more</li>
                    </ul>

                    <hr className="my-3 border-gray-700" />

                    <p><b>🚀 Pro Strategy</b></p>

                    <ul className="list-disc ml-5 space-y-1">
                        <li>Check logs daily</li>
                        <li>Block bad IPs / ASN</li>
                        <li>Scale high EPC offers</li>
                        <li>Adjust rules based on real data</li>
                    </ul>

                    <p><b>👉 Goal:</b>
                        Send ONLY high-quality traffic to offers and maximize profit.</p>

                </Section>

            </div>

        </div>
    );
}