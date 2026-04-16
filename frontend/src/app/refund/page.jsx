export const metadata = {
    title: "Refund Policy - TrafficIntel AI",
    description: "Refund policy for TrafficIntel AI platform",
};

export default function RefundPage() {
    return (
        <div className="min-h-screen flex justify-center relative overflow-hidden">

            {/* BACKGROUND */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>

            {/* GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl"></div>

            <div className="relative z-10 max-w-4xl w-full px-6 py-16">

                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-2xl border border-white/10 shadow-2xl">

                    {/* TITLE */}
                    <h1 className="text-4xl font-bold mb-4 text-white">
                        Refund Policy 💳
                    </h1>

                    <p className="text-gray-300 mb-8">
                        Last updated: 2026
                    </p>

                    <p className="text-gray-200 mb-8 leading-relaxed">
                        At TrafficIntel AI, we aim to provide a reliable and high-quality platform.
                        Please review our refund policy carefully before making a purchase.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        1. Refund Eligibility
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        We offer a 15-day refund period for new subscriptions. If you are not satisfied,
                        you may request a refund within 15 days of your initial purchase.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        2. Non-Refundable Cases
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        Refunds are not available after the 15-day period. Accounts with excessive usage,
                        abuse of the platform, or violation of terms may not qualify for refunds.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        3. Subscription Cancellation
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        You may cancel your subscription at any time. Your plan will remain active
                        until the end of the billing cycle, after which no further charges will apply.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        4. How to Request a Refund
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        To request a refund, contact our support team with your account details
                        and reason for the request.
                    </p>

                    <p className="text-indigo-400 mt-2 font-medium">
                        📧 support@trafficintelai.com
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        5. Processing Time
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        Approved refunds are processed within 10–15 business days, depending on your payment provider.
                    </p>

                    {/* SECTION */}
                    <h2 className="text-xl font-semibold mt-8 mb-3 text-white">
                        6. Policy Updates
                    </h2>
                    <p className="text-gray-300 leading-relaxed">
                        We may update this policy from time to time. Any changes will be reflected on this page.
                    </p>

                </div>

            </div>
        </div>
    );
}