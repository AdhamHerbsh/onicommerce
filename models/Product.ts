import mongoose, { Document, Schema } from 'mongoose'

export interface IProductImage {
  public_id: string
  secure_url: string
  alt: string
  caption?: string
  isPrimary: boolean
  sortOrder: number
  format: string
  width: number
  height: number
}

export interface IProductVariant {
  name: string
  sku: string
  price: number
  comparePrice?: number
  weight?: number
  inventory: number
  image?: IProductImage
  attributes: Record<string, string>
}

export interface IProductSpecification {
  name: string
  value: string
  displayValue?: string
}

export interface IProductInventory {
  quantity: number
  lowStockThreshold: number
  allowBackorder: boolean
  trackQuantity: boolean
  stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder'
}

export interface IProductShipping {
  weight: number
  dimensions: {
    length: number
    width: number
    height: number
  }
  requiresShipping: boolean
  shippingClass?: string
  freeShipping: boolean
}

export interface IProductPrice {
  amount: number
  currency: string
  compareAtPrice?: number
  cost?: number
}

export interface IProductSeo {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
}

export interface IProduct extends Document {
  name: string
  slug: string
  description: string
  shortDescription?: string
  sku: string
  barcode?: string
  price: IProductPrice
  images: IProductImage[]
  categoryIds: string[]
  tagIds: string[]
  variants?: IProductVariant[]
  specifications: IProductSpecification[]
  inventory: IProductInventory
  shipping: IProductShipping
  seo?: IProductSeo
  status: 'draft' | 'active' | 'archived'
  featured: boolean
  isActive: boolean
  vendor?: string
  brand?: string
  requiresShipping: boolean
  taxable: boolean
  taxClass?: string
  totalSales: number
  averageRating: number
  reviewCount: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  generateSlug(): string
  updateStockStatus(): void
  isInStock(): boolean
  getPrimaryImage(): IProductImage | null
}

const productImageSchema = new Schema<IProductImage>({
  public_id: {
    type: String,
    required: true
  },
  secure_url: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  caption: String,
  isPrimary: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  format: String,
  width: Number,
  height: Number
}, { _id: false })

const productVariantSchema = new Schema<IProductVariant>({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  comparePrice: Number,
  weight: {
    type: Number,
    min: 0
  },
  inventory: {
    type: Number,
    required: true,
    min: 0
  },
  image: productImageSchema,
  attributes: {
    type: Map,
    of: String
  }
}, { _id: false })

const productSpecificationSchema = new Schema<IProductSpecification>({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  displayValue: String
}, { _id: false })

const productInventorySchema = new Schema<IProductInventory>({
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  allowBackorder: {
    type: Boolean,
    default: false
  },
  trackQuantity: {
    type: Boolean,
    default: true
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'on_backorder'],
    default: 'in_stock'
  }
}, { _id: false })

const productShippingSchema = new Schema<IProductShipping>({
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  dimensions: {
    length: {
      type: Number,
      required: true,
      min: 0
    },
    width: {
      type: Number,
      required: true,
      min: 0
    },
    height: {
      type: Number,
      required: true,
      min: 0
    }
  },
  requiresShipping: {
    type: Boolean,
    default: true
  },
  shippingClass: String,
  freeShipping: {
    type: Boolean,
    default: false
  }
}, { _id: false })

const productPriceSchema = new Schema<IProductPrice>({
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
  compareAtPrice: Number,
  cost: Number
}, { _id: false })

const productSeoSchema = new Schema<IProductSeo>({
  title: String,
  description: String,
  keywords: [String],
  image: String
}, { _id: false })

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  shortDescription: String,
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  barcode: String,
  price: {
    type: productPriceSchema,
    required: true
  },
  images: [productImageSchema],
  categoryIds: [{
    type: String,
    required: true
  }],
  tagIds: [String],
  variants: [productVariantSchema],
  specifications: [productSpecificationSchema],
  inventory: {
    type: productInventorySchema,
    required: true
  },
  shipping: {
    type: productShippingSchema,
    required: true
  },
  seo: productSeoSchema,
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  vendor: String,
  brand: String,
  requiresShipping: {
    type: Boolean,
    default: true
  },
  taxable: {
    type: Boolean,
    default: true
  },
  taxClass: String,
  totalSales: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  publishedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ slug: 1 })
productSchema.index({ sku: 1 })
productSchema.index({ categoryIds: 1 })
productSchema.index({ status: 1 })
productSchema.index({ isActive: 1 })
productSchema.index({ featured: 1 })
productSchema.index({ 'inventory.stockStatus': 1 })
productSchema.index({ createdAt: -1 })
productSchema.index({ averageRating: -1 })
productSchema.index({ totalSales: -1 })

// Virtuals
productSchema.virtual('isInStock').get(function() {
  if (this.inventory.allowBackorder) return true
  if (this.variants && this.variants.length > 0) {
    return this.variants.some(variant => variant.inventory > 0 || this.inventory.allowBackorder)
  }
  return this.inventory.quantity > 0
})

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug || this.isModified('name')) {
    this.slug = this.generateSlug()
  }

  // Update stock status based on inventory
  this.updateStockStatus()

  // Set publishedAt when status changes to active
  if (this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

// Instance methods
productSchema.methods.generateSlug = function(): string {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim()
}

productSchema.methods.updateStockStatus = function(): void {
  if (this.inventory.allowBackorder) {
    this.inventory.stockStatus = 'on_backorder'
  } else if (this.inventory.quantity > 0) {
    this.inventory.stockStatus = 'in_stock'
  } else {
    this.inventory.stockStatus = 'out_of_stock'
  }
}

productSchema.methods.isInStock = function(): boolean {
  if (this.inventory.allowBackorder) return true
  if (this.variants && this.variants.length > 0) {
    return this.variants.some(variant => variant.inventory > 0)
  }
  return this.inventory.quantity > 0
}

productSchema.methods.getPrimaryImage = function(): IProductImage | null {
  return this.images.find(img => img.isPrimary) || this.images[0] || null
}

// Static methods
productSchema.statics.findBySlug = function(slug: string) {
  return this.findOne({ slug, isActive: true })
}

productSchema.statics.findActive = function(filters = {}) {
  return this.find({ ...filters, isActive: true, status: 'active' })
}

productSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true, status: 'active' })
}

productSchema.statics.search = function(query: string, filters = {}) {
  return this.find({
    $and: [
      { isActive: true, status: 'active' },
      { $text: { $search: query } },
      filters
    ]
  })
}

const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema)

export default Product