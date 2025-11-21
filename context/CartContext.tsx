'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { CartState, CartContextType, CartItem, CartDiscount, CartShipping } from '@/types/Cart'
import { Product } from '@/types/Product'

// Cart storage key
const CART_STORAGE_KEY = 'onicommerce-cart'

// Initial cart state
const initialState: CartState = {
  items: [],
  summary: {
    subtotal: 0,
    taxAmount: 0,
    shippingAmount: 0,
    discountAmount: 0,
    total: 0,
    itemCount: 0,
    weight: 0,
  },
  discounts: [],
  shipping: undefined,
  isInitialized: false,
  isLoading: false,
  error: undefined,
}

// Action types
type CartAction =
  | { type: 'INITIALIZE_CART'; payload: CartState }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'APPLY_DISCOUNT'; payload: CartDiscount }
  | { type: 'REMOVE_DISCOUNT'; payload: string }
  | { type: 'SET_SHIPPING'; payload: CartShipping }
  | { type: 'CALCULATE_SUMMARY' }

// Reducer function
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'INITIALIZE_CART':
      return { ...action.payload, isInitialized: true }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.productId === action.payload.productId &&
          item.variant?.id === action.payload.variant?.id
      )

      let newItems: CartItem[]

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? {
                ...item,
                quantity: item.quantity + action.payload.quantity,
                total: (item.quantity + action.payload.quantity) * (action.payload.variant?.price || item.price),
              }
            : item
        )
      } else {
        // Add new item
        newItems = [...state.items, action.payload]
      }

      return {
        ...state,
        items: newItems,
      }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((item) => item.id !== id),
        }
      }

      return {
        ...state,
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, quantity, total: quantity * (item.variant?.price || item.price) }
            : item
        ),
      }
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        discounts: [],
        shipping: undefined,
      }

    case 'APPLY_DISCOUNT':
      return {
        ...state,
        discounts: [...state.discounts.filter(d => d.code !== action.payload.code), action.payload],
      }

    case 'REMOVE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.filter((d) => d.code !== action.payload),
      }

    case 'SET_SHIPPING':
      return {
        ...state,
        shipping: action.payload,
      }

    case 'CALCULATE_SUMMARY':
      return {
        ...state,
        summary: calculateCartSummary(state.items, state.discounts, state.shipping),
      }

    default:
      return state
  }
}

// Calculate cart summary
function calculateCartSummary(
  items: CartItem[],
  discounts: CartDiscount[],
  shipping?: CartShipping
): CartState['summary'] {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const weight = items.reduce((sum, item) => {
    const itemWeight = item.product.shipping?.weight || 0
    return sum + (itemWeight * item.quantity)
  }, 0)

  let discountAmount = 0
  let shippingAmount = shipping?.cost || 0

  // Apply discounts
  discounts.forEach((discount) => {
    switch (discount.type) {
      case 'percentage':
        discountAmount += (subtotal * discount.value) / 100
        break
      case 'fixed_amount':
        discountAmount += Math.min(discount.value, subtotal)
        break
      case 'free_shipping':
        shippingAmount = 0
        break
    }
  })

  // Calculate tax (assuming 8% tax rate - this should come from configuration)
  const taxRate = 0.08
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * taxRate

  const total = taxableAmount + taxAmount + shippingAmount

  return {
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount,
    total,
    itemCount,
    weight,
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Calculate summary whenever items, discounts, or shipping change
  useEffect(() => {
    if (state.isInitialized) {
      dispatch({ type: 'CALCULATE_SUMMARY' })
    }
  }, [state.items, state.discounts, state.shipping, state.isInitialized])

  // Initialize cart from localStorage
  useEffect(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      const savedCart = localStorage.getItem(CART_STORAGE_KEY)
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'INITIALIZE_CART', payload: cartData })
      } else {
        dispatch({ type: 'INITIALIZE_CART', payload: initialState })
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
      dispatch({ type: 'INITIALIZE_CART', payload: initialState })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.isInitialized) {
      try {
        const cartToSave = {
          ...state,
          error: undefined, // Don't save errors to localStorage
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartToSave))
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error)
      }
    }
  }, [state, state.isInitialized])

  // Cart utility functions
  const addItem = useCallback((item: Omit<CartItem, 'id' | 'total'>) => {
    const cartItem: CartItem = {
      ...item,
      id: `${item.productId}-${item.variant?.id || 'default'}`,
      total: item.quantity * (item.variant?.price || item.price),
    }
    dispatch({ type: 'ADD_ITEM', payload: cartItem })
  }, [])

  const removeItem = useCallback((itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } })
  }, [])

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' })
  }, [])

  const applyDiscount = useCallback((discount: CartDiscount) => {
    dispatch({ type: 'APPLY_DISCOUNT', payload: discount })
  }, [])

  const removeDiscount = useCallback((code: string) => {
    dispatch({ type: 'REMOVE_DISCOUNT', payload: code })
  }, [])

  const setShippingMethod = useCallback((shipping: CartShipping) => {
    dispatch({ type: 'SET_SHIPPING', payload: shipping })
  }, [])

  const getTotalWeight = useCallback(() => {
    return state.summary.weight
  }, [state.summary.weight])

  const getTotalItems = useCallback(() => {
    return state.summary.itemCount
  }, [state.summary.itemCount])

  const isInCart = useCallback(
    (productId: string, variantId?: string) => {
      return state.items.some(
        (item) =>
          item.productId === productId &&
          item.variant?.id === variantId
      )
    },
    [state.items]
  )

  const getCartItem = useCallback(
    (productId: string, variantId?: string) => {
      return (
        state.items.find(
          (item) =>
            item.productId === productId &&
            item.variant?.id === variantId
        ) || null
      )
    },
    [state.items]
  )

  const syncWithServer = useCallback(async () => {
    // This would sync the cart with the server
    // Implementation depends on your backend API
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      // TODO: Implement server sync
      console.log('Syncing cart with server...')
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to sync cart with server' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const calculateSummary = useCallback(() => {
    dispatch({ type: 'CALCULATE_SUMMARY' })
  }, [])

  const contextValue: CartContextType = {
    cart: state,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount,
    removeDiscount,
    setShippingMethod,
    getTotalWeight,
    getTotalItems,
    isInCart,
    getCartItem,
    syncWithServer,
    calculateSummary,
  }

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

// Export the context for testing purposes
export { CartContext }