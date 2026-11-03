import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from './useProducts';
import { filterProducts } from './filterProducts';

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

  const toggleSize = useCallback((size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedGender(null);
    setSelectedSizes([]);
    setPriceRange(null);
    setSortBy('featured');
    setSearchQuery('');
    setSearchParams({});
  }, [setSearchParams]);

  const filteredProducts = useMemo(
    () =>
      filterProducts(allProducts, {
        gender: selectedGender,
        searchQuery,
        categories: selectedCategories,
        sizes: selectedSizes,
        priceRange,
        sortBy,
      }),
    [allProducts, selectedGender, selectedCategories, selectedSizes, priceRange, sortBy, searchQuery]
  );

  const activeFilterCount =
    selectedCategories.length + selectedSizes.length + (priceRange ? 1 : 0) + (selectedGender ? 1 : 0);

  return {
    selectedCategories,
    selectedGender,
    selectedSizes,
    priceRange,
    sortBy,
    searchQuery,
    toggleCategory,
    toggleGender,
    toggleSize,
    setPriceRange,
    setSortBy,
    setSearchQuery,
    clearFilters,
    filteredProducts,
    activeFilterCount,
  };
}
