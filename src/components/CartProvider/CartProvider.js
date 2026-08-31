'use client';

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

import { CART_ACTIONS, cartReducer } from '../../lib/cartReducer';
import { readCart, writeCart } from '../../lib/cartStorage';

export const CartContext = createContext(null);

const INITIAL_STATE = { items: [] };

export default function CartProvider({ children }) {
  // Always start empty so server-rendered and first client-rendered markup match.
  const [state, dispatch] = useReducer(cartReducer, INITIAL_STATE);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Hydrate from localStorage once, on the client.
  useEffect(() => {
    dispatch({ type: CART_ACTIONS.HYDRATE, items: readCart() });
    setIsReady(true);
  }, []);

  // Persist after every change — but not before hydration, or we'd clobber storage
  // with the empty initial state.
  useEffect(() => {
    if (isReady) writeCart(state.items);
  }, [state.items, isReady]);

  // Close the drawer on navigation (following "View Bag" or a product link).
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addItem = useCallback((productId, quantity = 1) => {
    dispatch({ type: CART_ACTIONS.ADD, productId, quantity });
  }, []);
  const incrementItem = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.INCREMENT, productId });
  }, []);
  const decrementItem = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.DECREMENT, productId });
  }, []);
  const setItemQuantity = useCallback((productId, quantity) => {
    dispatch({ type: CART_ACTIONS.SET_QUANTITY, productId, quantity });
  }, []);
  const removeItem = useCallback((productId) => {
    dispatch({ type: CART_ACTIONS.REMOVE, productId });
  }, []);
  const clearCart = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR });
  }, []);

  const totalQuantity = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const value = useMemo(
    () => ({
      items: state.items,
      isReady,
      totalQuantity,
      addItem,
      incrementItem,
      decrementItem,
      setItemQuantity,
      removeItem,
      clearCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [
      state.items,
      isReady,
      totalQuantity,
      addItem,
      incrementItem,
      decrementItem,
      setItemQuantity,
      removeItem,
      clearCart,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
