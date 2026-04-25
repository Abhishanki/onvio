'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getInitials, cn } from '@/lib/utils'

const NAV: Record<string, { href: string; label: string; emoji: string }[]> = {
  manager: [
    { href: '/manager', label: 'War Room', emoji: '🎯' },
    { href: '/projects', label: 'Projects', emoji: '📁' },
    { href: '/settings/templates', label: 'Templates', emoji: '🧩' },
    { href: '/settings/team', label: 'Team', emoji: '👥' },
    { href: '/settings/branding', label: 'Branding', emoji: '🎨' },
  ],
  lead: [
    { href: '/lead', label: 'My Team', emoji: '👥' },
    { href: '/projects', label: 'Projects', emoji: '📁' },
  ],
  om: [
    { href: '/om', label: 'Dashboard', emoji: '🏠' },
    { href: '/projects', label: 'Projects', emoji: '📁' },
  ],
}

export function AppShell({ profile, children }: { profile: any; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const nav = NAV[profile?.role] ?? NAV.om
  const org = profile?.organisation

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8faf6', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .nav-item { display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:12px;text-decoration:none;transition:all 0.18s;cursor:pointer;border:none;background:none;width:100%; }
        .nav-item:hover { background:rgba(255,255,255,0.08); }
        .nav-item.active { background:linear-gradient(135deg,rgba(78,128,64,0.25),rgba(120,170,80,0.15));border:1px solid rgba(120,180,80,0.25); }
        .nav-label { font-size:13px;font-weight:500;color:rgba(255,255,255,0.75);white-space:nowrap; }
        .nav-item.active .nav-label { color:#ffffff;font-weight:600; }
        .sidebar-scroll::-webkit-scrollbar { width:0; }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'linear-gradient(180deg, #1a2e14 0%, #0f1f0a 100%)',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        transition: 'width 0.2s ease', flexShrink: 0,
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px', display: 'flex',
          alignItems: 'center', gap: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #4e8040, #7ab062)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(78,128,64,0.4)'
          }}>
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L4 7v11h4v-6h4v6h4V7L10 2z" fill="white" opacity=".95"/>
              <circle cx="10" cy="6" r="1.5" fill="white"/>
            </svg>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0, letterSpacing: '-0.3px' }}>Onvio</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org?.name}</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'rgba(255,255,255,0.3)', flexShrink: 0, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed
                ? <polyline points="9 18 15 12 9 6"/>
                : <polyline points="15 18 9 12 15 6"/>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }} className="sidebar-scroll">
          {!collapsed && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 6px', margin: '0 0 8px' }}>
              {profile?.role?.toUpperCase()}
            </p>
          )}
          {nav.map(({ href, label, emoji }) => (
            <Link key={href} href={href}
              className={cn('nav-item', isActive(href) && 'active')}
              style={{ marginBottom: 2, justifyContent: collapsed ? 'center' : 'flex-start' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{emoji}</span>
              {!collapsed && <span className="nav-label">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/profile" className="nav-item" style={{ marginBottom: 4, justifyContent: collapsed ? 'center' : 'flex-start' }}>
            {profile?.photo_url
              ? <img src={profile.photo_url} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}/>
              : <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #4e8040, #7ab062)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff'
                }}>{getInitials(profile?.full_name ?? '')}</div>}
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.full_name}</p>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, textTransform: 'capitalize' }}>{profile?.role}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button onClick={handleSignOut} className="nav-item" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span className="nav-label" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: 56, background: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12, flexShrink: 0,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, color: '#6a8060', margin: 0 }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #f2faea, #faf6ed)',
            border: '1px solid rgba(100,150,70,0.2)',
            borderRadius: 100, padding: '5px 12px'
          }}>
            {profile?.photo_url
              ? <img src={profile.photo_url} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}/>
              : <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4e8040, #7ab062)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff'
                }}>{getInitials(profile?.full_name ?? '')}</div>}
            <span style={{ fontSize: 12, fontWeight: 600, color: '#2a4018' }}>{profile?.full_name?.split(' ')[0]}</span>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
