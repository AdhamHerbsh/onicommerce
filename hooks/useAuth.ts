import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { IAdmin } from '@/models/Admin'

/**
 * Enhanced authentication hook with additional utility functions
 */
export function useAuthEnhanced() {
  const auth = useAuth()

  // Memoized user properties for performance
  const userProfile = useMemo(() => {
    if (!auth.user) return null

    return {
      fullName: `${auth.user.firstName} ${auth.user.lastName}`,
      initials: `${auth.user.firstName?.[0] || ''}${auth.user.lastName?.[0] || ''}`.toUpperCase(),
      email: auth.user.email,
      role: auth.user.role,
      permissions: auth.user.permissions || [],
      isActive: auth.user.isActive || false,
      lastLogin: auth.user.lastLogin,
      avatar: auth.user.avatar,
      phone: auth.user.phone,
    }
  }, [auth.user])

  // Role-based access control helpers
  const permissions = useMemo(() => {
    const userPermissions = auth.user?.permissions || []

    return {
      canReadProducts: userPermissions.includes('product_read') || auth.hasPermission('admin_read'),
      canWriteProducts: userPermissions.includes('product_write') || auth.hasPermission('admin_write'),
      canDeleteProducts: userPermissions.includes('product_delete') || auth.hasPermission('admin_write'),

      canReadOrders: userPermissions.includes('order_read') || auth.hasPermission('admin_read'),
      canWriteOrders: userPermissions.includes('order_write') || auth.hasPermission('admin_write'),
      canDeleteOrders: userPermissions.includes('order_delete') || auth.hasPermission('admin_write'),

      canReadCustomers: userPermissions.includes('customer_read') || auth.hasPermission('admin_read'),
      canWriteCustomers: userPermissions.includes('customer_write') || auth.hasPermission('admin_write'),
      canDeleteCustomers: userPermissions.includes('customer_delete') || auth.hasPermission('admin_write'),

      canReadAnalytics: userPermissions.includes('analytics_read') || auth.hasPermission('admin_read'),
      canReadSettings: userPermissions.includes('settings_read') || auth.hasPermission('admin_read'),
      canWriteSettings: userPermissions.includes('settings_write') || auth.hasPermission('admin_write'),

      canManageAdmins: auth.hasPermission('admin_write'),
      isSuperAdmin: auth.user?.role === 'super_admin',
    }
  }, [auth.user, auth.hasPermission])

  // Session management helpers
  const sessionInfo = useMemo(() => {
    if (!auth.isAuthenticated || !auth.lastActivity) return null

    const now = new Date()
    const timeSinceActivity = now.getTime() - auth.lastActivity.getTime()
    const timeUntilTimeout = (auth.sessionTimeout * 60 * 1000) - timeSinceActivity
    const isSessionExpired = timeUntilTimeout <= 0

    return {
      lastActivity: auth.lastActivity,
      timeSinceActivity: Math.floor(timeSinceActivity / 1000), // seconds
      timeUntilTimeout: Math.floor(timeUntilTimeout / 1000), // seconds
      isSessionExpired,
      isSessionWarning: timeUntilTimeout <= 5 * 60 * 1000, // 5 minutes warning
      sessionDuration: auth.sessionTimeout, // minutes
    }
  }, [auth.isAuthenticated, auth.lastActivity, auth.sessionTimeout])

  // Enhanced login function with better error handling
  const loginSafely = async (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    try {
      await auth.login(credentials)
    } catch (error) {
      // Enhanced error handling could be added here
      throw error
    }
  }

  // Logout with confirmation
  const logoutWithConfirmation = async (message: string = 'Are you sure you want to logout?') => {
    if (window.confirm(message)) {
      auth.logout()
    }
  }

  // Force session refresh
  const refreshSession = async () => {
    try {
      await auth.refreshAccessToken()
      auth.resetSession()
      return true
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return false
    }
  }

  // Check if user can access specific route
  const canAccessRoute = (routePermissions: string[]): boolean => {
    return auth.hasAnyPermission(routePermissions)
  }

  // Get user-friendly role name
  const getRoleDisplayName = (role?: string): string => {
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Administrator',
      'moderator': 'Moderator',
      'user': 'User',
    }
    return roleMap[role || auth.user?.role || ''] || 'Unknown'
  }

  // Check if user profile is complete
  const isProfileComplete = useMemo(() => {
    if (!auth.user) return false

    const requiredFields = ['firstName', 'lastName', 'email']
    const hasRequiredFields = requiredFields.every(field => auth.user![field as keyof IAdmin])

    return hasRequiredFields && auth.user.isActive
  }, [auth.user])

  // Get authentication status as a readable status
  const getAuthStatus = useMemo(() => {
    if (auth.isLoading) return { status: 'loading', message: 'Checking authentication...' }
    if (auth.error) return { status: 'error', message: auth.error }
    if (auth.isAuthenticated) {
      if (!auth.user?.isActive) return { status: 'inactive', message: 'Account is inactive' }
      if (sessionInfo?.isSessionExpired) return { status: 'expired', message: 'Session has expired' }
      if (sessionInfo?.isSessionWarning) return { status: 'warning', message: 'Session expiring soon' }
      return { status: 'authenticated', message: 'Successfully authenticated' }
    }
    return { status: 'unauthenticated', message: 'Not authenticated' }
  }, [auth.isLoading, auth.error, auth.isAuthenticated, auth.user, sessionInfo])

  return {
    ...auth,
    userProfile,
    permissions,
    sessionInfo,
    isProfileComplete,
    getAuthStatus,
    loginSafely,
    logoutWithConfirmation,
    refreshSession,
    canAccessRoute,
    getRoleDisplayName,
  }
}

/**
 * Hook for authentication utilities and helpers
 */
export function useAuthUtils() {
  const auth = useAuth()

  // Token management
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      return payload.exp < now
    } catch {
      return true
    }
  }

  // Time until token expires (in seconds)
  const getTimeUntilTokenExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const now = Date.now() / 1000
      return Math.max(0, payload.exp - now)
    } catch {
      return 0
    }
  }

  // Parse JWT payload
  const parseTokenPayload = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]))
    } catch {
      return null
    }
  }

  // Get user from token without database hit
  const getUserFromToken = () => {
    const tokens = auth.getStoredTokens()
    if (!tokens?.accessToken) return null

    return parseTokenPayload(tokens.accessToken)
  }

  // Check if tokens exist and are valid
  const hasValidTokens = (): boolean => {
    const tokens = auth.getStoredTokens()
    if (!tokens) return false

    return !isTokenExpired(tokens.accessToken)
  }

  // Auto-refresh token before expiry
  const setupAutoRefresh = () => {
    const tokens = auth.getStoredTokens()
    if (!tokens?.accessToken) return

    const timeUntilExpiry = getTimeUntilTokenExpiry(tokens.accessToken)
    const refreshTime = Math.max(0, timeUntilExpiry - 60) * 1000 // Refresh 1 minute before expiry

    if (refreshTime > 0) {
      setTimeout(async () => {
        try {
          await auth.refreshAccessToken()
        } catch (error) {
          console.error('Auto refresh failed:', error)
        }
      }, refreshTime)
    }
  }

  // Validate password strength
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  return {
    isTokenExpired,
    getTimeUntilTokenExpiry,
    parseTokenPayload,
    getUserFromToken,
    hasValidTokens,
    setupAutoRefresh,
    validatePassword,
    validateEmail,
  }
}

/**
 * Hook for authentication state management
 */
export function useAuthState() {
  const auth = useAuth()

  // Get current authentication state
  const getCurrentState = () => ({
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    user: auth.user,
    error: auth.error,
    hasTokens: !!auth.tokens.accessToken,
  })

  // Check if authentication is ready
  const isAuthReady = !auth.isLoading && (auth.isAuthenticated || !auth.tokens.accessToken)

  // Get authentication error state
  const hasError = !!auth.error
  const errorMessage = auth.error

  return {
    getCurrentState,
    isAuthReady,
    hasError,
    errorMessage,
  }
}