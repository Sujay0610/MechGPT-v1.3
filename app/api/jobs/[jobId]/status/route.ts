import { NextRequest, NextResponse } from 'next/server'

// Proxy to FastAPI backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const { jobId } = params

    // Extract agent name from the request URL or headers
    const url = new URL(request.url)
    const agentName = url.searchParams.get('agentName') || 'default'

    // Forward the request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/agents/${agentName}/upload/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch job status' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Job status proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to backend service' },
      { status: 500 }
    )
  }
}