import { Link } from 'react-router-dom';
import { ChevronRight, Truck, Clock, Shield, Package, AlertTriangle } from 'lucide-react';
import SEO from '../components/SEO';

export default function ShippingReturns() {
  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Shipping & Refund Policy"
        path="/shipping-returns"
        description="BrandClothzy shipping and refund policy. Free shipping on orders above ₹999. Please note: we do not provide any return or refund once the product has been delivered."
        keywords="BrandClothzy shipping, free shipping, no return policy, no refund policy, delivery time india, fashion delivery"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Shipping & Returns</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Client Services</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Shipping &amp; Refund Policy</h1>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Prominent No-Return / No-Refund Banner */}
          <div className="mb-10 border-2 border-luxury-charcoal bg-luxury-charcoal text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <AlertTriangle size={28} className="flex-shrink-0 text-luxury-gold" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold mb-1">Important Policy Notice</p>
                <p className="font-serif text-xl sm:text-2xl font-medium leading-snug">
                  We do not provide any return or refund once the product has been delivered.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: Shield, title: 'Secure Packaging', desc: 'Luxury gift-ready packaging' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-6 border border-neutral-100">
                <Icon size={24} className="text-luxury-gold mx-auto mb-3" />
                <h3 className="text-sm font-medium text-luxury-charcoal mb-1">{title}</h3>
                <p className="text-xs text-neutral-500 font-light">{desc}</p>
              </div>
            ))}
          </div>

          <section className="mb-14">
            <h2 className="font-serif text-2xl text-luxury-charcoal mb-6">Shipping</h2>
            <div className="space-y-6 text-sm text-neutral-500 font-light leading-relaxed">
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-2 flex items-center gap-2"><Package size={14} className="text-luxury-gold" /> Domestic Delivery (India)</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Standard Delivery: 5–7 business days — ₹49 (free above ₹999)</li>
                  <li>Express Delivery: 2–3 business days — ₹99</li>
                  <li>Same-Day Delivery (Delhi NCR): Available for orders placed before 12PM — ₹149</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-2 flex items-center gap-2"><Truck size={14} className="text-luxury-gold" /> International Delivery</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Standard International: 10–15 business days — calculated at checkout</li>
                  <li>Express International: 5–7 business days — calculated at checkout</li>
                  <li>Customs duties and import taxes are the responsibility of the recipient</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-2 flex items-center gap-2"><Clock size={14} className="text-luxury-gold" /> Order Processing</h3>
                <p>Orders are processed within 1–2 business days. You will receive a confirmation email with tracking details once your order has been dispatched.</p>
              </div>
            </div>
          </section>

          <section className="mb-14" aria-labelledby="refund-policy-heading">
            <h2 id="refund-policy-heading" className="font-serif text-2xl text-luxury-charcoal mb-6">Return &amp; Refund Policy</h2>

            {/* Repeated highlighted clause for in-page visibility */}
            <div className="mb-8 border-l-4 border-luxury-charcoal bg-luxury-pearl px-6 py-5">
              <p className="flex items-start gap-3 text-sm font-semibold text-luxury-charcoal">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-luxury-gold" aria-hidden="true" />
                <span>
                  <strong>No Return &amp; No Refund Policy:</strong> We do not provide any return or refund once the product has been delivered. Please review your order carefully before completing your purchase.
                </span>
              </p>
            </div>

            <div className="space-y-6 text-sm text-neutral-500 font-light leading-relaxed">
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-3">Why We Have This Policy</h3>
                <p>
                  To maintain the highest standards of hygiene and product integrity for all our customers, and given the artisanal, made-to-quality nature of our garments, BrandClothzy operates a strict no-return, no-refund policy on all delivered orders. We strongly encourage customers to:
                </p>
                <ul className="list-disc ml-5 mt-3 space-y-1">
                  <li>Consult our <Link to="/size-guide" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">Size Guide</Link> before ordering</li>
                  <li>Review product images and descriptions carefully</li>
                  <li>Contact our concierge team for styling or sizing advice before purchase</li>
                  <li>Use the Quick View feature for detailed product inspection</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-3">Damaged or Incorrect Items</h3>
                <p>
                  In the rare event that your order arrives damaged, defective, or incorrect, please contact us within
                  <strong className="text-luxury-charcoal"> 24 hours of delivery</strong> with photographic evidence at{' '}
                  <span className="text-luxury-charcoal">concierge@brandclothzy.com</span>. Verified cases of damage or incorrect dispatch will be resolved at our discretion through replacement or store credit.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-luxury-charcoal mb-3">Order Cancellation</h3>
                <p>
                  Orders may be cancelled within <strong className="text-luxury-charcoal">2 hours of placement</strong>, provided they have not yet been dispatched. To cancel, contact our concierge team immediately at{' '}
                  <span className="text-luxury-charcoal">concierge@brandclothzy.com</span> or call{' '}
                  <span className="text-luxury-charcoal">+91 90238 44259</span>. Once dispatched, orders cannot be cancelled or refunded.
                </p>
              </div>
            </div>
          </section>

          <div className="p-8 bg-luxury-pearl text-center">
            <p className="text-sm text-neutral-500 font-light">
              Need assistance with a return or shipment?{' '}
              <Link to="/contact" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">
                Contact our concierge team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
