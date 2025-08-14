import { NextRequest, NextResponse } from 'next/server'

interface ResetPasswordRequest {
  new_password: string
  access_token: string
  refresh_token: string
}

interface AuthResponse {
  success: boolean
  message: string
  data?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json()
    const { new_password, access_token, refresh_token } = body

    // Validate tokens
    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { success: false, message: 'Access token and refresh token are required' },
        { status: 401 }
      )
    }

    // Validate input
    if (!new_password) {
      return NextResponse.json(
        { success: false, message: 'New password is required' },
        { status: 400 }
      )
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    
    // Make request to backend
    const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        new_password: new_password,
        access_token: access_token,
        refresh_token: refresh_token
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: data.detail || data.message || 'Failed to reset password' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: data
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}