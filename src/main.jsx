import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UIProvider } from './context/UIContext';
import { SellerProvider } from './context/SellerContext';
import { MarketplaceProvider } from './context/MarketplaceContext';
import './index.css';
import { initAnalytics } from './utils/analytics';

// Loads GA4 / Meta Pixel / Clarity only if the visitor has accepted cookies.
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <SellerProvider>
            <MarketplaceProvider>
              <UIProvider>
                <WishlistProvider>
                  <CartProvider>
                    <App />
                  </CartProvider>
                </WishlistProvider>
              </UIProvider>
            </MarketplaceProvider>
          </SellerProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
