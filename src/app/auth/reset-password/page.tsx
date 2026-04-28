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
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Also check if already in recovery session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
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
    toast.success('Password updated!')
    setTimeout(() => { window.location.href = '/dashboard' }, 1200)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: 'linear-gradient(150deg, #f2faea 0%, #eaf5e0 25%, #faf6ed 60%, #f5ede0 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-30px) scale(1.06)} 66%{transform:translate(-25px,20px) scale(0.96)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-30px,25px) scale(1.04)} 66%{transform:translate(25px,-20px) scale(0.97)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 6px 22px rgba(70,120,50,0.32)} 50%{box-shadow:0 12px 36px rgba(70,120,50,0.52)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
      `}</style>

      {/* Background orbs */}
      <div style={{position:'absolute',width:420,height:420,top:-110,right:-90,borderRadius:'50%',background:'radial-gradient(circle,rgba(140,200,100,0.42) 0%,transparent 68%)',animation:'drift1 9s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:320,height:320,bottom:-90,left:-60,borderRadius:'50%',background:'radial-gradient(circle,rgba(205,168,100,0.38) 0%,transparent 68%)',animation:'drift2 11s ease-in-out infinite'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(70,110,50,0.065) 1.5px,transparent 1.5px)',backgroundSize:'28px 28px'}}/>

      {/* Left branding panel */}
      <div style={{
        width:'52%', padding:'48px 52px',
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        position:'relative', zIndex:3
      }} className="hide-mobile">
        <style>{`@media(max-width:768px){.hide-mobile{display:none!important}}`}</style>

        <div style={{display:'flex',alignItems:'center',gap:12,animation:'fadeUp 0.5s ease both'}}>
          <div style={{
            width:44,height:44,borderRadius:14,
            background:'linear-gradient(135deg,#4e8040,#80b865)',
            display:'flex',alignItems:'center',justifyContent:'center',
            boxShadow:'0 6px 22px rgba(70,120,50,0.35)'
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/>
              <circle cx="10" cy="6" r="1.5" fill="white"/>
            </svg>
          </div>
          <span style={{fontWeight:800,fontSize:21,color:'#1a2e14',letterSpacing:'-0.5px'}}>Onvio</span>
        </div>

        <div style={{animation:'fadeUp 0.6s 0.1s ease both'}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,
            background:'rgba(70,110,50,0.1)',border:'1px solid rgba(70,110,50,0.22)',
            borderRadius:100,padding:'5px 14px',marginBottom:22
          }}>
            <div style={{width:7,height:7,borderRadius:'50%',background:'#4e8040',animation:'pulse 1.8s ease-in-out infinite'}}/>
            <span style={{fontSize:11,fontWeight:600,color:'#3d6530',letterSpacing:'0.04em'}}>Secure Account Recovery</span>
          </div>
          <div style={{fontSize:42,fontWeight:800,lineHeight:1.1,letterSpacing:'-2px',color:'#172812',marginBottom:10}}>
            Reset your<br/>
            <span style={{
              background:'linear-gradient(120deg,#3d7030,#8a6820,#c07838,#8a6820,#3d7030)',
              backgroundSize:'300% 300%',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'
            }}>password.</span>
          </div>
          <p style={{fontSize:14,color:'#6a8060',lineHeight:1.65,marginBottom:30}}>
            Choose a strong new password to secure<br/>your onboarding command centre.
          </p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {icon:'🔒',text:'Minimum 8 characters required',bg:'rgba(80,130,60,0.08)',border:'rgba(80,130,60,0.18)'},
              {icon:'✅',text:'Use letters, numbers & symbols',bg:'rgba(160,110,40,0.08)',border:'rgba(160,110,40,0.18)'},
              {icon:'🛡️',text:'Your data is always encrypted',bg:'rgba(80,130,60,0.08)',border:'rgba(80,130,60,0.18)'},
            ].map(({icon,text,bg,border}) => (
              <div key={text} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:bg,border:`1px solid ${border}`}}>
                <span style={{fontSize:15}}>{icon}</span>
                <span style={{fontSize:13,color:'#4a5e3a',fontWeight:500}}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{animation:'fadeUp 0.6s 0.9s ease both'}}>
          <div style={{
            display:'inline-flex',alignItems:'center',gap:8,
            background:'linear-gradient(135deg,rgba(78,128,64,0.1),rgba(160,110,40,0.1))',
            border:'1px solid rgba(100,90,50,0.2)',borderRadius:100,padding:'7px 17px'
          }}>
            <span style={{fontSize:12}}>✦</span>
            <span style={{fontSize:11,fontWeight:600,color:'#4a5a30',fontStyle:'italic'}}>You ask, we deliver — just ask.</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        flex:1,display:'flex',alignItems:'center',
        justifyContent:'center',padding:'48px 36px',
        position:'relative',zIndex:10
      }}>
        <div style={{
          position:'absolute',inset:0,
          background:'linear-gradient(155deg,#f8fdf5 0%,#fff 55%,#fdf9f0 100%)'
        }}/>
        <div style={{width:'100%',maxWidth:360,position:'relative',zIndex:2}}>

          {/* Mobile logo */}
          <div style={{textAlign:'center',marginBottom:32}} className="show-mobile">
            <style>{`@media(min-width:769px){.show-mobile{display:none!important}}`}</style>
            <div style={{
              width:48,height:48,borderRadius:14,
              background:'linear-gradient(135deg,#4e8040,#80b865)',
              display:'flex',alignItems:'center',justifyContent:'center',
              margin:'0 auto 10px',boxShadow:'0 4px 16px rgba(90,138,90,0.25)'
            }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/>
                <circle cx="10" cy="6" r="1.5" fill="white"/>
              </svg>
            </div>
            <span style={{color:'#1a2e14',fontWeight:700,fontSize:20}}>Onvio</span>
          </div>

          <div style={{
            background:'rgba(255,255,255,0.9)',
            backdropFilter:'blur(20px)',
            border:'1px solid rgba(134,167,123,0.25)',
            borderRadius:24,padding:'40px 36px',
            boxShadow:'0 24px 60px rgba(80,120,70,0.12)',
            animation:'fadeUp 0.6s 0.1s ease both'
          }}>
            <div style={{marginBottom:28}}>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#a0b888',marginBottom:8}}>
                Account Recovery
              </p>
              <h1 style={{fontSize:26,fontWeight:800,color:'#172812',letterSpacing:'-0.6px',margin:'0 0 6px'}}>
                Set new password
              </h1>
              <p style={{fontSize:13,color:'#90a878',margin:0}}>
                Choose a strong password for your account
              </p>
            </div>

            {!ready && (
              <div style={{
                background:'rgba(251,191,36,0.08)',
                border:'1px solid rgba(251,191,36,0.25)',
                borderRadius:12,padding:'12px 16px',marginBottom:20
              }}>
                <p style={{fontSize:12,color:'#7a6020',margin:0}}>
                  ⏳ Verifying your reset link...
                </p>
              </div>
            )}

            <form onSubmit={handleReset} style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={{
                  display:'block',color:'#7a9268',fontSize:10,
                  fontWeight:700,marginBottom:8,letterSpacing:'0.08em',textTransform:'uppercase'
                }}>New password</label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="Minimum 8 characters"
                  style={{
                    width:'100%',padding:'12px 15px',
                    background:'#f5faf2',
                    border:'1.5px solid rgba(100,150,70,0.22)',
                    borderRadius:12,color:'#1e3018',
                    fontSize:14,outline:'none',boxSizing:'border-box',
                    transition:'all 0.25s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(78,128,64,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(100,150,70,0.22)'}
                />
              </div>

              <div>
                <label style={{
                  display:'block',color:'#7a9268',fontSize:10,
                  fontWeight:700,marginBottom:8,letterSpacing:'0.08em',textTransform:'uppercase'
                }}>Confirm password</label>
                <input
                  type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repeat your password"
                  style={{
                    width:'100%',padding:'12px 15px',
                    background:'#f5faf2',
                    border:'1.5px solid rgba(100,150,70,0.22)',
                    borderRadius:12,color:'#1e3018',
                    fontSize:14,outline:'none',boxSizing:'border-box',
                    transition:'all 0.25s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(78,128,64,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(100,150,70,0.22)'}
                />
              </div>

              <button
                type="submit" disabled={loading}
                style={{
                  width:'100%',padding:'13px',border:'none',
                  borderRadius:12,color:'#fff',fontSize:14,
                  fontWeight:700,cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop:4,
                  background: loading
                    ? 'rgba(78,128,64,0.5)'
                    : 'linear-gradient(135deg,#4e8040 0%,#7ab062 50%,#9a7030 100%)',
                  animation:'glowPulse 2.5s ease-in-out infinite',
                  transition:'all 0.2s',
                  fontFamily:'inherit'
                }}
              >
                {loading ? 'Updating password...' : 'Update password →'}
              </button>

              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                style={{
                  color:'#7a9060',fontSize:12,background:'none',
                  border:'none',cursor:'pointer',padding:'4px 0',
                  fontFamily:'inherit'
                }}
              >
                Back to sign in
              </button>
            </form>
          </div>

          <p style={{
            textAlign:'center',color:'rgba(80,100,60,0.28)',
            fontSize:10,marginTop:16
          }}>
            Fully customised as per your need · Onvio
          </p>
        </div>
      </div>
    </div>
  )
}
