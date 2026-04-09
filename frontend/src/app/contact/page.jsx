"use client";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50 px-6 py-12">

            <div className="max-w-3xl mx-auto bg-white p-10 rounded-xl shadow text-center">

                <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

                <p className="text-gray-600 mb-10">
                    Need help or have questions? Our support team is here to assist you.
                    Reach out to us through any of the channels below.
                </p>

                <div className="space-y-6 text-gray-700">

                    <div>
                        <h2 className="font-semibold text-lg">📧 Email Support</h2>
                        <p>support@yourdomain.com</p>
                    </div>

                    <div>
                        <h2 className="font-semibold text-lg">🐦 Twitter</h2>
                        <p>@yourhandle</p>
                    </div>

                    <div>
                        <h2 className="font-semibold text-lg">💬 Skype</h2>
                        <p>live:your.skype.id</p>
                    </div>

                    <div>
                        <h2 className="font-semibold text-lg">🧑‍💻 Microsoft Teams</h2>
                        <p>support@yourdomain.com</p>
                    </div>

                </div>

                <div className="mt-12 text-sm text-gray-500">
                    We typically respond within 24 hours.
                </div>

            </div>

        </div>
    );
}