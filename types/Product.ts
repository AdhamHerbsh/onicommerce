import { ImageDimensions, SeoData, CloudinaryUploadResult } from './Common'

export interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  comparePrice?: number
  weight?: number
  inventory: number
  image?: CloudinaryUploadResult
  attributes: Record<string, string>
}

export interface ProductSpecification {
  name: string
  value: string
  displayValue?: string
}

export interface ProductReview {
  id: string
  userId: string
  userName: string
  rating: number
  title?: string
  content: string
  images?: CloudinaryUploadResult[]
  verified: boolean
  helpful: number
  createdAt: string
  updatedAt: string
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  image?: CloudinaryUploadResult
  parentId?: string
  level: number
  isActive: boolean
  seo?: SeoData
}

export interface ProductTag {
  id: string
  name: string
  slug: string
  color?: string
}

export interface ProductImage extends CloudinaryUploadResult {
  alt: string
  caption?: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductPrice {
  amount: number
  currency: string
  compareAtPrice?: number
  cost?: number
}

export interface ProductInventory {
  quantity: number
  lowStockThreshold: number
  allowBackorder: boolean
  trackQuantity: boolean
  stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder'
}

export interface ProductShipping {
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

export interface Product {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  sku: string
  barcode?: string
  price: ProductPrice
  images: ProductImage[]
  categories: ProductCategory[]
  tags: ProductTag[]
  variants?: ProductVariant[]
  specifications: ProductSpecification[]
  inventory: ProductInventory
  shipping: ProductShipping
  seo?: SeoData
  status: 'draft' | 'active' | 'archived'
  featured: boolean
  isActive: boolean
  vendor?: string
  brand?: string
  requiresShipping: boolean
  taxable: boolean
  taxClass?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  totalSales: number
  averageRating: number
  reviewCount: number
  metadata?: Record<string, any>
}

export interface CreateProductData {
  name: string
  description: string
  shortDescription?: string
  sku: string
  barcode?: string
  price: {
    amount: number
    currency: string
    compareAtPrice?: number
    cost?: number
  }
  images: ProductImage[]
  categoryIds: string[]
  tagIds?: string[]
  variants?: Omit<ProductVariant, 'id'>[]
  specifications: ProductSpecification[]
  inventory: Partial<ProductInventory>
  shipping: Partial<ProductShipping>
  seo?: SeoData
  status: 'draft' | 'active'
  featured?: boolean
  isActive?: boolean
  vendor?: string
  brand?: string
  requiresShipping?: boolean
  taxable?: boolean
  taxClass?: string
  metadata?: Record<string, any>
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

export interface ProductFilters {
  category?: string
  categories?: string[]
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  featured?: boolean
  inStock?: boolean
  status?: string
  vendor?: string
  brand?: string
  search?: string
  sortBy?: 'name' | 'price' | 'createdAt' | 'sales' | 'rating'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}