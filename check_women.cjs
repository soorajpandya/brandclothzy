const fs = require('fs');

const women = fs.readFileSync('public/womenwear.csv', 'utf-8');
const lines = women.split('\n').filter(l => l.trim());
console.log('Total lines:', lines.length);
console.log('Header:', lines[0].substring(0, 300));
console.log('---');

const names = new Set();
const products = [];
const seen = new Set();

for (let i = 1; i < lines.length; i++) {
  const c = lines[i].split('\t');
  const tryAdd = (imgIdx, nameIdx, priceIdx) => {
    if (c[imgIdx] && c[nameIdx] && c[priceIdx] && c[imgIdx].startsWith('http')) {
      const name = c[nameIdx].trim();
      const priceStr = c[priceIdx].trim();
      if (name && priceStr && !seen.has(name) && !name.includes('+') && !name.includes('Review')) {
        const price = parseInt(priceStr.replace(/[₹,\s]/g, ''));
        if (price > 0 && price < 10000) {
          seen.add(name);
          products.push({ image: c[imgIdx].trim(), name, price });
        }
      }
    }
  };
  tryAdd(0, 4, 5);
  tryAdd(1, 7, 8);
  tryAdd(2, 10, 11);
  if (c.length > 22) tryAdd(19, 21, 22);
}

console.log('Unique products parsed:', products.length);
const hasWomen = products.filter(p => p.name.toLowerCase().includes('women'));
const hasMen = products.filter(p => p.name.toLowerCase().includes(' men'));
console.log('Names with "women":', hasWomen.length);
console.log('Names with "men":', hasMen.length);
console.log('\nFirst 20 products:');
products.slice(0, 20).forEach((p, i) => console.log(`  ${i + 1}. ${p.name} - ₹${p.price}`));

// Categorize
function getCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('kurti') || n.includes('kurta')) return 'Kurtis';
  if (n.includes('saree') || n.includes('sari')) return 'Sarees';
  if (n.includes('dress') || n.includes('gown')) return 'Dresses';
  if (n.includes('top') || n.includes('blouse')) return 'Tops';
  if (n.includes('legging')) return 'Leggings';
  if (n.includes('palazzo') || n.includes('pant') || n.includes('trouser')) return 'Pants';
  if (n.includes('dupatta') || n.includes('stole') || n.includes('scarf')) return 'Dupattas';
  if (n.includes('shirt')) return 'Shirts';
  if (n.includes('tshirt') || n.includes('t-shirt') || n.includes('t shirt')) return 'T-Shirts';
  if (n.includes('jeans')) return 'Jeans';
  if (n.includes('jacket') || n.includes('shrug')) return 'Jackets';
  if (n.includes('skirt')) return 'Skirts';
  if (n.includes('jumpsuit') || n.includes('romper')) return 'Jumpsuits';
  if (n.includes('salwar') || n.includes('churidar')) return 'Salwar Sets';
  if (n.includes('lehenga')) return 'Lehengas';
  if (n.includes('short')) return 'Shorts';
  if (n.includes('track') || n.includes('jogger')) return 'Track Pants';
  if (n.includes('nightwear') || n.includes('nightgown') || n.includes('nightdress') || n.includes('pyjama') || n.includes('pajama') || n.includes('sleep') || n.includes('nighty')) return 'Nightwear';
  if (n.includes('bra') || n.includes('lingerie') || n.includes('panty') || n.includes('bikini') || n.includes('innerwear')) return null;
  if (n.includes('fabric') || n.includes('unstitched')) return null;
  return 'Other';
}

const cats = {};
products.forEach(p => {
  const cat = getCategory(p.name);
  if (!cats[cat]) cats[cat] = [];
  cats[cat].push(p);
});
console.log('\nCategories:');
Object.keys(cats).sort((a, b) => (cats[b] || []).length - (cats[a] || []).length).forEach(c => {
  console.log(`  ${c}: ${cats[c].length} products (price range: ₹${Math.min(...cats[c].map(p => p.price))}-₹${Math.max(...cats[c].map(p => p.price))})`);
});
