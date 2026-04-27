'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { hasPublicSupabaseEnv } from '@/lib/env'
import { toast } from 'sonner'

type AuthMode = 'password' | 'magic' | 'reset'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<AuthMode>('password')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const searchParams = useSearchParams()
  const supabaseReady = hasPublicSupabaseEnv()
  const supabase = supabaseReady ? createClient() : null

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_callback_failed') toast.error('Authentication failed.')
    if (error === 'confirm_failed') toast.error('Link expired. Request a new one.')
  }, [searchParams])

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const payload: { error?: string; redirectTo?: string } = await response.json()

      if (!response.ok || payload.error) {
        toast.error(payload.error ?? 'Unable to sign in with password.')
        setLoading(false)
        return
      }

      window.location.href = payload.redirectTo ?? '/dashboard'
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setMagicSent(true)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase!.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setResetSent(true)
  }

  if (magicSent || resetSent) {
    return (
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background:'linear-gradient(150deg, #f2faea 0%, #eaf5e0 25%, #faf6ed 60%, #f5ede0 100%)',
        padding:'24px', position:'relative', overflow:'hidden'
      }}>
        <div style={{position:'absolute',width:420,height:420,top:-110,right:-90,borderRadius:'50%',background:'radial-gradient(circle,rgba(140,200,100,0.42) 0%,transparent 68%)'}}/>
        <div style={{position:'absolute',width:320,height:320,bottom:-90,left:-60,borderRadius:'50%',background:'radial-gradient(circle,rgba(205,168,100,0.38) 0%,transparent 68%)'}}/>
        <div style={{
          background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)',
          border:'1px solid rgba(134,167,123,0.25)',
          borderRadius:24, padding:'52px 44px',
          width:'100%', maxWidth:420, textAlign:'center',
          boxShadow:'0 24px 60px rgba(80,120,70,0.12)',
          position:'relative', zIndex:2
        }}>
          <div style={{
            width:68, height:68,
            background:'linear-gradient(135deg, #c8e6c9, #a5d6a7)',
            borderRadius:20, display:'flex', alignItems:'center',
            justifyContent:'center', margin:'0 auto 28px',
            boxShadow:'0 8px 24px rgba(100,170,100,0.25)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a2d" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{color:'#1a2e14', fontSize:22, fontWeight:700, margin:'0 0 8px'}}>Check your email</h2>
          <p style={{color:'#7a8c6a', fontSize:14, margin:'0 0 8px'}}>
            We sent a {resetSent ? 'password reset' : 'sign-in'} link to
          </p>
          <p style={{color:'#4e8040', fontSize:14, fontWeight:600, margin:'0 0 24px'}}>{email}</p>
          <p style={{color:'#aabcaa', fontSize:12, margin:'0 0 28px'}}>
            Click the link in the email. It expires in 1 hour.
          </p>
          <button onClick={() => { setMagicSent(false); setResetSent(false); setMode('password') }}
            style={{
              color:'#4e8040', fontSize:14, fontWeight:500,
              background:'none', border:'none', cursor:'pointer',
              textDecoration:'underline', fontFamily:'inherit'
            }}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex',
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background:'linear-gradient(150deg, #f2faea 0%, #eaf5e0 25%, #faf6ed 60%, #f5ede0 100%)',
      position:'relative', overflow:'hidden'
    }}>
      <style>{`
        @keyframes drift1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.06)}66%{transform:translate(-25px,20px) scale(0.96)}}
        @keyframes drift2{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-30px,25px) scale(1.04)}66%{transform:translate(25px,-20px) scale(0.97)}}
        @keyframes drift3{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-30px)}}
        @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(0.85)}}
        @keyframes rotateSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 6px 22px rgba(70,120,50,0.32)}50%{box-shadow:0 12px 36px rgba(70,120,50,0.52)}}
        .onv-left{display:flex!important}
        @media(max-width:900px){.onv-left{display:none!important}.onv-mlogo{display:block!important}}
        .onv-mlogo{display:none}
        .onv-inp:focus{border-color:rgba(78,128,64,0.6)!important;background:#f0f8eb!important;box-shadow:0 0 0 3px rgba(78,128,64,0.1)!important}
        .onv-tab-on{background:linear-gradient(135deg,#4e8040,#7ab062)!important;color:#fff!important;box-shadow:0 4px 14px rgba(70,120,50,0.35)!important}
        .onv-tab-off{background:transparent!important;color:#90a870!important}
        .onv-btn{animation:glowPulse 2.5s ease-in-out infinite}
        .onv-btn:hover{transform:translateY(-2px)!important}
        .onv-feat:hover{transform:translateX(5px)!important}
      `}</style>

      {/* Orbs */}
      <div style={{position:'absolute',width:420,height:420,top:-110,right:-90,borderRadius:'50%',background:'radial-gradient(circle,rgba(140,200,100,0.42) 0%,transparent 68%)',animation:'drift1 9s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:320,height:320,bottom:-90,left:-60,borderRadius:'50%',background:'radial-gradient(circle,rgba(205,168,100,0.38) 0%,transparent 68%)',animation:'drift2 11s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:220,height:220,top:'42%',left:'28%',borderRadius:'50%',background:'radial-gradient(circle,rgba(235,215,165,0.5) 0%,transparent 68%)',animation:'drift3 7s ease-in-out infinite'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(70,110,50,0.065) 1.5px,transparent 1.5px)',backgroundSize:'28px 28px'}}/>

      {/* Left panel */}
      <div className="onv-left" style={{
        width:'54%', padding:'48px 52px', flexDirection:'column',
        justifyContent:'space-between', position:'relative', zIndex:3
      }}>
        <div style={{display:'flex',alignItems:'center',gap:12,animation:'fadeUp 0.5s ease both'}}>
          <div style={{width:44,height:44,borderRadius:14,background:'linear-gradient(135deg,#4e8040,#80b865)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 6px 22px rgba(70,120,50,0.35)'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/><circle cx="10" cy="6" r="1.5" fill="white"/></svg>
          </div>
          <span style={{fontWeight:800,fontSize:21,color:'#1a2e14',letterSpacing:'-0.5px'}}>Onvio</span>
        </div>

        <div style={{animation:'fadeUp 0.6s 0.1s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(70,110,50,0.1)',border:'1px solid rgba(70,110,50,0.22)',borderRadius:100,padding:'5px 14px',marginBottom:22}}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#4e8040',animation:'pulse 1.8s ease-in-out infinite'}}/>
            <span style={{fontSize:11,fontWeight:600,color:'#3d6530',letterSpacing:'0.04em'}}>Live Platform · Always On</span>
          </div>
          <div style={{fontSize:42,fontWeight:800,lineHeight:1.1,letterSpacing:'-2px',color:'#172812',marginBottom:10}}>
            Run Projects<br/>
            <span style={{background:'linear-gradient(120deg,#3d7030,#8a6820,#c07838,#8a6820,#3d7030)',backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shimmer 5s ease infinite'}}>Without Chaos.</span>
          </div>
          <p style={{fontSize:14,color:'#6a8060',lineHeight:1.65,marginBottom:30}}>
            Plan, collaborate, automate, and deliver —<br/>all in one intelligent workspace.
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:9,marginBottom:32}}>
            {['Smart Planning','Team Alignment','Workflow Automation','Milestone Visibility'].map((t,i) => (
              <div key={t} className="onv-feat" style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.72)',border:'1px solid rgba(100,150,70,0.2)',borderRadius:100,padding:'6px 14px',animation:`slideRight 0.5s ${0.3+i*0.12}s ease both`,backdropFilter:'blur(4px)',transition:'transform 0.2s'}}>
                <div style={{width:16,height:16,borderRadius:'50%',background:'linear-gradient(135deg,#4e8040,#80b865)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{fontSize:11,fontWeight:500,color:'#3a5a2a'}}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(255,255,255,0.62)',border:'1px solid rgba(140,180,100,0.25)',borderRadius:16,padding:'16px 18px',backdropFilter:'blur(8px)',animation:'fadeUp 0.6s 0.7s ease both'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#3d6020',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'linear-gradient(135deg,#4e8040,#c07838)',animation:'pulse 2s ease-in-out infinite',flexShrink:0}}/>
              Our Promise
            </div>
            <p style={{fontSize:12,color:'#5a7040',lineHeight:1.65,margin:0}}>
              <strong style={{color:'#2a4018',fontWeight:700}}>Fully built around your team.</strong> Every workflow, every template, every dashboard — shaped exactly the way your business works.
            </p>
          </div>
        </div>

        <div style={{animation:'fadeUp 0.6s 0.9s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,rgba(78,128,64,0.1),rgba(160,110,40,0.1))',border:'1px solid rgba(100,90,50,0.2)',borderRadius:100,padding:'7px 17px'}}>
            <span style={{fontSize:12,animation:'rotateSlow 8s linear infinite',display:'inline-block'}}>✦</span>
            <span style={{fontSize:11,fontWeight:600,color:'#4a5a30',fontStyle:'italic'}}>You ask, we deliver — just ask.</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 36px',position:'relative',zIndex:10}}>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(155deg,#f8fdf5 0%,#fff 55%,#fdf9f0 100%)'}}/>
        <div style={{width:'100%',maxWidth:340,position:'relative',zIndex:2}}>

          {/* Mobile logo */}
          <div className="onv-mlogo" style={{textAlign:'center',marginBottom:32}}>
            <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#4e8040,#80b865)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px',boxShadow:'0 4px 16px rgba(90,138,90,0.25)'}}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/><circle cx="10" cy="6" r="1.5" fill="white"/></svg>
            </div>
            <span style={{color:'#1a2e14',fontWeight:700,fontSize:20}}>Onvio</span>
          </div>

          <div style={{
            background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)',
            border:'1px solid rgba(134,167,123,0.25)', borderRadius:24,
            padding:'40px 36px', boxShadow:'0 24px 60px rgba(80,120,70,0.12)',
            animation:'fadeUp 0.6s 0.1s ease both'
          }}>
            <div style={{marginBottom:26}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#a0b888',marginBottom:8}}>Welcome to Onvio</p>
              <h2 style={{fontSize:26,fontWeight:800,color:'#172812',letterSpacing:'-0.6px',margin:'0 0 5px'}}>
                {mode === 'reset' ? 'Reset password' : 'Sign in'}
              </h2>
              <p style={{fontSize:13,color:'#90a878',margin:0}}>
                {mode === 'reset' ? 'Enter your email for a reset link' : 'Your onboarding command centre awaits'}
              </p>
            </div>

            {mode !== 'reset' && (
              <div style={{display:'flex',background:'rgba(78,128,64,0.07)',borderRadius:12,padding:3,marginBottom:22,gap:3}}>
                {(['password','magic'] as AuthMode[]).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className={mode === m ? 'onv-tab-on' : 'onv-tab-off'}
                    style={{flex:1,padding:'9px 0',borderRadius:10,fontSize:13,fontWeight:600,border:'none',cursor:'pointer',transition:'all 0.25s',fontFamily:'inherit'}}>
                    {m === 'password' ? 'Password' : 'Magic Link'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={mode==='password'?handlePasswordLogin:mode==='magic'?handleMagicLink:handleResetPassword}
              style={{display:'flex',flexDirection:'column',gap:16}}>

              <div>
                <label style={{display:'block',color:'#7a9268',fontSize:10,fontWeight:700,marginBottom:8,letterSpacing:'0.08em',textTransform:'uppercase'}}>Email address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                  placeholder="you@company.com" className="onv-inp"
                  style={{width:'100%',padding:'12px 15px',background:'#f5faf2',border:'1.5px solid rgba(100,150,70,0.22)',borderRadius:12,color:'#1e3018',fontSize:14,outline:'none',boxSizing:'border-box',transition:'all 0.25s'}}/>
              </div>

              {mode === 'password' && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <label style={{color:'#7a9268',fontSize:10,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>Password</label>
                    <button type="button" onClick={()=>setMode('reset')} style={{color:'#6a9050',fontSize:11,background:'none',border:'none',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>Forgot password?</button>
                  </div>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                    placeholder="••••••••••" className="onv-inp"
                    style={{width:'100%',padding:'12px 15px',background:'#f5faf2',border:'1.5px solid rgba(100,150,70,0.22)',borderRadius:12,color:'#1e3018',fontSize:14,outline:'none',boxSizing:'border-box',transition:'all 0.25s'}}/>
                </div>
              )}

              {mode === 'magic' && (
                <div style={{background:'rgba(78,128,64,0.07)',border:'1px solid rgba(78,128,64,0.18)',borderRadius:10,padding:'11px 14px'}}>
                  <p style={{fontSize:12,color:'#5a7a40',margin:0}}>We will email you a one-click sign-in link. No password needed.</p>
                </div>
              )}

              {mode === 'reset' && (
                <div style={{background:'rgba(251,191,36,0.07)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:10,padding:'11px 14px'}}>
                  <p style={{fontSize:12,color:'#7a6020',margin:0}}>We will send a password reset link to your email address.</p>
                </div>
              )}

              <button type="submit" disabled={loading} className="onv-btn"
                style={{
                  width:'100%',padding:'13px',border:'none',borderRadius:12,
                  color:'#fff',fontSize:14,fontWeight:700,
                  cursor:loading?'not-allowed':'pointer',marginTop:4,
                  background:loading?'rgba(78,128,64,0.5)':'linear-gradient(135deg,#4e8040 0%,#7ab062 50%,#9a7030 100%)',
                  transition:'transform 0.2s',fontFamily:'inherit'
                }}>
                {loading ? 'Please wait...' :
                 mode==='password' ? 'Sign in to Onvio →' :
                 mode==='magic' ? 'Send magic link →' : 'Send reset link →'}
              </button>

              {mode === 'reset' && (
                <button type="button" onClick={()=>setMode('password')}
                  style={{color:'#7a9060',fontSize:12,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                  Back to sign in
                </button>
              )}
            </form>
          </div>

          <p style={{textAlign:'center',color:'rgba(80,100,60,0.25)',fontSize:10,marginTop:16}}>
            Fully customised as per your need · Onvio
          </p>
        </div>
      </div>
    </div>
  )
}
