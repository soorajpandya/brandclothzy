import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

const sizeData = {
  Women: {
    tops: {
      label: 'Tops, Jackets & Outerwear',
      headers: ['Size', 'UK', 'EU', 'US', 'Bust (cm)', 'Waist (cm)', 'Hips (cm)'],
      rows: [
        ['XS', '6', '34', '2', '80', '62', '86'],
        ['S', '8', '36', '4', '84', '66', '90'],
        ['M', '10', '38', '6', '88', '70', '94'],
        ['L', '12', '40', '8', '92', '74', '98'],
        ['XL', '14', '42', '10', '96', '78', '102'],
      ],
    },
    shoes: {
      label: 'Shoes',
      headers: ['EU', 'UK', 'US', 'CM'],
      rows: [
        ['36', '3', '6', '23'],
        ['37', '4', '7', '23.5'],
        ['38', '5', '8', '24.5'],
        ['39', '6', '9', '25'],
        ['40', '7', '10', '26'],
        ['41', '8', '11', '26.5'],
      ],
    },
  },
  Men: {
    tops: {
      label: 'Shirts, Jackets & Outerwear',
      headers: ['Size', 'EU', 'US/UK', 'Chest (cm)', 'Waist (cm)', 'Shoulders (cm)'],
      rows: [
        ['S', '46', '36', '92', '80', '44'],
        ['M', '48', '38', '96', '84', '46'],
        ['L', '50', '40', '100', '88', '48'],
        ['XL', '52', '42', '104', '92', '50'],
        ['XXL', '54', '44', '108', '96', '52'],
      ],
    },
    shoes: {
      label: 'Shoes',
      headers: ['EU', 'UK', 'US', 'CM'],
      rows: [
        ['40', '6', '7', '25.5'],
        ['41', '7', '8', '26.5'],
        ['42', '8', '9', '27'],
        ['43', '9', '10', '27.5'],
        ['44', '10', '11', '28.5'],
        ['45', '11', '12', '29'],
      ],
    },
  },
};

export default function SizeGuide() {
  const [activeGender, setActiveGender] = useState('Women');

  return (
    <div className="pt-24 lg:pt-28 pb-20">
      <SEO
        title="Size Guide — Men's & Women's Sizing Chart"
        path="/size-guide"
        description="BrandClothzy size guide for men's and women's clothing. Find your perfect fit with our detailed measurement charts for tops, bottoms, dresses, and outerwear."
        keywords="BrandClothzy size guide, men size chart, women size chart, clothing measurements, find my size, indian fashion sizing"
      />
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 py-4 text-[11px] text-neutral-400">
          <Link to="/" className="hover:text-luxury-charcoal transition-colors">Home</Link>
          <ChevronRight size={11} />
          <span className="text-luxury-charcoal">Size Guide</span>
        </nav>

        <div className="text-center mt-8 mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">Find Your Perfect Fit</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-luxury-charcoal mb-4">Size Guide</h1>
          <p className="text-sm text-neutral-500 font-light max-w-lg mx-auto leading-relaxed">
            Our pieces are designed for an elegant, contemporary fit. Use the charts
            below to find your ideal size. For personalised assistance, please{' '}
            <Link to="/contact" className="text-luxury-charcoal underline hover:text-luxury-gold transition-colors">
              contact our stylists
            </Link>.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="flex gap-6 mb-10 justify-center">
            {Object.keys(sizeData).map((gender) => (
              <button
                key={gender}
                onClick={() => setActiveGender(gender)}
                className={`text-[11px] uppercase tracking-[0.2em] pb-2 border-b-2 transition-colors ${
                  activeGender === gender
                    ? 'border-luxury-charcoal text-luxury-charcoal font-medium'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                {gender}
              </button>
            ))}
          </div>

          <div className="space-y-12">
            {Object.entries(sizeData[activeGender]).map(([key, table]) => (
              <div key={key}>
                <h3 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-4">
                  {table.label}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        {table.headers.map((h) => (
                          <th key={h} className="py-3 px-4 text-left text-[10px] uppercase tracking-[0.15em] font-semibold text-luxury-charcoal">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, i) => (
                        <tr key={i} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className={`py-3 px-4 font-light text-neutral-600 ${j === 0 ? 'font-medium text-luxury-charcoal' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 p-8 bg-luxury-pearl">
            <h3 className="font-serif text-xl text-luxury-charcoal mb-4">How to Measure</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-neutral-500 font-light">
              <div>
                <p className="font-medium text-luxury-charcoal mb-1">Bust / Chest</p>
                <p>Measure around the fullest part, keeping the tape horizontal.</p>
              </div>
              <div>
                <p className="font-medium text-luxury-charcoal mb-1">Waist</p>
                <p>Measure around the narrowest point, typically just above the navel.</p>
              </div>
              <div>
                <p className="font-medium text-luxury-charcoal mb-1">Hips</p>
                <p>Measure around the widest point of the hips, approximately 20cm below the waist.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
