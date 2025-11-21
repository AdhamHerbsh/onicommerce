import { Address, ContactInfo, OrderStatus, PaymentStatus } from './Common'
import { Product } from './Product'

export interface OrderItem {
  _id: string
  productId: string
  product: Product
  variant?: {
    id: string
    name: string
    sku: string
    attributes: Record<string, string>
  }
  quantity: number
  price: number
  total: number
  discountedPrice?: number
  discountedTotal?: number
}

export interface OrderShipping {
  method: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: string
  actualDelivery?: string
  cost: number
  address: Address
}

export interface OrderPayment {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'cash_on_delivery'
  status: PaymentStatus
  amount: number
  currency: string
  transactionId?: string
  gateway?: string
  paidAt?: string
  refundId?: string
  refundAmount?: number
  refundReason?: string
  refundedAt?: string
}

export interface OrderCustomer {
  _id?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  billingAddress: Address
  shippingAddress?: Address
  isGuest?: boolean
}

export interface OrderDiscount {
  code?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  description: string
}

export interface OrderTax {
  name: string
  rate: number
  amount: number
  isCompound?: boolean
}

export interface OrderNote {
  _id: string
  content: string
  isCustomerVisible: boolean
  createdAt: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
}

export interface Order {
  _id: string
  orderNumber: string
  customer: OrderCustomer
  items: OrderItem[]
  status: OrderStatus
  payment: OrderPayment
  shipping: OrderShipping
  subtotal: number
  discounts: OrderDiscount[]
  taxAmount: number
  taxes: OrderTax[]
  shippingAmount: number
  total: number
  currency: string
  notes: OrderNote[]
  statusHistory: {
    status: OrderStatus
    timestamp: string
    note?: string
    notifyCustomer: boolean
  }[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderData {
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    company?: string
    billingAddress: Address
    shippingAddress?: Address
    isGuest?: boolean
  }
  items: {
    productId: string
    variantId?: string
    quantity: number
  }[]
  shipping: {
    method: string
    address: Address
  }
  payment: {
    method: string
    gateway?: string
  }
  discountCode?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface UpdateOrderData {
  status?: OrderStatus
  payment?: Partial<OrderPayment>
  shipping?: Partial<OrderShipping>
  notes?: string
  customerNote?: string
  metadata?: Record<string, any>
}

export interface OrderFilters {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  customerEmail?: string
  orderNumber?: string
  dateFrom?: string
  dateTo?: string
  totalMin?: number
  totalMax?: number
  search?: string
  sortBy?: 'createdAt' | 'total' | 'orderNumber'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface OrderStats {
  total: number
  totalAmount: number
  averageOrderValue: number
  statusCounts: Record<OrderStatus, number>
  recentOrders: Order[]
}