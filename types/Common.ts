export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type UserRole = 'admin' | 'user'

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface ContactInfo {
  email: string
  phone?: string
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  format: string
  width: number
  height: number
  bytes: number
  created_at: string
}

export interface ImageDimensions {
  width: number
  height: number
}

export interface SeoData {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
}

export interface FilterOptions {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  featured?: boolean
  tags?: string[]
}