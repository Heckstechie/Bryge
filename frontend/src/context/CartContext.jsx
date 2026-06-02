import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!user || user.role !== 'customer') { setCartCount(0); return; }
    try {
      const { data } = await api.get('/cart');
      setCartCount(data.items?.length ?? 0);
    } catch { setCartCount(0); }
  }, [user]);

  useEffect(() => { refreshCount(); }, [refreshCount]);

  async function addToCart(productId, variantId = null, quantity = 1) {
    if (!user) throw new Error('Please log in to add items to your cart');
    await api.post('/cart/add', {
      product_id:         productId,
      product_variant_id: variantId || undefined,
      quantity,
    });
    await refreshCount();
  }

  return (
    <CartContext.Provider value={{ cartCount, addToCart, refreshCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
