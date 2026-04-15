"use client";

export default function ContactPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

            {/* BACKGROUND GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

            <div className="relative z-10 max-w-4xl w-full px-6">

                {/* CARD */}
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-2xl text-center">

                    {/* TITLE */}
                    <h1 className="text-4xl font-bold mb-4">
                        Contact Us 📩
                    </h1>

                    <p className="text-gray-400 mb-10 max-w-2xl mx-auto">
                        Have questions or need assistance? Our support team is here to help you with any queries regarding your account, billing, or platform usage.
                    </p>

                    {/* CONTACT GRID */}
                    <div className="grid md:grid-cols-2 gap-8 text-left">

                        {/* EMAIL */}
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <h2 className="font-semibold text-lg mb-2">📧 Email Support</h2>
                            <p className="text-gray-400 text-sm">
                                support@trafficintelai.com
                            </p>
                        </div>

                        {/* RESPONSE TIME */}
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <h2 className="font-semibold text-lg mb-2">⏱ Response Time</h2>
                            <p className="text-gray-400 text-sm">
                                Usually within 24 hours
                            </p>
                        </div>

                        {/* BUSINESS */}
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <h2 className="font-semibold text-lg mb-2">🏢 Business Inquiries</h2>
                            <p className="text-gray-400 text-sm">
                                partnerships@trafficintelai.com
                            </p>
                        </div>

                        {/* SUPPORT TYPE */}
                        <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                            <h2 className="font-semibold text-lg mb-2">💬 Support Scope</h2>
                            <p className="text-gray-400 text-sm">
                                Account, billing, and technical assistance
                            </p>
                        </div>

                    </div>

                    {/* NOTE */}
                    <div className="mt-12 text-sm text-gray-500">
                        We are committed to providing reliable support and ensuring a smooth experience for all users.
                    </div>

                </div>

            </div>
        </div>
    );
}