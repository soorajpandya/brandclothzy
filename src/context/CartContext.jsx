import { createContext, useContext, useReducer, useCallback, useState } from 'react';

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
              ? { ...item, quantity: item.quantity + 1 }
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
            ? { ...item, quantity: Math.max(1, action.payload.quantity) }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const SHIPPING_TIERS = [
  {
    id: 'standard',
    title: 'Standard Delivery',
    timeline: '5–7 business days',
    price: 49,
    basePrice: 35,
    freeAbove: 999,
  },
  {
    id: 'express',
    title: 'Express Delivery',
    timeline: '2–3 business days',
    price: 99,
    basePrice: 71,
  },
  {
    id: 'same-day',
    title: 'Same-Day Delivery (Delhi NCR)',
    timeline: 'Available for orders placed before 12PM',
    price: 149,
    basePrice: 106,
  },
];

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [shippingOption, setShippingOption] = useState('standard');

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
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const visibleSubtotal = Math.round(subtotal * 1.4);

  // Compute shipping based on selected tier
  let shipping = 0;
  let shippingFee = 0;

  if (shippingOption === 'standard') {
    if (visibleSubtotal >= 999) {
      shipping = 0;
      shippingFee = 0;
    } else {
      shipping = 35; // 35 * 1.4 = 49
      shippingFee = 49;
    }
  } else if (shippingOption === 'express') {
    shipping = 71; // 71 * 1.4 = 99.4 -> 99
    shippingFee = 99;
  } else if (shippingOption === 'same-day') {
    shipping = 106; // 106 * 1.4 = 148.4 -> 149
    shippingFee = 149;
  }

  const total = subtotal + shipping;

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
