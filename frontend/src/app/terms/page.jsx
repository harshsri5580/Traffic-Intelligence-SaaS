"use client";

export default function TermsOfService() {
    return (
        <div className="min-h-screen flex justify-center relative overflow-hidden">

            {/* BACKGROUND GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent blur-3xl"></div>

            <div className="relative z-10 max-w-4xl w-full px-6 py-16">

                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-2xl">

                    {/* TITLE */}
                    <h1 className="text-4xl font-bold mb-4">
                        Terms of Service 📄
                    </h1>

                    <p className="text-gray-400 mb-8">
                        Last updated: 2026
                    </p>

                    <p className="text-gray-300 mb-8 leading-relaxed">
                        This website is operated by Traffic Intelligence SaaS. <br /><br />
                        By accessing or using TrafficIntel AI, you agree to comply with these Terms of Service.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">1. Use of Service</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Our platform provides analytics and traffic optimization tools. You agree to use the service only for lawful purposes and in compliance with applicable regulations.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">2. Account Responsibility</h2>
                    <p className="text-gray-400 leading-relaxed">
                        You are responsible for maintaining the confidentiality of your account and for all activities under your account.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">3. Acceptable Use</h2>
                    <p className="text-gray-400 leading-relaxed">
                        You agree not to misuse the platform, interfere with its operation, or use it for unlawful, harmful, or misleading activities.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">4. Payments & Billing</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Some features require a paid subscription. By purchasing, you agree to the pricing and billing terms presented at checkout.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">5. Cancellation & Refunds</h2>
                    <p className="text-gray-400 leading-relaxed">
                        You may cancel your subscription at any time. Refunds, if applicable, will be handled according to our Refund Policy.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">6. Data & Privacy</h2>
                    <p className="text-gray-400 leading-relaxed">
                        Your use of the platform is also governed by our Privacy Policy. We take reasonable steps to protect your data.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">7. Service Availability</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We aim to maintain high availability but do not guarantee uninterrupted service at all times.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">8. Limitation of Liability</h2>
                    <p className="text-gray-400 leading-relaxed">
                        We are not liable for indirect or consequential damages resulting from the use of our platform.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">9. Updates to Terms</h2>
                    <p className="text-gray-400 leading-relaxed">
                        These terms may be updated periodically. Continued use of the service indicates acceptance of the updated terms.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3">10. Contact</h2>
                    <p className="text-gray-400 leading-relaxed">
                        For any questions regarding these Terms, contact us at:
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