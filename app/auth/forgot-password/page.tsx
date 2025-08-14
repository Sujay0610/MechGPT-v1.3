'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface AuthResponse {
  success: boolean
  message: string
  data?: any
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post<AuthResponse>('/api/auth/send-password-reset-email', {
        email: email
      })
      
      if (response.data.success) {
        setSuccess('Password reset email sent! Please check your email for the reset link.')
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your email to receive a password reset link</p>
        </div>

        <form onSubmit={handleSendReset} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your email"
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add at the top
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Replace hardcoded URL with:
// `${API_BASE_URL}/auth/send-password-reset-email`