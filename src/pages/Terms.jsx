import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Terms of Service"
        path="/terms"
        description="BrandClothzy terms of service. Read our terms and conditions for shopping on brandclothzy.com."
        keywords="BrandClothzy terms, terms of service, conditions, online shopping terms"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Terms of Service</span>
        </nav>

        <div className="max-w-3xl mx-auto mt-8">
          <h1 className="font-serif text-4xl text-luxury-charcoal mb-2">Terms of Service</h1>
          <p className="text-sm text-neutral-400 font-light mb-12">Last updated: April 2, 2026</p>

          <div className="space-y-10 text-sm text-neutral-500 font-light leading-relaxed">
            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">1. General</h2>
              <p>By accessing and using the BrandClothzy website, you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using our website.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">2. Products & Pricing</h2>
              <ul className="list-disc ml-5 space-y-1">
                <li>All product descriptions, images, and pricing are as accurate as possible. We reserve the right to correct any errors.</li>
                <li>Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes unless otherwise stated.</li>
                <li>We reserve the right to modify prices without prior notice. Orders placed prior to any price change will be honoured at the original price.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">3. Orders</h2>
              <p className="mb-3">Placing an order on our website constitutes an offer to purchase. We reserve the right to accept or decline any order. An order is confirmed only when you receive an order confirmation email from us.</p>
              <p>We may cancel orders in cases of pricing errors, product unavailability, suspected fraud, or other legitimate reasons.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">4. Intellectual Property</h2>
              <p>All content on this website — including text, images, logos, designs, and trademarks — is the exclusive property of BrandClothzy and is protected by applicable intellectual property laws. Reproduction, distribution, or use without written permission is strictly prohibited.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">5. Limitation of Liability</h2>
              <p>BrandClothzy shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our website or products. Our total liability shall not exceed the purchase price of the product in question.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">6. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of New Delhi.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">7. Changes to Terms</h2>
              <p>We reserve the right to update these Terms of Service at any time. Changes will be effective upon posting to this page. Your continued use of the website constitutes acceptance of the updated terms.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-luxury-charcoal mb-3">8. Contact</h2>
              <p>For questions about these terms, please <Link to="/contact" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">contact us</Link> or email <span className="text-luxury-charcoal">legal@brandclothzy.com</span>.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
