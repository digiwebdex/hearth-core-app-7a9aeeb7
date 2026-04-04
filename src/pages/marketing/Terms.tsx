import MarketingLayout from "@/components/MarketingLayout";

const BRAND = "Travel Agency Website & Software Solution";

const Terms = () => (
  <MarketingLayout
    title={`Terms of Service — ${BRAND}`}
    description={`Read the ${BRAND} terms of service. Understand the rules and guidelines for using our travel agency management platform.`}
  >
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: April 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-white/60 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using {BRAND} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Description of Service</h2>
            <p>{BRAND} is a multi-tenant software-as-a-service (SaaS) platform for travel agency management. The Platform provides tools for lead management, quotation building, booking operations, invoicing, payment tracking, vendor management, team collaboration, and reporting.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Account Registration</h2>
            <p>To use the Platform, you must register an account with accurate information. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Each agency operates as a separate tenant with isolated data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Subscription & Billing</h2>
            <p>The Platform offers multiple subscription plans with varying features and limits. Paid plans include a 14-day free trial. After the trial period, you will be billed according to your selected plan and billing cycle (monthly or yearly). Prices are in Bangladeshi Taka (BDT) unless otherwise stated.</p>
            <p>You may upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of the current billing cycle. Refunds are not provided for partial billing periods unless required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to other tenants' data</li>
              <li>Interfere with or disrupt the Platform's infrastructure</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Resell access to the Platform without written consent</li>
              <li>Use the Platform to store or transmit content that violates any applicable law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Data Ownership</h2>
            <p>You retain ownership of all data you enter into the Platform, including client records, booking details, financial data, and documents. We do not claim ownership of your business data. You grant us a limited license to process and store this data solely for the purpose of providing the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Service Availability</h2>
            <p>We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance will be communicated in advance when possible. We are not liable for any losses resulting from temporary service unavailability.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, {BRAND} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, business opportunities, or goodwill, arising from your use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Termination</h2>
            <p>Either party may terminate the agreement at any time. You can cancel your subscription from your account settings. We may suspend or terminate your account if you violate these terms. Upon termination, your data will be retained for 90 days before permanent deletion.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Changes to Terms</h2>
            <p>We may modify these Terms of Service at any time. Material changes will be communicated via email to registered users. Continued use of the Platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">11. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes arising from these terms shall be resolved in the courts of Dhaka, Bangladesh.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">12. Contact</h2>
            <p>For questions about these Terms of Service, contact us at:</p>
            <p>Email: support@travelagencyweb.com<br />Phone: +880 1234-567890<br />Address: Dhaka, Bangladesh</p>
          </section>
        </div>
      </div>
    </section>
  </MarketingLayout>
);

export default Terms;