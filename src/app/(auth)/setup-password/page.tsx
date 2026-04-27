'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hasPublicSupabaseEnv } from '@/lib/env'
import { toast } from 'sonner'

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabaseReady = hasPublicSupabaseEnv()
  const supabase = supabaseReady ? createClient() : null

  if (!supabaseReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Missing Supabase configuration</h2>
          <p className="text-sm text-slate-600">Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Railway environment variables.</p>
        </div>
      </div>
    )
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const { data: { user }, error: pwError } = await supabase!.auth.updateUser({ password })
    if (pwError) { toast.error(pwError.message); setLoading(false); return }
    if (user && fullName) {
      await supabase!.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    }
    toast.success('Account set up successfully!')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".9"/>
                <circle cx="10" cy="6" r="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">Onvio</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Set up your account</h1>
          <p className="text-sm text-slate-400 mb-6">You have been invited to Onvio. Create your password to get started.</p>
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your full name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Choose a password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder="Repeat password"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              {loading ? 'Setting up...' : 'Complete setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
