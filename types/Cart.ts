import { Product } from './Product'

export interface CartItem {
  id: string
  productId: string
  product: Product
  variant?: {
    id: string
    name: string
    sku: string
    attributes: Record<string, string>
    price: number
  }
  quantity: number
  price: number
  total: number
}

export interface CartSummary {
  subtotal: number
  taxAmount: number
  shippingAmount: number
  discountAmount: number
  total: number
  itemCount: number
  weight: number
}

export interface CartDiscount {
  code: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  description: string
  appliedAt?: string
}

export interface CartShipping {
  method: string
  cost: number
  estimatedDays: number
  carrier?: string
}

export interface CartState {
  items: CartItem[]
  summary: CartSummary
  discounts: CartDiscount[]
  shipping?: CartShipping
  isInitialized: boolean
  isLoading: boolean
  error?: string
}

export interface CartContextType {
  cart: CartState
  addItem: (item: Omit<CartItem, 'id' | 'total'>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  applyDiscount: (discount: CartDiscount) => void
  removeDiscount: (code: string) => void
  setShippingMethod: (shipping: CartShipping) => void
  getTotalWeight: () => number
  getTotalItems: () => number
  isInCart: (productId: string, variantId?: string) => boolean
  getCartItem: (productId: string, variantId?: string) => CartItem | null
  syncWithServer: () => Promise<void>
  calculateSummary: () => void
}