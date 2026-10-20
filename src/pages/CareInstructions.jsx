import { Link } from 'react-router-dom';
import { ChevronRight, Droplets, Wind, Sun, Shirt } from 'lucide-react';
import SEO from '../components/SEO';

const careCategories = [
  {
    title: 'Leather Goods',
    icon: Shirt,
    items: [
      'Store in the dust bag provided, away from direct sunlight and heat sources',
      'Wipe gently with a soft, dry cloth after each use',
      'Avoid contact with water, perfumes, oils, and harsh chemicals',
      'For stubborn marks, use a specialist leather cleaner',
      'Condition with a quality leather balm every 6–12 months',
      'Store stuffed with tissue paper to retain shape',
    ],
  },
  {
    title: 'Silk & Delicates',
    icon: Droplets,
    items: [
      'Professional dry clean recommended',
      'If hand-washing, use cold water with a gentle detergent',
      'Never wring or twist — gently press water out',
      'Lay flat to dry on a clean towel, away from direct sunlight',
      'Iron on low heat with a pressing cloth',
      'Store on padded hangers to avoid creasing',
    ],
  },
  {
    title: 'Knitwear & Cashmere',
    icon: Wind,
    items: [
      'Hand wash in lukewarm water with a cashmere-specific detergent',
      'Reshape while damp and lay flat to dry',
      'Remove pilling gently with a cashmere comb',
      'Fold and store flat — never hang knitwear to avoid stretching',
      'Store in breathable garment bags with cedar blocks to prevent moths',
      'Allow 24 hours between wears for fibres to recover',
    ],
  },
  {
    title: 'Tailored Garments',
    icon: Sun,
    items: [
      'Professional dry clean only — inform the cleaner of fabric composition',
      'Hang on quality wooden or padded hangers to maintain shape',
      'Use a garment steamer to remove light wrinkles',
      'Brush suits with a natural-bristle clothes brush after each wear',
      'Rotate garments to allow fabrics to breathe between wears',
      'Store in breathable garment bags for long-term protection',
    ],
  },
];

export default function CareInstructions() {
  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Care Instructions — Clothing Care Guide"
        path="/care"
        description="BrandClothzy care guide. Learn how to properly care for your premium clothing including washing, drying, and storage instructions."
        keywords="clothing care guide, garment care, washing instructions, fabric care, BrandClothzy care, how to wash clothes"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Care Instructions</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Preserve Your Investment</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Care Instructions</h1>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Proper care ensures your BrandClothzy pieces retain their beauty and last
            for generations. Follow these guidelines to preserve each garment.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-12">
          {careCategories.map(({ title, icon: Icon, items }) => (
            <div key={title} className="border border-neutral-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neutral-200">
                  <Icon size={18} className="text-luxury-gold" />
                </div>
                <h2 className="font-serif text-xl text-luxury-charcoal">{title}</h2>
              </div>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-500 font-light leading-relaxed">
                    <span className="w-1 h-1 rounded-full bg-luxury-gold mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="p-8 bg-luxury-pearl">
            <h3 className="font-serif text-xl text-luxury-charcoal mb-3">Repair Service</h3>
            <p className="text-sm text-neutral-500 font-light leading-relaxed mb-4">
              We offer a lifetime repair service for all BrandClothzy products. Minor repairs
              are complimentary. For major restorations, our artisans will provide a personalised quote.
            </p>
            <Link to="/contact" className="text-sm text-luxury-charcoal underline hover:text-luxury-gold transition-colors">
              Contact us for repairs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
