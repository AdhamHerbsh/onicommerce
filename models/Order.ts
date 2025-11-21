import mongoose, { Document, Schema } from 'mongoose'
import { IProduct } from './Product'

export interface IOrderAddress {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface IOrderCustomer {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  billingAddress: IOrderAddress
  shippingAddress?: IOrderAddress
  isGuest?: boolean
}

export interface IOrderItem {
  productId: string
  product: IProduct
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

export interface IOrderShipping {
  method: string
  carrier?: string
  trackingNumber?: string
  trackingUrl?: string
  estimatedDelivery?: Date
  actualDelivery?: Date
  cost: number
  address: IOrderAddress
}

export interface IOrderPayment {
  method: 'credit_card' | 'debit_card' | 'paypal' | 'stripe' | 'cash_on_delivery'
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  amount: number
  currency: string
  transactionId?: string
  gateway?: string
  paidAt?: Date
  refundId?: string
  refundAmount?: number
  refundReason?: string
  refundedAt?: Date
}

export interface IOrderDiscount {
  code?: string
  type: 'percentage' | 'fixed_amount' | 'free_shipping'
  value: number
  description: string
}

export interface IOrderTax {
  name: string
  rate: number
  amount: number
  isCompound?: boolean
}

export interface IOrderStatusHistory {
  status: string
  timestamp: Date
  note?: string
  notifyCustomer: boolean
}

export interface IOrderNote {
  content: string
  isCustomerVisible: boolean
  createdAt: Date
  createdBy?: {
    id: string
    name: string
    email: string
  }
}

export interface IOrder extends Document {
  orderNumber: string
  customer: IOrderCustomer
  items: IOrderItem[]
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  payment: IOrderPayment
  shipping: IOrderShipping
  subtotal: number
  discounts: IOrderDiscount[]
  taxAmount: number
  taxes: IOrderTax[]
  shippingAmount: number
  total: number
  currency: string
  notes: IOrderNote[]
  statusHistory: IOrderStatusHistory[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  generateOrderNumber(): string
  updateStatus(status: string, note?: string, notifyCustomer?: boolean): void
  addNote(content: string, isCustomerVisible: boolean, createdBy?: any): void
  calculateTotals(): void
}

const orderAddressSchema = new Schema<IOrderAddress>({
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  }
}, { _id: false })

const orderCustomerSchema = new Schema<IOrderCustomer>({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: String,
  company: String,
  billingAddress: {
    type: orderAddressSchema,
    required: true
  },
  shippingAddress: orderAddressSchema,
  isGuest: {
    type: Boolean,
    default: true
  }
}, { _id: false })

const orderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: String,
    required: true,
    ref: 'Product'
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    id: String,
    name: String,
    sku: String,
    attributes: {
      type: Map,
      of: String
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  discountedPrice: Number,
  discountedTotal: Number
}, { _id: false })

const orderShippingSchema = new Schema<IOrderShipping>({
  method: {
    type: String,
    required: true
  },
  carrier: String,
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  address: {
    type: orderAddressSchema,
    required: true
  }
}, { _id: false })

const orderPaymentSchema = new Schema<IOrderPayment>({
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  transactionId: String,
  gateway: String,
  paidAt: Date,
  refundId: String,
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date
}, { _id: false })

const orderDiscountSchema = new Schema<IOrderDiscount>({
  code: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  }
}, { _id: false })

const orderTaxSchema = new Schema<IOrderTax>({
  name: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  isCompound: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const orderStatusHistorySchema = new Schema<IOrderStatusHistory>({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: String,
  notifyCustomer: {
    type: Boolean,
    default: true
  }
}, { _id: false })

const orderNoteSchema = new Schema<IOrderNote>({
  content: {
    type: String,
    required: true
  },
  isCustomerVisible: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    id: String,
    name: String,
    email: String
  }
}, { _id: false })

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  customer: {
    type: orderCustomerSchema,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  payment: {
    type: orderPaymentSchema,
    required: true
  },
  shipping: {
    type: orderShippingSchema,
    required: true
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discounts: [orderDiscountSchema],
  taxAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxes: [orderTaxSchema],
  shippingAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  notes: [orderNoteSchema],
  statusHistory: [orderStatusHistorySchema],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
})

// Indexes
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ 'customer.email': 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ 'payment.status': 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ total: -1 })
orderSchema.index({ 'items.productId': 1 })

// Virtuals
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total: number, item: IOrderItem) => total + item.quantity, 0)
})

orderSchema.virtual('totalWeight').get(function() {
  return this.items.reduce((total: number, item: IOrderItem) => {
    const weight = item.product.shipping?.weight || 0
    return total + (weight * item.quantity)
  }, 0)
})

// Pre-save middleware
orderSchema.pre('save', function(next) {
  // Generate order number if not provided
  if (!this.orderNumber) {
    this.orderNumber = this.generateOrderNumber()
  }

  // Calculate totals
  this.calculateTotals()

  // Add initial status history
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: 'Order created',
      notifyCustomer: true
    })
  }

  next()
})

// Instance methods
orderSchema.methods.generateOrderNumber = function(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `ORD-${timestamp}-${random}`
}

orderSchema.methods.updateStatus = function(status: string, note?: string, notifyCustomer: boolean = true): void {
  if (this.status !== status) {
    this.status = status
    this.statusHistory.push({
      status,
      timestamp: new Date(),
      note,
      notifyCustomer
    })

    // Handle status-specific logic
    switch (status) {
      case 'delivered':
        this.shipping.actualDelivery = new Date()
        break
      case 'cancelled':
        // Cancel payment logic would go here
        break
      case 'refunded':
        // Refund logic would go here
        break
    }
  }
}

orderSchema.methods.addNote = function(content: string, isCustomerVisible: boolean = false, createdBy?: any): void {
  this.notes.push({
    content,
    isCustomerVisible,
    createdAt: new Date(),
    createdBy
  })
}

orderSchema.methods.calculateTotals = function(): void {
  // Calculate subtotal
  this.subtotal = this.items.reduce((total: number, item: IOrderItem) => {
    return total + (item.discountedTotal || item.total)
  }, 0)

  // Calculate shipping amount
  this.shippingAmount = this.shipping.cost

  // Apply free shipping discount if applicable
  const hasFreeShipping = this.discounts.some((discount: IOrderDiscount) =>
    discount.type === 'free_shipping'
  )
  if (hasFreeShipping) {
    this.shippingAmount = 0
  }

  // Calculate total
  this.total = this.subtotal + this.taxAmount + this.shippingAmount
}

// Static methods
orderSchema.statics.findByCustomer = function(customerEmail: string) {
  return this.find({ 'customer.email': customerEmail }).sort({ createdAt: -1 })
}

orderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: -1 })
}

orderSchema.statics.search = function(query: string) {
  return this.find({
    $or: [
      { orderNumber: { $regex: query, $options: 'i' } },
      { 'customer.email': { $regex: query, $options: 'i' } },
      { 'customer.firstName': { $regex: query, $options: 'i' } },
      { 'customer.lastName': { $regex: query, $options: 'i' } }
    ]
  }).sort({ createdAt: -1 })
}

const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema)

export default Order