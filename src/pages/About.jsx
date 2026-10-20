import { Link } from 'react-router-dom';
import { ChevronRight, Award, Heart, Leaf, Users, Gem, Shield } from 'lucide-react';
import SEO from '../components/SEO';

const milestones = [
  { year: '2020', event: 'Founded in Ahmedabad with a vision to redefine Indian luxury fashion.' },
  { year: '2021', event: 'Launched our debut menswear collection — sold out within 72 hours.' },
  { year: '2022', event: 'Expanded to womenswear with handcrafted sarees and contemporary kurtis.' },
  { year: '2023', event: 'Partnered with 50+ master artisans across Rajasthan, Gujarat, and Varanasi.' },
  { year: '2024', event: 'Crossed 1,00,000 happy customers and launched our multi-seller marketplace.' },
  { year: '2025', event: 'Expanded internationally, delivering to 20+ countries across the globe.' },
];

const values = [
  {
    icon: Gem,
    title: 'Uncompromising Quality',
    desc: 'Every garment is crafted using handpicked premium fabrics, inspected through a rigorous 12-point quality check before it reaches you.',
  },
  {
    icon: Heart,
    title: 'Customer at the Centre',
    desc: 'Your experience is our obsession. From curated styling advice to white-glove delivery, we treat every customer as our most valued guest.',
  },
  {
    icon: Leaf,
    title: 'Conscious Craftsmanship',
    desc: 'We champion sustainable practices — ethically sourced materials, responsible packaging, and fair wages for every artisan in our supply chain.',
  },
  {
    icon: Users,
    title: 'Artisan Partnership',
    desc: 'We work directly with over 50 master craftspeople across India, preserving traditional techniques while creating contemporary luxury.',
  },
  {
    icon: Award,
    title: 'Heritage & Innovation',
    desc: 'Rooted in India\'s rich textile heritage, we fuse centuries-old weaving traditions with modern silhouettes for the discerning global wardrobe.',
  },
  {
    icon: Shield,
    title: 'Authenticity Guaranteed',
    desc: 'Every BrandClothzy piece ships with a certificate of authenticity. What you see is exactly what arrives — no compromises, ever.',
  },
];

const services = [
  { title: "Men's Luxury Wear", desc: 'Shirts, T-Shirts, Jeans, Trousers, Jackets — crafted for the modern Indian man.' },
  { title: "Women's Ethnic & Western", desc: 'Sarees, Kurtis, Lehengas, Dresses, Tops & Blouses — curated for every occasion.' },
  { title: 'Personal Styling', desc: 'Expert styling consultations available via our concierge team.' },
  { title: 'Corporate Gifting', desc: 'Premium branded fashion for bulk gifting with custom packaging.' },
];

export default function About() {
  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="About Us"
        path="/about"
        description="Discover the BrandClothzy story — a luxury Indian fashion brand born in Ahmedabad, crafting premium clothing for men and women. Our mission is to deliver uncompromising quality with a deep respect for India's rich textile heritage."
        keywords="about BrandClothzy, luxury Indian fashion brand, premium clothing India, brand story, fashion mission, sustainable fashion India, Ahmedabad fashion brand"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'BrandClothzy',
          url: 'https://brandclothzy.com',
          logo: 'https://brandclothzy.com/og-image.png',
          foundingDate: '2020',
          foundingLocation: 'Ahmedabad, India',
          description: 'Premium luxury fashion brand redefining Indian clothing for men and women.',
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-90238-44259',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: 'English',
          },
          sameAs: [
            'https://instagram.com/brandclothzy',
            'https://facebook.com/brandclothzy',
          ],
        }}
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} aria-hidden="true" />
          <span className="text-luxury-charcoal">About Us</span>
        </nav>

        {/* Hero */}
        <div className="text-center mt-8 mb-20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Our Story</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-luxury-charcoal mb-6 leading-tight">
            Crafted with Purpose.<br className="hidden sm:block" /> Worn with Pride.
          </h1>
          <p className="max-w-2xl mx-auto text-base text-neutral-500 font-light leading-relaxed">
            BrandClothzy was born from a singular belief — that luxury fashion should be attainable, authentic, and rooted in
            the extraordinary textile legacy of India.
          </p>
        </div>

        {/* Brand Story */}
        <section className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" aria-labelledby="brand-story-heading">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-4">The Beginning</p>
            <h2 id="brand-story-heading" className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-6 leading-snug">
              A Brand Born from Passion for Indian Craft
            </h2>
            <div className="space-y-4 text-sm text-neutral-500 font-light leading-relaxed">
              <p>
                Founded in 2020 in the heart of Ahmedabad — India's fashion capital — BrandClothzy emerged as an answer
                to a gap in the market: luxury-quality Indian fashion at a price that respects both the buyer and the maker.
              </p>
              <p>
                Our founders, deeply passionate about India's rich weaving traditions and modern design sensibility, set out
                to build a brand that would carry the soul of a Varanasi silk loom and the sophistication of a Paris runway —
                all while remaining unmistakably Indian.
              </p>
              <p>
                Today, BrandClothzy is a destination for the discerning fashion-conscious individual who refuses to choose
                between heritage and modernity. We curate, we craft, and we deliver experiences — not just garments.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-luxury-pearl aspect-[3/4] flex items-end p-6">
              <div>
                <p className="font-serif text-4xl text-luxury-charcoal mb-1">50+</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-taupe">Master Artisans</p>
              </div>
            </div>
            <div className="bg-luxury-sand aspect-[3/4] flex items-end p-6 mt-8">
              <div>
                <p className="font-serif text-4xl text-luxury-charcoal mb-1">1L+</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-taupe">Happy Customers</p>
              </div>
            </div>
            <div className="bg-luxury-sand aspect-[3/4] flex items-end p-6">
              <div>
                <p className="font-serif text-4xl text-luxury-charcoal mb-1">20+</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-taupe">Countries Served</p>
              </div>
            </div>
            <div className="bg-luxury-pearl aspect-[3/4] flex items-end p-6 mt-8">
              <div>
                <p className="font-serif text-4xl text-luxury-charcoal mb-1">5★</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-luxury-taupe">Avg. Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mb-24 bg-luxury-charcoal text-white py-16 px-8 sm:px-16" aria-labelledby="mission-vision-heading">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-gold mb-4">What Drives Us</p>
            <h2 id="mission-vision-heading" className="font-serif text-3xl sm:text-4xl mb-12 leading-snug">
              Mission &amp; Vision
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-left">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold mb-4">Our Mission</h3>
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  To democratise luxury Indian fashion — making premium-quality, artisan-crafted clothing accessible to every
                  man and woman who takes pride in what they wear. We believe fashion is a form of self-expression, and we are
                  here to help you express it magnificently.
                </p>
              </div>
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.25em] text-luxury-gold mb-4">Our Vision</h3>
                <p className="text-sm text-neutral-300 font-light leading-relaxed">
                  To be India's most trusted luxury fashion destination — celebrated globally for its craftsmanship,
                  sustainability, and customer experience. We envision a world where Indian design stands proudly alongside
                  the finest global fashion houses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Values */}
        <section className="mb-24" aria-labelledby="values-heading">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Our Principles</p>
            <h2 id="values-heading" className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">What We Stand For</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-8 border border-neutral-100 hover:border-luxury-gold transition-colors group">
                <Icon size={24} className="text-luxury-gold mb-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <h3 className="font-medium text-luxury-charcoal text-sm mb-3 uppercase tracking-[0.1em]">{title}</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="mb-24" aria-labelledby="services-heading">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">What We Offer</p>
            <h2 id="services-heading" className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">Our Collections &amp; Services</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-neutral-100">
            {services.map(({ title, desc }) => (
              <div key={title} className="bg-white p-10">
                <h3 className="font-serif text-xl text-luxury-charcoal mb-3">{title}</h3>
                <p className="text-sm text-neutral-500 font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/shop"
              className="inline-block border border-luxury-charcoal text-luxury-charcoal text-[11px] uppercase tracking-[0.2em] px-8 py-3 hover:bg-luxury-charcoal hover:text-white transition-colors"
            >
              Explore Collections
            </Link>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-24" aria-labelledby="journey-heading">
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Since 2020</p>
            <h2 id="journey-heading" className="font-serif text-3xl sm:text-4xl text-luxury-charcoal">Our Journey</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute left-[52px] top-0 bottom-0 w-px bg-neutral-200" aria-hidden="true" />
              <div className="space-y-0">
                {milestones.map(({ year, event }, idx) => (
                  <div key={year} className="flex gap-6 items-start pb-10 last:pb-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-[52px] text-right">
                        <span className="font-serif text-lg text-luxury-charcoal">{year}</span>
                      </div>
                      <div className={`absolute right-[-7px] top-[7px] w-3 h-3 rounded-full border-2 border-luxury-charcoal ${idx === milestones.length - 1 ? 'bg-luxury-gold border-luxury-gold' : 'bg-white'}`} aria-hidden="true" />
                    </div>
                    <p className="text-sm text-neutral-500 font-light leading-relaxed pt-0.5 pl-6">{event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-luxury-pearl py-16 px-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-4">Be Part of the Story</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-luxury-charcoal mb-6">
            Experience Luxury, Redefined.
          </h2>
          <p className="max-w-xl mx-auto text-sm text-neutral-500 font-light leading-relaxed mb-8">
            Join over a lakh satisfied customers who choose BrandClothzy for their wardrobe. Because you deserve
            nothing less than the finest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-luxury-charcoal text-white text-[11px] uppercase tracking-[0.2em] px-10 py-3.5 hover:bg-luxury-gold transition-colors"
            >
              Shop Now
            </Link>
            <Link
              to="/contact"
              className="border border-luxury-charcoal text-luxury-charcoal text-[11px] uppercase tracking-[0.2em] px-10 py-3.5 hover:bg-luxury-charcoal hover:text-white transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
