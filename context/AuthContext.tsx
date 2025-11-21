'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { IAdmin } from '@/models/Admin'
import { JWTPayload, TokenPair, verifyAccessToken, extractTokenFromHeader } from '@/lib/auth'

// Auth state interface
export interface AuthState {
  user: Partial<IAdmin> | null
  isAuthenticated: boolean
  isLoading: boolean
  error?: string
  tokens: {
    accessToken?: string
    refreshToken?: string
  }
  lastActivity: Date | null
  sessionTimeout: number // minutes
}

// Auth action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload?: string }
  | { type: 'LOGIN_SUCCESS'; payload: { user: Partial<IAdmin>; tokens: TokenPair } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<IAdmin> }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: { accessToken: string } }
  | { type: 'SET_ACTIVITY'; payload: Date }
  | { type: 'SESSION_TIMEOUT' }

// Login credentials interface
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

// Auth context interface
export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  updateUser: (userData: Partial<IAdmin>) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasRole: (role: string) => boolean
  checkSessionTimeout: () => boolean
  resetSession: () => void
  getStoredTokens: () => TokenPair | null
  clearStoredTokens: () => void
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'onicommerce_access_token',
  REFRESH_TOKEN: 'onicommerce_refresh_token',
  USER_DATA: 'onicommerce_user_data',
  LAST_ACTIVITY: 'onicommerce_last_activity',
} as const

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: {},
  lastActivity: null,
  sessionTimeout: 30, // 30 minutes
}

// Reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        tokens: action.payload.tokens,
        error: undefined,
        lastActivity: new Date(),
      }

    case 'LOGOUT':
    case 'SESSION_TIMEOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        tokens: {},
        lastActivity: null,
        error: action.type === 'SESSION_TIMEOUT' ? 'Session expired. Please log in again.' : undefined,
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }

    case 'REFRESH_TOKEN_SUCCESS':
      return {
        ...state,
        tokens: {
          ...state.tokens,
          accessToken: action.payload.accessToken,
        },
        error: undefined,
      }

    case 'SET_ACTIVITY':
      return {
        ...state,
        lastActivity: action.payload,
      }

    default:
      return state
  }
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Utility functions for storage
  const getStoredTokens = useCallback((): TokenPair | null => {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

      if (accessToken && refreshToken) {
        return { accessToken, refreshToken }
      }
    } catch (error) {
      console.error('Failed to get stored tokens:', error)
    }
    return null
  }, [])

  const storeTokens = useCallback((tokens: TokenPair) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString())
    } catch (error) {
      console.error('Failed to store tokens:', error)
    }
  }, [])

  const clearStoredTokens = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY)
    } catch (error) {
      console.error('Failed to clear stored tokens:', error)
    }
  }, [])

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })

        const storedTokens = getStoredTokens()
        if (storedTokens) {
          // Verify access token
          const verification = verifyAccessToken(storedTokens.accessToken)

          if (verification.valid && verification.payload) {
            // Fetch user data using token or get from storage
            const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
            let user: Partial<IAdmin> | null = null

            if (userData) {
              user = JSON.parse(userData)
            }

            // If no user data in storage, you would typically fetch it from your API
            if (user) {
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user,
                  tokens: storedTokens,
                },
              })
            } else {
              clearStoredTokens()
            }
          } else if (verification.expired) {
            // Try to refresh the token
            await refreshAccessToken()
          } else {
            clearStoredTokens()
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        clearStoredTokens()
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()
  }, [getStoredTokens, clearStoredTokens])

  // Session timeout check
  useEffect(() => {
    if (!state.isAuthenticated || !state.lastActivity) return

    const checkSessionTimeout = () => {
      if (!state.lastActivity) return

      const now = new Date()
      const timeDiff = now.getTime() - state.lastActivity.getTime()
      const timeoutMs = state.sessionTimeout * 60 * 1000

      if (timeDiff > timeoutMs) {
        dispatch({ type: 'SESSION_TIMEOUT' })
        clearStoredTokens()
      }
    }

    const interval = setInterval(checkSessionTimeout, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [state.isAuthenticated, state.lastActivity, state.sessionTimeout, clearStoredTokens])

  // Activity tracking
  useEffect(() => {
    const updateActivity = () => {
      if (state.isAuthenticated) {
        dispatch({ type: 'SET_ACTIVITY', payload: new Date() })
        localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString())
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => window.addEventListener(event, updateActivity))

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity))
    }
  }, [state.isAuthenticated])

  // Auth functions
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })

      // This would be an API call to your login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const { user, tokens } = await response.json()

      // Store tokens and user data
      storeTokens(tokens)
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, tokens },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      dispatch({ type: 'SET_ERROR', payload: message })
      throw error
    }
  }, [storeTokens])

  const logout = useCallback(() => {
    try {
      // Call logout API if needed
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.tokens.accessToken}`,
        },
      }).catch(() => {
        // Ignore API errors during logout
      })
    } catch (error) {
      // Ignore any errors during logout
    } finally {
      clearStoredTokens()
      dispatch({ type: 'LOGOUT' })
    }
  }, [state.tokens.accessToken, clearStoredTokens])

  const refreshAccessToken = useCallback(async () => {
    try {
      const tokens = getStoredTokens()
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const { accessToken } = await response.json()

      dispatch({
        type: 'REFRESH_TOKEN_SUCCESS',
        payload: { accessToken },
      })

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      return accessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }, [getStoredTokens, logout])

  const updateUser = useCallback((userData: Partial<IAdmin>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData })
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({ ...state.user, ...userData }))
  }, [state.user])

  // Permission and role checks
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.user?.permissions) return false
    return state.user.permissions.includes(permission) ||
           state.user.permissions.includes('admin_write')
  }, [state.user])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }, [hasPermission])

  const hasRole = useCallback((role: string): boolean => {
    if (!state.user?.role) return false
    const roleHierarchy: Record<string, number> = {
      'user': 0,
      'admin': 1,
      'moderator': 2,
      'super_admin': 3,
    }
    return (roleHierarchy[state.user.role] || 0) >= (roleHierarchy[role] || 0)
  }, [state.user])

  const checkSessionTimeout = useCallback((): boolean => {
    if (!state.lastActivity) return false

    const now = new Date()
    const timeDiff = now.getTime() - state.lastActivity.getTime()
    const timeoutMs = state.sessionTimeout * 60 * 1000

    return timeDiff > timeoutMs
  }, [state.lastActivity, state.sessionTimeout])

  const resetSession = useCallback(() => {
    dispatch({ type: 'SET_ACTIVITY', payload: new Date() })
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, new Date().toISOString())
  }, [])

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken,
    updateUser,
    hasPermission,
    hasAnyPermission,
    hasRole,
    checkSessionTimeout,
    resetSession,
    getStoredTokens,
    clearStoredTokens,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export the context for testing purposes
export { AuthContext }