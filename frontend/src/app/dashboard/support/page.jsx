"use client";

export default function ContactPage() {
    return (
        <div className="min-h-screen px-6 py-14 bg-[#f5f7fb]">

            <div className="max-w-6xl mx-auto">

                {/* TOP */}
                <div className="text-center mb-14">

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium border border-indigo-100 mb-5">
                        🚀 Fast Human Support
                    </div>

                    <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-4">
                        Contact Support
                    </h1>

                    <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Get help with campaigns, billing, integrations, traffic filtering,
                        and platform setup from our support team.
                    </p>

                </div>

                {/* MAIN GRID */}
                <div className="grid lg:grid-cols-2 gap-7">

                    {/* TELEGRAM */}
                    <a
                        href="https://t.me/trafficintelai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                        group
                        bg-white
                        rounded-3xl
                        p-8
                        border border-gray-200
                        shadow-sm
                        hover:shadow-xl
                        hover:-translate-y-1
                        transition-all duration-300
                    "
                    >

                        <div className="
                        w-16 h-16 rounded-2xl
                        bg-indigo-50
                        flex items-center justify-center
                        text-3xl mb-6
                    ">
                            ✈️
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Telegram Support
                        </h2>

                        <p className="text-gray-500 leading-relaxed mb-8">
                            Fastest response for urgent campaign issues,
                            traffic problems, setup help, and account support.
                        </p>

                        <div className="flex items-center justify-between">

                            <div>
                                <div className="text-sm text-gray-400 mb-1">
                                    Telegram
                                </div>

                                <div className="text-indigo-600 font-semibold text-lg">
                                    @trafficintelai
                                </div>
                            </div>

                            <div className="
                            px-5 py-2 rounded-xl
                            bg-indigo-600 
                            text-white font-medium
                            shadow-sm
                            group-hover:scale-105
                            transition
                        ">
                                Open Chat
                            </div>

                        </div>

                    </a>

                    {/* EMAIL */}
                    <div className="
                    bg-white
                    rounded-3xl
                    p-8
                    border border-gray-200
                    shadow-sm
                    hover:shadow-xl
                    transition-all duration-300
                ">

                        <div className="
                        w-16 h-16 rounded-2xl
                        bg-indigo-50
                        flex items-center justify-center
                        text-3xl mb-6
                    ">
                            📧
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-3">
                            Email Support
                        </h2>

                        <p className="text-gray-500 leading-relaxed mb-8">
                            Contact us for billing, business inquiries,
                            integrations, and technical assistance.
                        </p>

                        <div className="space-y-5">

                            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                <span className="text-gray-500">Support</span>

                                <span className="font-semibold text-gray-900">
                                    support@trafficintelai.com
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                <span className="text-gray-500">Business</span>

                                <span className="font-semibold text-gray-900">
                                    partnerships@trafficintelai.com
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-gray-500">Response Time</span>

                                <span className="font-semibold text-green-600">
                                    Usually within 24h
                                </span>
                            </div>

                        </div>

                    </div>

                </div>

                {/* EXTRA CARDS */}
                <div className="grid md:grid-cols-3 gap-6 mt-8">

                    <div className="
                    bg-white rounded-2xl p-6
                    border border-gray-200
                    shadow-sm hover:shadow-lg transition
                ">
                        <div className="text-3xl mb-4">🛡️</div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Traffic Protection
                        </h3>

                        <p className="text-gray-500 text-sm leading-relaxed">
                            Help with bot filtering, cloaking setup,
                            rules, and safe page protection.
                        </p>
                    </div>

                    <div className="
                    bg-white rounded-2xl p-6
                    border border-gray-200
                    shadow-sm hover:shadow-lg transition
                ">
                        <div className="text-3xl mb-4">⚡</div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Fast Response
                        </h3>

                        <p className="text-gray-500 text-sm leading-relaxed">
                            Quick support for campaign issues,
                            redirects, integrations, and setup.
                        </p>
                    </div>

                    <div className="
                    bg-white rounded-2xl p-6
                    border border-gray-200
                    shadow-sm hover:shadow-lg transition
                ">
                        <div className="text-3xl mb-4">💳</div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Billing Help
                        </h3>

                        <p className="text-gray-500 text-sm leading-relaxed">
                            Subscription upgrades, invoices,
                            payments, and account assistance.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}