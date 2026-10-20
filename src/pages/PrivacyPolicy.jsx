import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Privacy Policy"
        path="/privacy"
        description="BrandClothzy privacy policy. Learn how we collect, use, and protect your personal information."
        keywords="BrandClothzy privacy policy, data protection, personal information"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Privacy Policy</span>
        </nav>

        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="font-serif text-4xl text-luxury-charcoal mb-2">Privacy Policy</h1>
          <p className="text-sm text-neutral-400 font-light mb-12">Last updated: May 4, 2026</p>
          <p className="text-sm text-neutral-500 font-light mb-8">This website, BrandClothzy, belongs to Burptech Private Limited.</p>

          <div className="space-y-10 text-sm text-neutral-500 font-light leading-relaxed">
            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">1. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, including:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Name, email address, phone number, and shipping address when placing an order</li>
                <li>Payment information (processed securely via PCI-DSS compliant payment gateways)</li>
                <li>Communications you send to us, including customer service enquiries</li>
                <li>Account information if you create an account with us</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>To process and fulfil your orders</li>
                <li>To communicate with you about your orders and account</li>
                <li>To send you marketing communications (with your consent)</li>
                <li>To improve our website, products, and services</li>
                <li>To detect and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">3. Information Sharing</h2>
              <p>We do not sell, rent, or trade your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, processing payments, and delivering orders — subject to strict confidentiality agreements.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">4. Data Security</h2>
              <p>We employ industry-standard security measures including 256-bit SSL encryption, secure payment processing, and regular security audits to protect your personal information against unauthorised access, alteration, or disclosure.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">5. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal data</li>
                <li>Opt out of marketing communications at any time</li>
                <li>Withdraw consent where processing is based on consent</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">6. Cookies</h2>
              <p>We use cookies and similar technologies to enhance your browsing experience, analyse site traffic, and personalise content. You can manage your cookie preferences through the <Link to="/cookies" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">Cookie Preferences</Link> page or your browser settings.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">7. Data Retention</h2>
              <p className="mb-3">We retain your personal information only for as long as necessary to fulfil the purposes outlined in this policy, unless a longer retention period is required or permitted by law.</p>
              <ul className="list-disc ml-5 space-y-1">
                <li><strong className="text-luxury-charcoal font-medium">Account data</strong> — retained for 90 days following account closure, after which it is permanently deleted.</li>
                <li><strong className="text-luxury-charcoal font-medium">Order &amp; transaction records</strong> — retained for 90 days from the date of transaction, then securely deleted.</li>
                <li><strong className="text-luxury-charcoal font-medium">Marketing preferences</strong> — retained for 90 days after you withdraw consent or unsubscribe, then permanently removed.</li>
                <li><strong className="text-luxury-charcoal font-medium">Customer service communications</strong> — retained for 90 days from the date of the last interaction.</li>
                <li><strong className="text-luxury-charcoal font-medium">Cookies &amp; analytics data</strong> — retained for 90 days, in line with applicable cookie consent regulations.</li>
              </ul>
              <p className="mt-3">When your data is no longer required, we will securely delete or anonymise it so that it can no longer be used to identify you. You may request deletion of your personal data at any time by contacting <span className="text-luxury-charcoal">privacy@brandclothzy.com</span>, subject to our legal retention obligations.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">8. Contact Us</h2>
              <p>For any privacy-related enquiries, please contact us at <span className="text-luxury-charcoal">privacy@brandclothzy.com</span> or visit our <Link to="/contact" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">Contact</Link> page.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
