import jwt from 'jsonwebtoken'
import { UserRole } from '@/types/Common'
import { IAdmin } from '@/models/Admin'

// JWT Payload interface
export interface JWTPayload {
  id: string
  email: string
  role: UserRole
  permissions: string[]
  iat?: number
  exp?: number
}

// Token pair interface
export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// Authentication response interface
export interface AuthResponse {
  user: Partial<IAdmin>
  tokens: TokenPair
}

// Token verification result
export interface TokenVerificationResult {
  valid: boolean
  payload?: JWTPayload
  error?: string
  expired?: boolean
}

// Configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your-super-secret-access-token',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || 'your-super-secret-refresh-token',
  ACCESS_TOKEN_EXPIRES_IN: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256' as const,
}

/**
 * Validates JWT configuration
 */
export function validateJWTConfig(): { isValid: boolean; error?: string } {
  if (!JWT_CONFIG.ACCESS_TOKEN_SECRET) {
    return { isValid: false, error: 'JWT_ACCESS_TOKEN_SECRET is not configured' }
  }

  if (!JWT_CONFIG.REFRESH_TOKEN_SECRET) {
    return { isValid: false, error: 'JWT_REFRESH_TOKEN_SECRET is not configured' }
  }

  return { isValid: true }
}

/**
 * Generates an access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const configValidation = validateJWTConfig()
  if (!configValidation.isValid) {
    throw new Error(configValidation.error)
  }

  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    algorithm: JWT_CONFIG.ALGORITHM,
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  })
}

/**
 * Generates a refresh token
 */
export function generateRefreshToken(payload: Pick<JWTPayload, 'id' | 'email'>): string {
  const configValidation = validateJWTConfig()
  if (!configValidation.isValid) {
    throw new Error(configValidation.error)
  }

  return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    algorithm: JWT_CONFIG.ALGORITHM,
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  })
}

/**
 * Generates a token pair (access and refresh tokens)
 */
export function generateTokenPair(user: IAdmin): TokenPair {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    id: user._id.toString(),
    email: user.email,
    role: user.role as UserRole,
    permissions: user.permissions || [],
  }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken({
    id: user._id.toString(),
    email: user.email,
  })

  return { accessToken, refreshToken }
}

/**
 * Verifies an access token
 */
export function verifyAccessToken(token: string): TokenVerificationResult {
  try {
    const configValidation = validateJWTConfig()
    if (!configValidation.isValid) {
      return { valid: false, error: configValidation.error }
    }

    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as JWTPayload

    return { valid: true, payload: decoded }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token has expired',
        expired: true,
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      }
    }

    return {
      valid: false,
      error: 'Token verification failed',
    }
  }
}

/**
 * Verifies a refresh token
 */
export function verifyRefreshToken(token: string): TokenVerificationResult {
  try {
    const configValidation = validateJWTConfig()
    if (!configValidation.isValid) {
      return { valid: false, error: configValidation.error }
    }

    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as Pick<JWTPayload, 'id' | 'email'>

    return { valid: true, payload: decoded }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Refresh token has expired',
        expired: true,
      }
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid refresh token',
      }
    }

    return {
      valid: false,
      error: 'Refresh token verification failed',
    }
  }
}

/**
 * Extracts token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Checks if a user has the required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission) ||
         userPermissions.includes('admin_write') || // Super admin permission
         userPermissions.includes('admin_read')
}

/**
 * Checks if a user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission))
}

/**
 * Checks if a user has the required role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 0,
    admin: 1,
    moderator: 2,
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Creates authentication response object
 */
export function createAuthResponse(user: IAdmin): AuthResponse {
  const tokens = generateTokenPair(user)

  // Remove sensitive information from user object
  const userResponse: Partial<IAdmin> = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    avatar: user.avatar,
    phone: user.phone,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }

  return { user: userResponse, tokens }
}

/**
 * Middleware to verify JWT token from request
 */
export function requireAuth(handler: (req: any, res: any, user: JWTPayload) => void) {
  return (req: any, res: any) => {
    const token = extractTokenFromHeader(req.headers.authorization)

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required',
      })
    }

    const verification = verifyAccessToken(token)

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        error: verification.error,
      })
    }

    handler(req, res, verification.payload!)
  }
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: string) {
  return (handler: (req: any, res: any, user: JWTPayload) => void) => {
    return requireAuth((req: any, res: any, user: JWTPayload) => {
      if (!hasPermission(user.permissions, permission)) {
        return res.status(403).json({
          success: false,
          error: `Permission '${permission}' is required`,
        })
      }

      handler(req, res, user)
    })
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(role: UserRole) {
  return (handler: (req: any, res: any, user: JWTPayload) => void) => {
    return requireAuth((req: any, res: any, user: JWTPayload) => {
      if (!hasRole(user.role, role)) {
        return res.status(403).json({
          success: false,
          error: `Role '${role}' is required`,
        })
      }

      handler(req, res, user)
    })
  }
}

/**
 * Refreshes access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const verification = verifyRefreshToken(refreshToken)

    if (!verification.valid) {
      return {
        success: false,
        error: verification.error,
      }
    }

    // In a real application, you would fetch the user from the database
    // to get the latest permissions and role
    const payload = verification.payload!
    const newAccessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
      role: 'admin', // This should come from database
      permissions: [], // This should come from database
    })

    return { success: true, accessToken: newAccessToken }
  } catch (error) {
    return {
      success: false,
      error: 'Token refresh failed',
    }
  }
}

/**
 * Decodes a token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Gets token expiration time
 */
export function getTokenExpirationTime(token: string): Date | null {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return null
  }

  return new Date(decoded.exp * 1000)
}

/**
 * Checks if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const expirationTime = getTokenExpirationTime(token)
  if (!expirationTime) {
    return true
  }

  return expirationTime < new Date()
}