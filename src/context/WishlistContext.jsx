import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

const WishlistContext = createContext();

function wishlistReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_ITEM': {
      const exists = state.items.find((item) => item.id === action.payload.id);
      if (exists) {
        return { items: state.items.filter((item) => item.id !== action.payload.id) };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.id !== action.payload) };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [] });

  const toggleItem = useCallback((product) => {
    const isAdding = !state.items.some((item) => item.id === product.id);
    if (isAdding && typeof window.fbq === 'function') {
      window.fbq('track', 'AddToWishlist', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'INR',
      });
    }
    dispatch({ type: 'TOGGLE_ITEM', payload: product });
  }, [state.items]);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const clearWishlist = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const isInWishlist = useCallback(
    (id) => state.items.some((item) => item.id === id),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      itemCount: state.items.length,
      toggleItem,
      removeItem,
      clearWishlist,
      isInWishlist,
    }),
    [state.items, toggleItem, removeItem, clearWishlist, isInWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within WishlistProvider');
  return context;
}
