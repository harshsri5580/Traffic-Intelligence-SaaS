"use client";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 px-6 py-12">

            <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow">

                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

                <p className="text-gray-600 mb-6">
                    Last updated: 2026
                </p>

                <p className="mb-6 text-gray-700">
                    This Privacy Policy explains how we collect, use, and protect your information when you use our platform.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
                <p className="text-gray-700 mb-4">
                    We may collect basic information such as your name, email address, and account details when you register.
                    We also collect usage data such as interactions, device information, and general analytics to improve our services.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">2. How We Use Information</h2>
                <p className="text-gray-700 mb-4">
                    We use collected information to provide, maintain, and improve our platform. This includes enhancing user experience,
                    analyzing performance, and delivering relevant insights.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">3. Cookies & Tracking</h2>
                <p className="text-gray-700 mb-4">
                    We may use cookies and similar technologies to understand usage patterns and improve functionality.
                    These technologies help us deliver a better and more personalized experience.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
                <p className="text-gray-700 mb-4">
                    We take reasonable steps to protect your data using modern security practices.
                    However, no system is completely secure, and we cannot guarantee absolute security.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">5. Third-Party Services</h2>
                <p className="text-gray-700 mb-4">
                    We may use third-party services such as payment providers or analytics tools to operate our platform.
                    These providers have their own privacy policies governing the use of your information.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">6. User Rights</h2>
                <p className="text-gray-700 mb-4">
                    You may request access, update, or deletion of your personal information by contacting us.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">7. Changes to This Policy</h2>
                <p className="text-gray-700 mb-4">
                    We may update this Privacy Policy from time to time. Changes will be reflected on this page.
                </p>

                {/* SECTION */}
                <h2 className="text-xl font-semibold mt-6 mb-3">8. Contact Us</h2>
                <p className="text-gray-700">
                    If you have any questions about this Privacy Policy, you can contact us at:
                    <br />
                    <span className="font-medium">support@yourdomain.com</span>
                </p>

            </div>

        </div>
    );
}