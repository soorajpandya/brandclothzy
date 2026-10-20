import { useState, useMemo, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, Grid3X3, LayoutGrid } from 'lucide-react';
import { useFilters } from '../hooks/useFilters';
import { useProducts } from '../hooks/useProducts';
import { genders, colorOptions, priceRanges } from '../data/products';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import Button from '../components/Button';
import SEO, { CollectionJsonLd } from '../components/SEO';

export default function Shop() {
  const {
    selectedCategories,
    selectedGender,
    selectedColors,
    priceRange,
    sortBy,
    searchQuery,
    toggleCategory,
    toggleGender,
    toggleColor,
    setPriceRange,
    setSortBy,
    setSearchQuery,
    clearFilters,
    filteredProducts,
    activeFilterCount,
  } = useFilters();

  const { products: allProducts } = useProducts();
  const [showFilters, setShowFilters] = useState(false);
  const [gridCols, setGridCols] = useState(4);
  const [loading] = useState(false);

  useEffect(() => {
    if (searchQuery && typeof window.fbq === 'function') {
      window.fbq('track', 'Search', { search_string: searchQuery });
    }
  }, [searchQuery]);

  // Show only categories relevant to the selected gender
  const visibleCategories = useMemo(() => {
    const pool = selectedGender
      ? allProducts.filter((p) => p.gender === selectedGender)
      : allProducts;
    return [...new Set(pool.map((p) => p.category))];
  }, [selectedGender]);

  const pageTitle = searchQuery
    ? `Results for "${searchQuery}"`
    : selectedGender ? `${selectedGender}'s Collection` : 'All Collections';

  const seoTitle = selectedGender
    ? `${selectedGender === 'Men' ? "Men's" : "Women's"} Clothing — Shirts, T-Shirts, Jeans & More`
    : 'Shop All Collections — Men\'s & Women\'s Fashion';
  const seoDesc = selectedGender
    ? `Browse premium ${selectedGender.toLowerCase()}'s clothing at BrandClothzy. Shop ${selectedGender === 'Men' ? 'shirts, t-shirts, jeans, trousers, jackets' : 'sarees, kurtis, dresses, lehengas, tops'}. Free shipping above ₹999.`
    : 'Shop all BrandClothzy collections. Premium Indian fashion for men & women — shirts, sarees, kurtis, jeans, dresses & more. Free shipping above ₹999.';
  const seoKeywords = selectedGender === 'Men'
    ? 'mens fashion india, buy shirts online, mens t-shirts, jeans online, trousers, jackets, mens casual wear, affordable mens clothing'
    : selectedGender === 'Women'
    ? 'womens fashion india, sarees online, buy kurtis, lehengas, dresses online, womens ethnic wear, designer kurtis, womens tops'
    : 'indian fashion online, mens clothing, womens clothing, BrandClothzy shop, affordable luxury fashion india';

  return (
    <div className="pt-20 lg:pt-24 pb-16">
      <SEO
        title={seoTitle}
        path={selectedGender ? `/shop?gender=${selectedGender}` : '/shop'}
        description={seoDesc}
        keywords={seoKeywords}
        jsonLd={CollectionJsonLd({ name: pageTitle, description: seoDesc, products: filteredProducts })}
      />
      <div className="bg-luxury-pearl py-12 lg:py-16 mb-8 lg:mb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-luxury-taupe mb-3">
            {searchQuery ? 'Search' : 'Discover'}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-luxury-charcoal">{pageTitle}</h1>
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); clearFilters(); }}
              className="mt-4 text-[11px] uppercase tracking-[0.15em] text-luxury-taupe hover:text-luxury-charcoal transition-colors underline underline-offset-4"
            >
              Clear search
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-luxury-charcoal hover:text-luxury-gold transition-colors"
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-luxury-charcoal text-white text-[9px] rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[11px] uppercase tracking-[0.1em] text-neutral-400 hover:text-luxury-charcoal transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <p className="text-xs text-neutral-400 hidden sm:block">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
            </p>
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setGridCols(3)}
                className={`p-1.5 ${gridCols === 3 ? 'text-luxury-charcoal' : 'text-neutral-300'}`}
                aria-label="3 column grid"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setGridCols(4)}
                className={`p-1.5 ${gridCols === 4 ? 'text-luxury-charcoal' : 'text-neutral-300'}`}
                aria-label="4 column grid"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none text-[11px] uppercase tracking-[0.1em] pr-6 pl-2 py-1.5 bg-transparent border-none outline-none text-luxury-charcoal cursor-pointer"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400" />
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {showFilters && (
            <div className="w-64 flex-shrink-0 hidden lg:block">
              <div className="sticky top-28 space-y-8">
                <FilterSection title="Gender">
                  {genders.map((g) => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="gender"
                        checked={selectedGender === g}
                        onChange={() => toggleGender(g)}
                        className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold"
                      />
                      <span className="text-sm text-neutral-600 group-hover:text-luxury-charcoal transition-colors">
                        {g}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                <FilterSection title="Category">
                  {visibleCategories.map((cat) => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold rounded-sm"
                      />
                      <span className="text-sm text-neutral-600 group-hover:text-luxury-charcoal transition-colors">
                        {cat}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                <FilterSection title="Price">
                  {priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="price"
                        checked={priceRange?.label === range.label}
                        onChange={() => setPriceRange(priceRange?.label === range.label ? null : range)}
                        className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold"
                      />
                      <span className="text-sm text-neutral-600 group-hover:text-luxury-charcoal transition-colors">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </FilterSection>

                <FilterSection title="Color">
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1.5 text-xs border transition-colors ${
                          selectedColors.includes(color)
                            ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                            : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute top-0 right-0 bottom-0 w-[320px] bg-white overflow-y-auto p-6 pt-8 animate-slide-down">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm uppercase tracking-[0.15em] font-medium">Filters</h3>
                  <button onClick={() => setShowFilters(false)} aria-label="Close filters">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-8">
                  <FilterSection title="Gender">
                    {genders.map((g) => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="gender-mobile"
                          checked={selectedGender === g}
                          onChange={() => toggleGender(g)}
                          className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold"
                        />
                        <span className="text-sm text-neutral-600">{g}</span>
                      </label>
                    ))}
                  </FilterSection>
                  <FilterSection title="Category">
                    {visibleCategories.map((cat) => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => toggleCategory(cat)}
                          className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold rounded-sm"
                        />
                        <span className="text-sm text-neutral-600">{cat}</span>
                      </label>
                    ))}
                  </FilterSection>
                  <FilterSection title="Price">
                    {priceRanges.map((range) => (
                      <label key={range.label} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="price-mobile"
                          checked={priceRange?.label === range.label}
                          onChange={() => setPriceRange(priceRange?.label === range.label ? null : range)}
                          className="w-4 h-4 border-neutral-300 text-luxury-charcoal focus:ring-luxury-gold"
                        />
                        <span className="text-sm text-neutral-600">{range.label}</span>
                      </label>
                    ))}
                  </FilterSection>
                  <FilterSection title="Color">
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`px-3 py-1.5 text-xs border transition-colors ${
                            selectedColors.includes(color)
                              ? 'border-luxury-charcoal bg-luxury-charcoal text-white'
                              : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </FilterSection>
                </div>
                <div className="mt-10 flex gap-3">
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    Clear
                  </Button>
                  <Button onClick={() => setShowFilters(false)} className="flex-1">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1">
            {loading ? (
              <div className={`grid grid-cols-2 lg:grid-cols-${gridCols} gap-4 lg:gap-6`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-serif text-2xl text-luxury-charcoal mb-3">No pieces found</p>
                <p className="text-sm text-neutral-400 mb-6 font-light">
                  Try adjusting your filters to discover more
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div
                className="grid gap-4 lg:gap-6"
                style={{
                  gridTemplateColumns: `repeat(${gridCols > 2 ? gridCols : 2}, minmax(0, 1fr))`,
                }}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-[0.25em] font-semibold text-luxury-taupe mb-4">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
