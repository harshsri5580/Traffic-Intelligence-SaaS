"use client";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 px-6 py-12">

            <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow">

                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

                <p className="text-gray-600 mb-6">
                    Last updated: 2026
                </p>

                <p className="mb-6 text-gray-700">
                    By accessing or using our platform, you agree to comply with these Terms of Service.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">1. Use of Service</h2>
                <p className="text-gray-700 mb-4">
                    Our platform provides analytics and performance insights tools. You agree to use the service only for lawful purposes
                    and in accordance with applicable regulations.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">2. Account Responsibility</h2>
                <p className="text-gray-700 mb-4">
                    You are responsible for maintaining the confidentiality of your account and any activities under your account.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">3. Acceptable Use</h2>
                <p className="text-gray-700 mb-4">
                    You agree not to misuse the platform, interfere with its operation, or use it for unlawful, harmful, or misleading activities.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">4. Payments & Billing</h2>
                <p className="text-gray-700 mb-4">
                    Certain features may require a paid subscription. By purchasing a plan, you agree to the pricing and billing terms presented at checkout.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">5. Cancellation & Refunds</h2>
                <p className="text-gray-700 mb-4">
                    You may cancel your subscription at any time. Refunds, if applicable, will be handled according to our billing policies.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">6. Data & Privacy</h2>
                <p className="text-gray-700 mb-4">
                    Your use of the platform is also governed by our Privacy Policy. We take reasonable steps to protect your data.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">7. Service Availability</h2>
                <p className="text-gray-700 mb-4">
                    We strive to maintain uptime and reliability but do not guarantee uninterrupted service.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">8. Limitation of Liability</h2>
                <p className="text-gray-700 mb-4">
                    We are not liable for any indirect, incidental, or consequential damages resulting from the use of our platform.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">9. Changes to Terms</h2>
                <p className="text-gray-700 mb-4">
                    We may update these terms from time to time. Continued use of the service constitutes acceptance of the updated terms.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">10. Contact</h2>
                <p className="text-gray-700">
                    For questions regarding these Terms, contact us at:
                    <br />
                    <span className="font-medium">support@yourdomain.com</span>
                </p>

            </div>

        </div>
    );
}