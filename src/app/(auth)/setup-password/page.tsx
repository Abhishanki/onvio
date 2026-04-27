'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const {
      data: { user },
      error: passwordError,
    } = await supabase.auth.updateUser({ password })

    if (passwordError) {
      toast.error(passwordError.message)
      setLoading(false)
      return
    }

    if (user && fullName.trim()) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)

      if (profileError) {
        toast.error(profileError.message)
        setLoading(false)
        return
      }
    }

    toast.success('Account set up successfully!')
    window.location.href = '/dashboard'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: 'linear-gradient(150deg, #f2faea 0%, #eaf5e0 25%, #faf6ed 60%, #f5ede0 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '32px 16px',
      }}
    >
      <div style={{ position: 'absolute', width: 420, height: 420, top: -110, right: -90, borderRadius: '50%', background: 'radial-gradient(circle,rgba(140,200,100,0.42) 0%,transparent 68%)' }} />
      <div style={{ position: 'absolute', width: 320, height: 320, bottom: -90, left: -60, borderRadius: '50%', background: 'radial-gradient(circle,rgba(205,168,100,0.38) 0%,transparent 68%)' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4e8040,#80b865)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 4px 16px rgba(90,138,90,0.25)' }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none"><path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95" /><circle cx="10" cy="6" r="1.5" fill="white" /></svg>
          </div>
          <span style={{ color: '#1a2e14', fontWeight: 700, fontSize: 21 }}>Onvio</span>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(134,167,123,0.25)', borderRadius: 24, padding: '36px 30px', boxShadow: '0 24px 60px rgba(80,120,70,0.12)' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a0b888', marginBottom: 8 }}>Welcome to Onvio</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#172812', letterSpacing: '-0.6px', margin: '0 0 6px' }}>Set up your account</h1>
          <p style={{ fontSize: 13, color: '#90a878', margin: '0 0 22px' }}>Create your password to finish the invitation process.</p>

          <form onSubmit={handleSetup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', color: '#7a9268', fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                placeholder="e.g. Priya Sharma"
                style={{ width: '100%', padding: '12px 15px', background: '#f5faf2', border: '1.5px solid rgba(100,150,70,0.22)', borderRadius: 12, color: '#1e3018', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#7a9268', fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Minimum 8 characters"
                style={{ width: '100%', padding: '12px 15px', background: '#f5faf2', border: '1.5px solid rgba(100,150,70,0.22)', borderRadius: 12, color: '#1e3018', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#7a9268', fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                placeholder="Repeat password"
                style={{ width: '100%', padding: '12px 15px', background: '#f5faf2', border: '1.5px solid rgba(100,150,70,0.22)', borderRadius: 12, color: '#1e3018', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 8, background: loading ? 'rgba(78,128,64,0.5)' : 'linear-gradient(135deg,#4e8040 0%,#7ab062 50%,#9a7030 100%)' }}
            >
              {loading ? 'Setting up...' : 'Complete setup →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
