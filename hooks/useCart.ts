import { useMemo } from 'react'
import { useCart } from '@/context/CartContext'
import { CartItem, CartDiscount } from '@/types/Cart'

/**
 * Enhanced cart hook with additional utility functions
 */
export function useCartEnhanced() {
  const cart = useCart()

  // Memoized calculations to avoid unnecessary re-renders
  const cartStats = useMemo(() => ({
    totalItems: cart.getTotalItems(),
    totalWeight: cart.getTotalWeight(),
    isEmpty: cart.cart.items.length === 0,
    hasItems: cart.cart.items.length > 0,
    subtotal: cart.cart.summary.subtotal,
    total: cart.cart.summary.total,
    taxAmount: cart.cart.summary.taxAmount,
    shippingAmount: cart.cart.summary.shippingAmount,
    discountAmount: cart.cart.summary.discountAmount,
    appliedDiscounts: cart.cart.discounts.length,
  }), [cart.cart.summary, cart.cart.discounts.length, cart])

  const itemsByCategory = useMemo(() => {
    const categoryMap = new Map<string, CartItem[]>()

    cart.cart.items.forEach(item => {
      const categoryNames = item.product.categories.map(cat => cat.name)
      categoryNames.forEach(categoryName => {
        const existing = categoryMap.get(categoryName) || []
        categoryMap.set(categoryName, [...existing, item])
      })
    })

    return Object.fromEntries(categoryMap)
  }, [cart.cart.items])

  const featuredItems = useMemo(() => {
    return cart.cart.items.filter(item => item.product.featured)
  }, [cart.cart.items])

  const outOfStockItems = useMemo(() => {
    return cart.cart.items.filter(item => !item.product.isInStock)
  }, [cart.cart.items])

  // Enhanced functions with better error handling
  const addItemSafely = (item: Omit<CartItem, 'id' | 'total'>) => {
    try {
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than 0')
      }

      if (!item.product.isActive) {
        throw new Error('Product is not available')
      }

      const isInStock = item.product.isInStock ||
                       (item.variant && (item.variant.inventory || 0) > 0)

      if (!isInStock) {
        throw new Error('Product is out of stock')
      }

      cart.addItem(item)
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      cart.cart.error = error instanceof Error ? error.message : 'Failed to add item to cart'
    }
  }

  const updateQuantitySafely = (itemId: string, quantity: number) => {
    try {
      if (quantity < 0) {
        throw new Error('Quantity cannot be negative')
      }

      const item = cart.cart.items.find(i => i.id === itemId)
      if (!item) {
        throw new Error('Item not found in cart')
      }

      if (quantity === 0) {
        cart.removeItem(itemId)
        return
      }

      const maxQuantity = item.variant?.inventory || item.product.inventory.quantity || 999
      if (quantity > maxQuantity) {
        throw new Error(`Only ${maxQuantity} items available in stock`)
      }

      cart.updateQuantity(itemId, quantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
      cart.cart.error = error instanceof Error ? error.message : 'Failed to update quantity'
    }
  }

  const applyDiscountSafely = (discount: CartDiscount) => {
    try {
      if (cart.cart.discounts.some(d => d.code === discount.code)) {
        throw new Error('Discount code already applied')
      }

      if (discount.value <= 0) {
        throw new Error('Discount value must be greater than 0')
      }

      if (discount.type === 'percentage' && discount.value > 100) {
        throw new Error('Percentage discount cannot exceed 100%')
      }

      cart.applyDiscount(discount)
    } catch (error) {
      console.error('Failed to apply discount:', error)
      cart.cart.error = error instanceof Error ? error.message : 'Failed to apply discount'
    }
  }

  const removeItemSafely = (itemId: string) => {
    try {
      const item = cart.cart.items.find(i => i.id === itemId)
      if (!item) {
        throw new Error('Item not found in cart')
      }

      cart.removeItem(itemId)
    } catch (error) {
      console.error('Failed to remove item:', error)
      cart.cart.error = error instanceof Error ? error.message : 'Failed to remove item'
    }
  }

  const clearCartSafely = () => {
    try {
      if (cart.cart.items.length === 0) {
        throw new Error('Cart is already empty')
      }

      cart.clearCart()
    } catch (error) {
      console.error('Failed to clear cart:', error)
      cart.cart.error = error instanceof Error ? error.message : 'Failed to clear cart'
    }
  }

  // Bulk operations
  const addMultipleItems = (items: Omit<CartItem, 'id' | 'total'>[]) => {
    items.forEach(item => addItemSafely(item))
  }

  const updateMultipleQuantities = (updates: { itemId: string; quantity: number }[]) => {
    updates.forEach(({ itemId, quantity }) => updateQuantitySafely(itemId, quantity))
  }

  // Cart validation
  const validateCart = () => {
    const errors: string[] = []

    cart.cart.items.forEach(item => {
      if (!item.product.isActive) {
        errors.push(`${item.product.name} is no longer available`)
      }

      if (!item.product.isInStock) {
        errors.push(`${item.product.name} is out of stock`)
      }

      if (item.variant && item.variant.inventory < item.quantity) {
        errors.push(`Only ${item.variant.inventory} ${item.product.name} (${item.variant.name}) available`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Cart analytics
  const getCartAnalytics = () => {
    const totalValue = cart.cart.summary.subtotal
    const averageItemPrice = cartStats.totalItems > 0 ? totalValue / cartStats.totalItems : 0
    const mostExpensiveItem = cart.cart.items.reduce((max, item) =>
      item.price > max.price ? item : max, cart.cart.items[0])

    const cheapestItem = cart.cart.items.reduce((min, item) =>
      item.price < min.price ? item : min, cart.cart.items[0])

    return {
      totalValue,
      averageItemPrice,
      mostExpensiveItem,
      cheapestItem,
      categoryDistribution: Object.keys(itemsByCategory).map(category => ({
        category,
        count: itemsByCategory[category].length,
        value: itemsByCategory[category].reduce((sum, item) => sum + item.total, 0),
      })),
      discountUsage: {
        totalSaved: cart.cart.summary.discountAmount,
        discountCodes: cart.cart.discounts.map(d => d.code),
      },
    }
  }

  return {
    ...cart,
    ...cartStats,
    itemsByCategory,
    featuredItems,
    outOfStockItems,
    addItemSafely,
    updateQuantitySafely,
    applyDiscountSafely,
    removeItemSafely,
    clearCartSafely,
    addMultipleItems,
    updateMultipleQuantities,
    validateCart,
    getCartAnalytics,
  }
}

/**
 * Hook for cart item specific operations
 */
export function useCartItem(itemId: string) {
  const { cart, updateQuantitySafely, removeItem } = useCartEnhanced()

  const item = cart.items.find(i => i.id === itemId)

  const increaseQuantity = () => {
    if (item) {
      updateQuantitySafely(itemId, item.quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (item && item.quantity > 1) {
      updateQuantitySafely(itemId, item.quantity - 1)
    }
  }

  const setQuantity = (quantity: number) => {
    updateQuantitySafely(itemId, quantity)
  }

  const remove = () => {
    removeItem(itemId)
  }

  return {
    item,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    remove,
    isInStock: item?.product.isInStock || false,
    maxQuantity: item?.variant?.inventory || item?.product.inventory.quantity || 999,
  }
}

/**
 * Hook for cart discount operations
 */
export function useCartDiscounts() {
  const { cart, applyDiscountSafely, removeDiscount } = useCartEnhanced()

  const hasDiscounts = cart.discounts.length > 0
  const totalSavings = cart.summary.discountAmount

  const removeDiscountSafely = (code: string) => {
    try {
      removeDiscount(code)
    } catch (error) {
      console.error('Failed to remove discount:', error)
    }
  }

  const clearAllDiscounts = () => {
    cart.discounts.forEach(discount => {
      removeDiscount(discount.code)
    })
  }

  return {
    discounts: cart.discounts,
    hasDiscounts,
    totalSavings,
    applyDiscount: applyDiscountSafely,
    removeDiscount: removeDiscountSafely,
    clearAllDiscounts,
  }
}