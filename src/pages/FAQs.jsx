import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';
import SEO from '../components/SEO';

const faqs = [
  {
    category: 'Orders & Shipping',
    questions: [
      { q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days within India. International orders are delivered within 10–15 business days. Express delivery is available for select locations within 2–3 business days.' },
      { q: 'Do you offer free shipping?', a: 'Free shipping is available on all orders above ₹999. For orders below this threshold, a flat shipping fee of ₹49 applies for domestic deliveries.' },
      { q: 'Can I track my order?', a: 'Yes. Once your order is dispatched, you will receive an email with a tracking number and a link to monitor your shipment in real time.' },
      { q: 'Do you ship internationally?', a: 'We ship to over 50 countries worldwide. International shipping charges and delivery times vary by destination. Applicable customs duties are the responsibility of the recipient.' },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      { q: 'What is your return policy?', a: 'We accept returns within 14 days of delivery for unworn items in original condition with all tags attached. Items must be returned in their original packaging.' },
      { q: 'How do I initiate a return?', a: 'Contact our concierge team at concierge@brandclothzy.com or call +91 90238 44259 to request a return authorisation. We will arrange a complimentary pickup from your address.' },
      { q: 'Can I exchange an item for a different size?', a: 'Yes, exchanges for a different size are complimentary, subject to availability. Please contact our team within 14 days of receiving your order.' },
    ],
  },
  {
    category: 'Products & Care',
    questions: [
      { q: 'Are your products authentic?', a: 'Every BrandClothzy product comes with a certificate of authenticity. Our pieces are crafted in our own ateliers and partner workshops using the finest materials sourced globally.' },
      { q: 'How should I care for my leather goods?', a: 'Store leather goods in the dust bag provided, away from direct sunlight. Clean with a soft cloth. Avoid contact with water, perfumes, and oils. We recommend professional leather conditioning once a year.' },
      { q: 'Do you offer repairs?', a: 'We offer a lifetime repair service for all BrandClothzy products. Minor repairs are complimentary. Contact our concierge team for an assessment and quote.' },
    ],
  },
  {
    category: 'Account & Payments',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards (Visa, Mastercard, American Express, RuPay), UPI, net banking, and EMI options through select banks.' },
      { q: 'Is my payment information secure?', a: 'Absolutely. All transactions are processed through PCI-DSS compliant payment gateways with 256-bit SSL encryption. We never store your card details on our servers.' },
      { q: 'Do you offer EMI options?', a: 'Yes, no-cost EMI is available on orders above ₹50,000 for select bank credit cards. EMI options with interest are available for all other cards.' },
    ],
  },
];

export default function FAQs() {
  const [openItem, setOpenItem] = useState(null);

  const toggle = (key) => setOpenItem(openItem === key ? null : key);

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Frequently Asked Questions"
        path="/faqs"
        description="Find answers to common questions about BrandClothzy orders, shipping, returns, sizing, and payments. Free shipping on orders above ₹999."
        keywords="BrandClothzy FAQ, shipping policy, return policy, size guide, payment options, order tracking, fashion help"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">FAQs</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Help Centre</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Frequently Asked Questions</h1>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Find answers to our most commonly asked questions below. For further assistance,
            please <Link to="/contact" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">contact our concierge team</Link>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-6 border-b border-neutral-100 pb-3">
                {section.category}
              </h2>
              <div className="space-y-0">
                {section.questions.map(({ q, a }) => {
                  const key = q;
                  const isOpen = openItem === key;
                  return (
                    <div key={key} className="border-b border-neutral-100">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between py-5 text-left group"
                      >
                        <span className="text-sm font-medium text-luxury-charcoal group-hover:text-luxury-gold transition-colors pr-4">
                          {q}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-5' : 'max-h-0'}`}
                      >
                        <p className="text-sm text-neutral-500 font-light leading-relaxed">{a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
