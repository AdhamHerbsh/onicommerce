import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryUploadResult } from '@/types/Common'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadOptions {
  folder?: string
  resource_type?: 'image' | 'video' | 'auto'
  quality?: 'auto' | 'good' | 'best' | 'eco' | 'low'
  format?: string
  width?: number
  height?: number
  crop?: 'scale' | 'fit' | 'fill' | 'limit' | 'pad' | 'crop'
  gravity?: 'auto' | 'center' | 'face' | 'north' | 'south' | 'east' | 'west'
  public_id?: string
  overwrite?: boolean
  invalidate?: boolean
  eager?: string[]
  tags?: string[]
  context?: Record<string, string>
}

export interface UploadResponse extends CloudinaryUploadResult {
  error?: string
}

/**
 * Uploads a file to Cloudinary
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  try {
    const uploadOptions = {
      folder: options.folder || 'onicommerce',
      resource_type: options.resource_type || 'auto',
      quality: options.quality || 'auto',
      format: options.format,
      width: options.width,
      height: options.height,
      crop: options.crop,
      gravity: options.gravity,
      public_id: options.public_id,
      overwrite: options.overwrite || true,
      invalidate: options.invalidate || true,
      eager: options.eager,
      tags: options.tags || ['onicommerce'],
      context: options.context,
    }

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        file,
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve(result as CloudinaryUploadResult)
          }
        }
      )
    })

    return result
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return {
      error: error instanceof Error ? error.message : 'Upload failed',
      public_id: '',
      secure_url: '',
      format: '',
      width: 0,
      height: 0,
      bytes: 0,
      created_at: ''
    }
  }
}

/**
 * Uploads multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: (string | Buffer)[],
  options: UploadOptions = {}
): Promise<UploadResponse[]> {
  const uploadPromises = files.map((file, index) => {
    const fileOptions = {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
    }
    return uploadToCloudinary(file, fileOptions)
  })

  return Promise.all(uploadPromises)
}

/**
 * Deletes a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await new Promise<{ success: boolean; error?: string }>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve({ success: (result as any).result === 'ok' })
          }
        }
      )
    })

    return result
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    }
  }
}

/**
 * Deletes multiple files from Cloudinary
 */
export async function deleteMultipleFromCloudinary(
  publicIds: string[]
): Promise<{ success: boolean; error?: string }[]> {
  const deletePromises = publicIds.map(publicId => deleteFromCloudinary(publicId))
  return Promise.all(deletePromises)
}

/**
 * Generates a Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  transformations: {
    width?: number
    height?: number
    crop?: string
    gravity?: string
    quality?: string
    format?: string
    [key: string]: any
  } = {}
): string {
  return cloudinary.url(publicId, {
    secure: true,
    quality: transformations.quality || 'auto',
    ...transformations
  })
}

/**
 * Generates product image URLs with different sizes
 */
export function generateProductImageUrls(
  publicId: string,
  alt?: string
): {
  thumbnail: string
  small: string
  medium: string
  large: string
  original: string
  alt: string
} {
  return {
    thumbnail: generateCloudinaryUrl(publicId, {
      width: 100,
      height: 100,
      crop: 'fill',
      gravity: 'auto'
    }),
    small: generateCloudinaryUrl(publicId, {
      width: 300,
      height: 300,
      crop: 'fill',
      gravity: 'auto'
    }),
    medium: generateCloudinaryUrl(publicId, {
      width: 600,
      height: 600,
      crop: 'fill',
      gravity: 'auto'
    }),
    large: generateCloudinaryUrl(publicId, {
      width: 1200,
      height: 1200,
      crop: 'limit',
      quality: 'best'
    }),
    original: generateCloudinaryUrl(publicId),
    alt: alt || ''
  }
}

/**
 * Validates Cloudinary configuration
 */
export function validateCloudinaryConfig(): { isValid: boolean; error?: string } {
  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      return {
        isValid: false,
        error: `Missing environment variable: ${envVar}`
      }
    }
  }

  return { isValid: true }
}

/**
 * Gets Cloudinary configuration info
 */
export function getCloudinaryConfig(): {
  cloudName: string
  folder: string
  uploadPreset?: string
} {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    folder: 'onicommerce',
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET
  }
}

/**
 * Creates a signed upload URL for client-side uploads
 */
export function createUploadSignature(
  params: Record<string, any> = {},
  options: { folder?: string; tags?: string[] } = {}
): {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
  folder: string
} {
  const timestamp = Math.round(new Date().getTime() / 1000)

  const uploadParams = {
    timestamp,
    folder: options.folder || 'onicommerce',
    tags: options.tags?.join(',') || 'onicommerce',
    ...params
  }

  const signature = cloudinary.utils.api_sign_request(
    uploadParams,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: uploadParams.folder
  }
}

/**
 * Extracts public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const regex = /\/(?:v\d+\/)?([^\/]+)$/
    const match = url.match(regex)
    return match ? match[1].replace(/\.[^.]+$/, '') : null
  } catch (error) {
    console.error('Error extracting public ID from URL:', error)
    return null
  }
}

/**
 * Optimizes image URL for web delivery
 */
export function optimizeImageUrl(
  publicId: string,
  options: {
    format?: 'webp' | 'avif' | 'auto'
    quality?: number
    width?: number
    height?: number
    crop?: string
    dpr?: number
  } = {}
): string {
  const optimizations = {
    format: options.format || 'auto',
    quality: options.quality || 'auto:good',
    fetch_format: 'auto',
    dpr: options.dpr || 'auto',
    ...options
  }

  return generateCloudinaryUrl(publicId, optimizations)
}