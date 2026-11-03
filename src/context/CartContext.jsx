import { createContext, useContext, useReducer, useCallback, useState } from 'react';
// Pricing, delivery tiers and the festive-season restriction live in shared/pricing.js so the
// storefront and the payment server always agree on the amount.
import {
  SHIPPING_TIERS,
  UNAVAILABLE_SHIPPING_TIERS,
  SHIPPING_UNAVAILABLE_MESSAGE,
  computeTotals,
  customerUnitPrice,
  MAX_QUANTITY_PER_LINE,
} from '../../shared/pricing.js';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === existing.id && item.size === existing.size && item.color === existing.color
              ? { ...item, quantity: Math.min(MAX_QUANTITY_PER_LINE, item.quantity + 1) }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: 1 }] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (item) => !(item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color)
        ),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id && item.size === action.payload.size && item.color === action.payload.color
            ? { ...item, quantity: Math.min(MAX_QUANTITY_PER_LINE, Math.max(1, action.payload.quantity)) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};


export { SHIPPING_TIERS, UNAVAILABLE_SHIPPING_TIERS, SHIPPING_UNAVAILABLE_MESSAGE };

/** Customer-rupee line total for a cart item (item.price is the base price). */
export const lineTotal = (item) => customerUnitPrice(item.price) * item.quantity;

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [shippingOption, setShippingOptionRaw] = useState('standard');

  // Returns false (and keeps Standard Delivery) when the requested tier is unavailable.
  const setShippingOption = useCallback((id) => {
    if (UNAVAILABLE_SHIPPING_TIERS.includes(id)) {
      setShippingOptionRaw('standard');
      return false;
    }
    setShippingOptionRaw(id);
    return true;
  }, []);

  const addItem = useCallback((product, size, color) => {
    dispatch({ type: 'ADD_ITEM', payload: { ...product, size, color } });
  }, []);

  const removeItem = useCallback((id, size, color) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id, size, color } });
  }, []);

  const updateQuantity = useCallback((id, size, color, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, size, color, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  // All amounts below are customer rupees (markup already applied). The server recomputes
  // them independently at checkout; these are for display only.
  const totals = computeTotals(
    state.items.map((item) => ({ basePrice: item.price, quantity: item.quantity })),
    shippingOption
  );
  const subtotal = totals.subtotal;
  const shipping = totals.shipping;
  const total = totals.total;
  const shippingFee = shipping;
  const visibleSubtotal = subtotal;

  return (
    <CartContext.Provider
      value={{
        ...state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        shipping,
        total,
        shippingOption,
        setShippingOption,
        shippingFee,
        visibleSubtotal,
        shippingTiers: SHIPPING_TIERS,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
