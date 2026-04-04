import MarketingLayout from "@/components/MarketingLayout";

const BRAND = "Travel Agency Website & Software Solution";

const Privacy = () => (
  <MarketingLayout
    title={`Privacy Policy — ${BRAND}`}
    description={`Read the ${BRAND} privacy policy. Learn how we collect, use, and protect your data.`}
  >
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: April 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-white/60 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Introduction</h2>
            <p>{BRAND} ("we", "our", "us") is a multi-tenant travel agency management platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Information We Collect</h2>
            <p><strong className="text-white/80">Account Information:</strong> When you register, we collect your name, email address, phone number, company name, and password.</p>
            <p><strong className="text-white/80">Business Data:</strong> Client records, booking details, invoices, payment records, vendor information, and other operational data you enter into the platform.</p>
            <p><strong className="text-white/80">Traveler Information:</strong> Passport details, travel documents, and personal information of travelers managed through your agency. This data is stored on behalf of your agency and is your responsibility to collect with proper consent.</p>
            <p><strong className="text-white/80">Usage Data:</strong> We automatically collect information about how you interact with the platform, including pages visited, features used, and session duration.</p>
            <p><strong className="text-white/80">Payment Information:</strong> Subscription payment details such as transaction IDs and payment method. We do not store full credit card numbers.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and maintain the platform</li>
              <li>Process your subscription and billing</li>
              <li>Send transactional notifications (booking confirmations, payment receipts)</li>
              <li>Improve platform features and user experience</li>
              <li>Provide customer support</li>
              <li>Ensure platform security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Data Isolation & Multi-Tenancy</h2>
            <p>Each agency on our platform operates in a completely isolated workspace. Your business data (clients, bookings, invoices, vendor information) is never accessible to other agencies or tenants on the platform. Super-admin access is limited to platform management and does not include access to your operational data content.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Data Sharing</h2>
            <p>We do not sell your data. We may share information with:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white/80">Payment Processors:</strong> SSLCommerz, bKash, or other payment gateways to process subscription payments</li>
              <li><strong className="text-white/80">SMS/Email Providers:</strong> To deliver notifications you configure</li>
              <li><strong className="text-white/80">Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Data Security</h2>
            <p>We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication with hashed passwords, regular backups, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Data Retention</h2>
            <p>We retain your data as long as your account is active. If you cancel your subscription, your data will be retained for 90 days before permanent deletion. You can request earlier deletion by contacting support.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Your Rights</h2>
            <p>You have the right to access, correct, export, or delete your personal data. You can export most data through the platform's built-in export features. For account deletion or data requests, contact us at support@travelagencyweb.com.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of significant changes via email. Continued use of the platform after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contact</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
            <p>Email: support@travelagencyweb.com<br />Phone: +880 1234-567890<br />Address: Dhaka, Bangladesh</p>
          </section>
        </div>
      </div>
    </section>
  </MarketingLayout>
);

export default Privacy;