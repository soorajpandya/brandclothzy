import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from './useProducts';
import { fuzzyMatch } from '../utils/helpers';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products: allProducts } = useProducts();

  // Read URL params directly (not via effect) so filtering is correct on first render
  const urlGender = searchParams.get('gender');
  const urlCategory = searchParams.get('category');
  const urlSearch = searchParams.get('q');

  const [selectedCategories, setSelectedCategories] = useState(() =>
    urlCategory ? [urlCategory] : []
  );
  const [selectedGender, setSelectedGender] = useState(() => urlGender || null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(() => urlSearch || '');

  // Keep state in sync when URL changes (e.g. navigating from Men's to Women's collection)
  useEffect(() => {
    setSelectedGender(urlGender || null);
    setSelectedCategories(urlCategory ? [urlCategory] : []);
    setSearchQuery(urlSearch || '');
  }, [urlGender, urlCategory, urlSearch]);

  const toggleGender = useCallback((gender) => {
    setSelectedGender((prev) => (prev === gender ? null : gender));
  }, []);

  const toggleCategory = useCallback((category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, []);

  const toggleColor = useCallback((color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }, []);

  const toggleSize = useCallback((size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedGender(null);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange(null);
    setSortBy('featured');
    setSearchQuery('');
    setSearchParams({});
  }, [setSearchParams]);

  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];

    if (selectedGender) {
      filtered = filtered.filter((p) => p.gender === selectedGender);
    }

    if (searchQuery) {
      const q = searchQuery.trim();
      filtered = filtered.filter(
        (p) => fuzzyMatch(p.name, q) || fuzzyMatch(p.category, q)
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) => p.colors.some((c) => selectedColors.includes(c)));
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    if (priceRange) {
      filtered = filtered.filter((p) => p.price >= priceRange.min && p.price <= priceRange.max);
    }

    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case 'featured':
      default:
        break;
    }

    return filtered;
  }, [allProducts, selectedGender, selectedCategories, selectedColors, selectedSizes, priceRange, sortBy, searchQuery]);

  const activeFilterCount =
    selectedCategories.length + selectedColors.length + selectedSizes.length + (priceRange ? 1 : 0) + (selectedGender ? 1 : 0);

  return {
    selectedCategories,
    selectedGender,
    selectedColors,
    selectedSizes,
    priceRange,
    sortBy,
    searchQuery,
    toggleCategory,
    toggleGender,
    toggleColor,
    toggleSize,
    setPriceRange,
    setSortBy,
    setSearchQuery,
    clearFilters,
    filteredProducts,
    activeFilterCount,
  };
}
