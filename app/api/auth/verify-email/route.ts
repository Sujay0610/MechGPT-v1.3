import { NextRequest, NextResponse } from 'next/server'

// Proxy to FastAPI backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Forward the request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Email verification failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Auth verify-email proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    )
  }
}