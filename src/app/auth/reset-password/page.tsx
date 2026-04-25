'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Minimum 8 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Password updated! Redirecting...')
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f5f3ff 100%)'}}>
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".9"/>
                <circle cx="10" cy="6" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900">Onvio</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Set new password</h1>
          <p className="text-sm text-slate-500 mb-8">Choose a strong password for your account</p>
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder="Repeat password"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"/>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors mt-2">
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
