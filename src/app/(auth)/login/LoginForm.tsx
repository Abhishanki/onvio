'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type AuthMode = 'password' | 'magic' | 'reset'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<AuthMode>('password')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth_callback_failed') toast.error('Authentication failed.')
    if (error === 'confirm_failed') toast.error('Link expired. Request a new one.')
  }, [searchParams])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    setResetSent(true)
  }

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  }

  const leftStyle: React.CSSProperties = {
    width: '54%',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '48px 52px',
    background: 'linear-gradient(150deg, #f2faea 0%, #eaf5e0 25%, #faf6ed 60%, #f5ede0 100%)',
  }

  const rightStyle: React.CSSProperties = {
    flex: 1,
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 36px',
    position: 'relative',
  }

  if (magicSent || resetSent) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #f2faea 0%, #fdfaf5 50%, #f5ede0 100%)',
        padding: '24px',
      }}>
        <div style={{
          background: '#ffffff', borderRadius: 24,
          border: '1px solid rgba(134,167,123,0.2)',
          boxShadow: '0 20px 60px rgba(100,140,90,0.12)',
          padding: '52px 44px', width: '100%', maxWidth: 420, textAlign: 'center',
        }}>
          <div style={{
            width: 68, height: 68,
            background: 'linear-gradient(135deg, #d4edda, #c8e6c9)',
            borderRadius: 20, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 28px',
            boxShadow: '0 8px 24px rgba(100,170,100,0.2)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3d8b4e" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{ color: '#2d4a2d', fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Check your email</h2>
          <p style={{ color: '#7a8c7a', fontSize: 14, margin: '0 0 8px' }}>
            We sent a {resetSent ? 'password reset' : 'sign-in'} link to
          </p>
          <p style={{ color: '#4a7c4a', fontSize: 14, fontWeight: 600, margin: '0 0 24px' }}>{email}</p>
          <p style={{ color: '#aabcaa', fontSize: 12, margin: '0 0 28px' }}>
            Click the link in the email. It expires in 1 hour.
          </p>
          <button onClick={() => { setMagicSent(false); setResetSent(false); setMode('password') }}
            style={{ color: '#4a7c4a', fontSize: 14, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.06)} 66%{transform:translate(-25px,20px) scale(0.96)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,25px) scale(1.04)} 66%{transform:translate(25px,-20px) scale(0.97)} }
        @keyframes drift3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-30px)} }
        @keyframes shimmer { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes tickIn { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
        @keyframes rotateSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 6px 22px rgba(70,120,50,0.32)} 50%{box-shadow:0 12px 36px rgba(70,120,50,0.52)} }
        .onvio-orb1 { position:absolute;width:420px;height:420px;top:-110px;right:-90px;border-radius:50%;background:radial-gradient(circle,rgba(140,200,100,0.42) 0%,transparent 68%);animation:drift1 9s ease-in-out infinite; }
        .onvio-orb2 { position:absolute;width:320px;height:320px;bottom:-90px;left:-60px;border-radius:50%;background:radial-gradient(circle,rgba(205,168,100,0.38) 0%,transparent 68%);animation:drift2 11s ease-in-out infinite; }
        .onvio-orb3 { position:absolute;width:220px;height:220px;top:42%;left:28%;border-radius:50%;background:radial-gradient(circle,rgba(235,215,165,0.5) 0%,transparent 68%);animation:drift3 7s ease-in-out infinite; }
        .onvio-dots { position:absolute;inset:0;background-image:radial-gradient(circle,rgba(70,110,50,0.065) 1.5px,transparent 1.5px);background-size:28px 28px; }
        .onvio-logo { display:flex;align-items:center;gap:12px;position:relative;z-index:3;animation:fadeUp 0.5s ease both; }
        .onvio-logo-box { width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#4e8040,#80b865);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 22px rgba(70,120,50,0.35); }
        .onvio-logo-name { font-weight:800;font-size:21px;color:#1a2e14;letter-spacing:-0.5px; }
        .onvio-hero { position:relative;z-index:3;animation:fadeUp 0.6s 0.1s ease both; }
        .onvio-live-badge { display:inline-flex;align-items:center;gap:8px;background:rgba(70,110,50,0.1);border:1px solid rgba(70,110,50,0.22);border-radius:100px;padding:5px 14px;margin-bottom:22px; }
        .onvio-live-dot { width:7px;height:7px;border-radius:50%;background:#4e8040;animation:pulse 1.8s ease-in-out infinite; }
        .onvio-live-txt { font-size:11px;font-weight:600;color:#3d6530;letter-spacing:0.04em; }
        .onvio-headline { font-size:42px;font-weight:800;line-height:1.1;letter-spacing:-2px;color:#172812;margin-bottom:10px; }
        .onvio-grad { background:linear-gradient(120deg,#3d7030,#8a6820,#c07838,#8a6820,#3d7030);background-size:300% 300%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 5s ease infinite; }
        .onvio-sub { font-size:14px;color:#6a8060;line-height:1.65;margin-bottom:30px; }
        .onvio-checks { display:flex;flex-wrap:wrap;gap:9px;margin-bottom:32px; }
        .onvio-check { display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.72);border:1px solid rgba(100,150,70,0.2);border-radius:100px;padding:6px 14px;animation:slideRight 0.5s ease both;backdrop-filter:blur(4px); }
        .onvio-check:nth-child(1){animation-delay:0.3s} .onvio-check:nth-child(2){animation-delay:0.42s} .onvio-check:nth-child(3){animation-delay:0.54s} .onvio-check:nth-child(4){animation-delay:0.66s}
        .onvio-chk-ico { width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,#4e8040,#80b865);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .onvio-chk-txt { font-size:11px;font-weight:500;color:#3a5a2a; }
        .onvio-promise { background:rgba(255,255,255,0.62);border:1px solid rgba(140,180,100,0.25);border-radius:16px;padding:16px 18px;backdrop-filter:blur(8px);animation:fadeUp 0.6s 0.7s ease both; }
        .onvio-promise-title { font-size:10px;font-weight:700;color:#3d6020;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;display:flex;align-items:center;gap:8px; }
        .onvio-promise-dot { width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#4e8040,#c07838);animation:pulse 2s ease-in-out infinite;flex-shrink:0; }
        .onvio-promise-txt { font-size:12px;color:#5a7040;line-height:1.65; }
        .onvio-tagline { position:relative;z-index:3;animation:fadeUp 0.6s 0.9s ease both; }
        .onvio-tag-pill { display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,rgba(78,128,64,0.1),rgba(160,110,40,0.1));border:1px solid rgba(100,90,50,0.2);border-radius:100px;padding:7px 17px; }
        .onvio-tag-star { font-size:12px;animation:rotateSlow 8s linear infinite;display:inline-block; }
        .onvio-tag-txt { font-size:11px;font-weight:600;color:#4a5a30;font-style:italic; }
        .onvio-right-bg { position:absolute;inset:0;background:linear-gradient(155deg,#f8fdf5 0%,#fff 55%,#fdf9f0 100%); }
        .onvio-form-eyebrow { font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#a0b888;margin-bottom:8px;animation:fadeUp 0.5s 0.1s ease both; }
        .onvio-form-title { font-size:26px;font-weight:800;color:#172812;letter-spacing:-0.6px;margin-bottom:5px;animation:fadeUp 0.5s 0.15s ease both; }
        .onvio-form-sub { font-size:13px;color:#90a878;margin-bottom:26px;animation:fadeUp 0.5s 0.2s ease both; }
        .onvio-tabs { display:flex;background:rgba(78,128,64,0.07);border-radius:12px;padding:3px;margin-bottom:22px;gap:3px;animation:fadeUp 0.5s 0.25s ease both; }
        .onvio-tab { flex:1;padding:9px 0;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:all 0.25s; }
        .onvio-tab.on { background:linear-gradient(135deg,#4e8040,#7ab062);color:#fff;box-shadow:0 4px 14px rgba(70,120,50,0.35); }
        .onvio-tab.off { background:transparent;color:#90a870; }
        .onvio-tab.off:hover { background:rgba(78,128,64,0.08); }
        .onvio-field { margin-bottom:16px;animation:fadeUp 0.5s ease both; }
        .onvio-field:nth-child(5){animation-delay:0.3s} .onvio-field:nth-child(6){animation-delay:0.35s}
        .onvio-flbl { display:flex;justify-content:space-between;align-items:center;margin-bottom:8px; }
        .onvio-flbl-txt { font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#7a9268; }
        .onvio-flbl-link { font-size:11px;color:#6a9050;font-weight:500;cursor:pointer;background:none;border:none; }
        .onvio-inp { width:100%;padding:12px 15px;background:#f5faf2;border:1.5px solid rgba(100,150,70,0.22);border-radius:12px;color:#1e3018;font-size:14px;outline:none;transition:all 0.25s; }
        .onvio-inp:focus { border-color:rgba(78,128,64,0.6);background:#f0f8eb;box-shadow:0 0 0 3px rgba(78,128,64,0.1); }
        .onvio-inp::placeholder { color:#b0c8a0; }
        .onvio-btn { width:100%;padding:14px;border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;background:linear-gradient(135deg,#4e8040 0%,#7ab062 50%,#9a7030 100%);background-size:200% 200%;transition:transform 0.2s;animation:glowPulse 2.5s ease-in-out infinite; }
        .onvio-btn:hover { transform:translateY(-2px); }
        .onvio-btn:active { transform:translateY(0); }
        .onvio-btn:disabled { opacity:0.65;cursor:not-allowed; }
        .onvio-coming { margin-top:20px;text-align:center;animation:fadeUp 0.5s 0.5s ease both; }
        .onvio-coming-txt { font-size:11px;color:#b0c890;font-style:italic; }
        .onvio-foot { text-align:center;color:rgba(80,100,60,0.25);font-size:10px;margin-top:12px;animation:fadeUp 0.5s 0.6s ease both; }
        .onvio-info-box { border-radius:11px;padding:11px 14px;margin-bottom:4px; }
        @media(max-width:768px) { .onvio-left-panel{display:none!important} }
      `}</style>

      {/* Left panel */}
      <div style={leftStyle} className="onvio-left-panel">
        <div className="onvio-orb1"/><div className="onvio-orb2"/><div className="onvio-orb3"/><div className="onvio-dots"/>
        <div className="onvio-logo">
          <div className="onvio-logo-box">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/>
              <circle cx="10" cy="6" r="1.5" fill="white"/>
            </svg>
          </div>
          <span className="onvio-logo-name">Onvio</span>
        </div>
        <div className="onvio-hero">
          <div className="onvio-live-badge">
            <div className="onvio-live-dot"/>
            <span className="onvio-live-txt">Live Platform · Always On</span>
          </div>
          <div className="onvio-headline">
            Run Projects<br/>
            <span className="onvio-grad">Without Chaos.</span>
          </div>
          <p className="onvio-sub">
            Plan, collaborate, automate, and deliver —<br/>
            all in one intelligent workspace.
          </p>
          <div className="onvio-checks">
            {['Smart Planning', 'Team Alignment', 'Workflow Automation', 'Milestone Visibility'].map(t => (
              <div key={t} className="onvio-check">
                <div className="onvio-chk-ico">
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <polyline points="2,5 4,7 8,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="onvio-chk-txt">{t}</span>
              </div>
            ))}
          </div>
          <div className="onvio-promise">
            <div className="onvio-promise-title">
              <div className="onvio-promise-dot"/>
              Our Promise
            </div>
            <p className="onvio-promise-txt">
              <strong style={{color:'#2a4018',fontWeight:700}}>Fully built around your team.</strong> Every workflow,
              every template, every dashboard — shaped exactly the way
              your business works. No generic tools. No compromises.
            </p>
          </div>
        </div>
        <div className="onvio-tagline">
          <div className="onvio-tag-pill">
            <span className="onvio-tag-star">✦</span>
            <span className="onvio-tag-txt">You ask, we deliver — just ask.</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={rightStyle}>
        <div className="onvio-right-bg"/>
        <div style={{width:'100%',maxWidth:320,position:'relative',zIndex:2}}>
          <div className="onvio-form-eyebrow">Welcome to Onvio</div>
          <div className="onvio-form-title">Sign in</div>
          <div className="onvio-form-sub">Your onboarding command centre awaits</div>

          {mode !== 'reset' && (
            <div className="onvio-tabs">
              {(['password','magic'] as AuthMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`onvio-tab ${mode === m ? 'on' : 'off'}`}
                  style={{fontFamily:'inherit'}}>
                  {m === 'password' ? 'Password' : 'Magic Link'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={
            mode === 'password' ? handlePasswordLogin :
            mode === 'magic' ? handleMagicLink :
            handleResetPassword
          } style={{display:'flex',flexDirection:'column'}}>
            <div className="onvio-field">
              <div className="onvio-flbl">
                <span className="onvio-flbl-txt">Email address</span>
              </div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@company.com" className="onvio-inp"/>
            </div>

            {mode === 'password' && (
              <div className="onvio-field">
                <div className="onvio-flbl">
                  <span className="onvio-flbl-txt">Password</span>
                  <button type="button" onClick={() => setMode('reset')} className="onvio-flbl-link">
                    Forgot password?
                  </button>
                </div>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••••" className="onvio-inp"/>
              </div>
            )}

            {mode === 'magic' && (
              <div className="onvio-info-box" style={{background:'rgba(78,128,64,0.07)',border:'1px solid rgba(78,128,64,0.18)',marginBottom:16}}>
                <p style={{fontSize:12,color:'#5a7a40',margin:0}}>
                  We will email you a one-click sign-in link. No password needed.
                </p>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div style={{marginBottom:16}}>
                  <p style={{fontSize:22,fontWeight:800,color:'#172812',letterSpacing:'-0.5px',margin:'0 0 5px'}}>Reset password</p>
                  <p style={{fontSize:13,color:'#90a878',margin:'0 0 20px'}}>Enter your email for a reset link</p>
                </div>
                <div className="onvio-field">
                  <div className="onvio-flbl"><span className="onvio-flbl-txt">Email address</span></div>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required placeholder="you@company.com" className="onvio-inp"/>
                </div>
                <div className="onvio-info-box" style={{background:'rgba(251,191,36,0.07)',border:'1px solid rgba(251,191,36,0.2)',marginBottom:16}}>
                  <p style={{fontSize:12,color:'#7a6020',margin:0}}>
                    We will send a password reset link to your email address.
                  </p>
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="onvio-btn" style={{fontFamily:'inherit'}}>
              {loading ? 'Please wait...' :
               mode === 'password' ? 'Sign in to Onvio →' :
               mode === 'magic' ? 'Send magic link →' :
               'Send reset link →'}
            </button>

            {mode === 'reset' && (
              <button type="button" onClick={() => setMode('password')} style={{
                marginTop:12,color:'#7a9060',fontSize:12,background:'none',
                border:'none',cursor:'pointer',fontFamily:'inherit'
              }}>
                Back to sign in
              </button>
            )}
          </form>

          <div className="onvio-coming">
            <p className="onvio-coming-txt">More integrations and features coming soon</p>
          </div>
          <div className="onvio-foot">Fully customised as per your need · Onvio</div>
        </div>
      </div>
    </div>
  )
}
