export const metadata = {
    title: "Refund Policy - FlowIntel",
    description: "Refund policy for FlowIntel SaaS platform",
};

export default function RefundPage() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-16 text-gray-800">

            <h1 className="text-3xl font-bold mb-6">Refund Policy</h1>

            <p className="mb-4">
                At FlowIntel, we aim to provide a reliable and valuable analytics platform.
                If you are not satisfied with your purchase, please review our refund policy below.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">1. Eligibility for Refund</h2>
            <p className="mb-4">
                We offer a 7-day refund period for new subscriptions. If you are not satisfied
                with the service, you may request a refund within 7 days from the date of purchase.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">2. Non-Refundable Cases</h2>
            <p className="mb-4">
                Refunds will not be provided after the 7-day refund window has passed. Additionally,
                partial usage of services or misuse of the platform may not qualify for refunds.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">3. Subscription Cancellation</h2>
            <p className="mb-4">
                You can cancel your subscription at any time. Upon cancellation, your plan will
                remain active until the end of the current billing cycle, after which no further
                charges will be applied.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">4. How to Request a Refund</h2>
            <p className="mb-4">
                To request a refund, please contact our support team with your account details
                and reason for the request.
            </p>

            <p className="mb-4">
                📧 Email: support@flowintel.com
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">5. Processing Time</h2>
            <p className="mb-4">
                Approved refunds will be processed within 5–10 business days, depending on your
                payment provider.
            </p>

            <h2 className="text-xl font-semibold mt-8 mb-2">6. Changes to Policy</h2>
            <p className="mb-4">
                FlowIntel reserves the right to update or modify this refund policy at any time.
                Changes will be reflected on this page.
            </p>

            <p className="text-sm text-gray-500 mt-10">
                Last updated: 2026
            </p>

        </div>
    );
}