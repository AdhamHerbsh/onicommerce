import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Admin from '@/models/Admin'
import { createAuthResponse, verifyAccessToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password, rememberMe } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find admin by email with password
    const admin = await Admin.findByEmailWithPassword(email)
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return NextResponse.json(
        { success: false, error: 'Account is locked. Please try again later.' },
        { status: 423 }
      )
    }

    // Check if account is active
    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is inactive' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password)
    if (!isPasswordValid) {
      await admin.incrementLoginAttempts()
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts()

    // Update last login
    admin.lastLogin = new Date()
    await admin.save()

    // Create auth response
    const authResponse = createAuthResponse(admin)

    return NextResponse.json({
      success: true,
      data: authResponse,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}