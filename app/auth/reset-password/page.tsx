'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'

interface AuthResponse {
  success: boolean
  message: string
  data?: any
}

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Parse URL hash fragments (Supabase sends tokens in URL hash, not query params)
    const parseUrlHash = () => {
      if (typeof window === 'undefined') return {}
      
      const hash = window.location.hash.slice(1) // Remove the # symbol
      if (!hash) return {}
      
      const hashParts = hash.split('&')
      const hashMap: Record<string, string> = {}
      
      hashParts.forEach(part => {
        const [name, value] = part.split('=')
        if (name && value) {
          hashMap[name] = decodeURIComponent(value)
        }
      })
      
      return hashMap
    }

    const hashParams = parseUrlHash()
    const accessToken = hashParams.access_token
    const refreshToken = hashParams.refresh_token
    const type = hashParams.type
    
    if (accessToken && refreshToken && type === 'recovery') {
      // Store tokens temporarily for password reset
      sessionStorage.setItem('reset_access_token', accessToken)
      sessionStorage.setItem('reset_refresh_token', refreshToken)
      setIsValidToken(true)
      
      // Clear the hash from URL for security
      window.history.replaceState(null, '', window.location.pathname)
    } else {
      // Check if tokens are already in session storage
      const storedAccessToken = sessionStorage.getItem('reset_access_token')
      if (storedAccessToken) {
        setIsValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    setCheckingToken(false)
  }, [])

  const validateForm = () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    return true
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const accessToken = sessionStorage.getItem('reset_access_token')
      const refreshToken = sessionStorage.getItem('reset_refresh_token')
      
      if (!accessToken || !refreshToken) {
        setError('Session expired. Please request a new password reset.')
        setLoading(false)
        return
      }

      const response = await axios.post<AuthResponse>('/api/auth/reset-password', {
        new_password: newPassword,
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (response.data.success) {
        setSuccess('Password reset successfully! You can now sign in with your new password.')
        // Clear the stored tokens
        sessionStorage.removeItem('reset_access_token')
        sessionStorage.removeItem('reset_refresh_token')
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (error: any) {
      if (error.response?.data?.detail) {
        setError(error.response.data.detail)
      } else {
        setError('Failed to reset password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Invalid Reset Link</h1>
            <p className="text-gray-400">This password reset link is invalid or has expired.</p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="text-center space-y-4">
            <Link 
              href="/auth/forgot-password" 
              className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request New Reset Link
            </Link>
            
            <div className="text-gray-600 text-sm">
              Remember your password?{' '}
              <Link 
                href="/auth/login" 
                className="text-blue-400 hover:text-blue-300"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your new password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Confirm your new password"
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-900 bg-opacity-20 border border-green-500 text-green-400 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading === true || success !== ''}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting Password...' : success ? 'Redirecting to Login...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <div className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link 
              href="/auth/login" 
              className="text-blue-400 hover:text-blue-300"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}