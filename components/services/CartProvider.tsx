'use client';
// components/services/CartProvider.tsx
// Holds the additional-services basket, persisted to localStorage so it survives
// the hop from /additional-services to the checkout page.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { OrderSelection } from '@/lib/serviceCart';
import { cartTotal } from '@/lib/serviceCart';

const STORAGE_KEY = 'hol-service-cart-v1';

type CartCtx = {
  items: OrderSelection[];
  count: number;
  total: number;
  ready: boolean;
  addItem: (item: OrderSelection) => void;
  updateItem: (uid: string, patch: Partial<OrderSelection>) => void;
  removeItem: (uid: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderSelection[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  // Persist on change (after the initial load).
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items, ready]);

  const addItem = (item: OrderSelection) => setItems(prev => [...prev, item]);
  const updateItem = (uid: string, patch: Partial<OrderSelection>) =>
    setItems(prev => prev.map(it => (it.uid === uid ? { ...it, ...patch } : it)));
  const removeItem = (uid: string) => setItems(prev => prev.filter(it => it.uid !== uid));
  const clear = () => setItems([]);

  const value: CartCtx = {
    items,
    count: items.reduce((n, it) => n + (it.quantity || 1), 0),
    total: cartTotal(items),
    ready,
    addItem,
    updateItem,
    removeItem,
    clear,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
