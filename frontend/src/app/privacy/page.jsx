"use client";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen flex justify-center relative overflow-hidden">

            {/* BACKGROUND GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent blur-3xl"></div>

            <div className="relative z-10 max-w-4xl w-full px-6 py-16">

                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-2xl">

                    {/* TITLE */}
                    <h1 className="text-4xl font-bold mb-4">
                        Privacy Policy 🔐
                    </h1>

                    <p className="text-gray-400 mb-8">
                        Last updated: 2026
                    </p>

                    <p className="text-gray-300 mb-8 leading-relaxed">
                        This Privacy Policy explains how TrafficIntel AI collects, uses, and protects your information when you use our platform.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">1. Information We Collect</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We collect basic account information such as your name and email address. We also collect usage data including device information, interaction data, and general analytics to improve platform performance.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">2. How We Use Information</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Information is used to provide, maintain, and improve our services. This includes enhancing user experience, analyzing performance, and delivering relevant insights.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">3. Cookies & Tracking</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We use cookies and similar technologies to understand usage patterns and improve functionality. These technologies help provide a better and more personalized experience.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">4. Data Security</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We implement industry-standard security practices to protect your data. However, no system is completely secure and absolute security cannot be guaranteed.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">5. Third-Party Services</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We may use third-party providers such as payment processors and analytics tools. These services operate under their own privacy policies.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">6. User Rights</h2>
                    <p className="text-gray-400 leading-relaxed">
                        You may request access, correction, or deletion of your personal data by contacting us.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">7. Updates to This Policy</h2>
                    <p className="text-gray-400 leading-relaxed">
                        This policy may be updated periodically. Changes will be reflected on this page.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">8. Contact Us</h2>
                    <p className="text-gray-400 leading-relaxed">
                        If you have any questions, contact us at:
                        <br />
                        <span className="text-indigo-400 font-medium">
                            support@trafficintelai.com
                        </span>
                    </p>

                </div>

            </div>
        </div>
    );
}