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

                {/* BAN REPORT */}
                <div className="
mt-8
bg-gradient-to-r
from-red-50
to-orange-50
border border-red-100
rounded-3xl
p-8
shadow-sm
">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        <div>

                            <div className="text-4xl mb-4">
                                🚨
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Report a Ban
                            </h2>

                            <p className="text-gray-600 max-w-2xl leading-relaxed">
                                If your advertising account, campaign, or business manager
                                gets restricted or banned, send us the details so we can
                                review suspicious traffic, possible reviewer activity,
                                and improve platform protection.
                            </p>

                        </div>

                        <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=support@trafficintelai.com&su=Ban%20Report&body=Campaign:%0ATraffic%20Source:%0ABan%20Reason:%0ATime:%0AClick%20ID:%0AScreenshot:`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
            inline-flex items-center justify-center
            px-7 py-4
            rounded-2xl
            bg-red-500
            hover:bg-red-600
            text-white
            font-semibold
            shadow-sm
            transition
            whitespace-nowrap
        "
                        >
                            Submit Ban Report
                        </a>

                    </div>

                </div>

                {/* FEEDBACK */}
                <div className="
mt-8
bg-gradient-to-r
from-indigo-50
to-blue-50
border border-indigo-100
rounded-3xl
p-8
shadow-sm
">

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                        <div>

                            <div className="text-4xl mb-4">
                                💡
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                Suggest Features & Improvements
                            </h2>

                            <p className="text-gray-600 max-w-2xl leading-relaxed">
                                TrafficIntelAI is actively evolving. Share feature requests,
                                UI improvements, bug reports, or ideas that could make the
                                platform better for your campaigns.
                            </p>

                        </div>

                        <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=support@trafficintelai.com&su=Feature%20Request%20%2F%20Feedback&body=Feature%20Idea:%0A%0AProblem:%0A%0AExpected%20Behavior:%0A%0AScreenshot%20(Optional):`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="
            inline-flex items-center justify-center
            px-7 py-4
            rounded-2xl
            bg-indigo-600
            hover:bg-indigo-700
            text-white
            font-semibold
            shadow-sm
            transition
            whitespace-nowrap
        "
                        >
                            Send Feedback
                        </a>

                    </div>

                </div>

            </div>
        </div>
    );
}