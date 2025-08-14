import { NextRequest, NextResponse } from 'next/server'

// Proxy to FastAPI backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Forward the request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to get user info' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Auth me proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    )
  }
}