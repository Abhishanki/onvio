'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import { cn, ragDotClass } from '@/lib/utils'

interface Props { projects: any[]; teamMembers: any[] }

export function ManagerWarRoom({ projects, teamMembers }: Props) {
  const [filter, setFilter] = useState<'all' | 'green' | 'amber' | 'red'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => projects.filter(p => {
    if (filter !== 'all' && p.rag !== filter) return false
    if (search && !p.client_company?.toLowerCase().includes(search.toLowerCase()) &&
        !p.project_code?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [projects, filter, search])

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    red: projects.filter(p => p.rag === 'red').length,
    live: projects.filter(p => p.status === 'live' || p.status === 'hypercare').length,
  }

  const ragColors = {
    green: { bg: '#f0faf0', border: '#86c986', text: '#2d6a2d', dot: '#4caf50' },
    amber: { bg: '#fffbf0', border: '#f0c060', text: '#7a5a00', dot: '#f0a020' },
    red: { bg: '#fff5f5', border: '#f08080', text: '#7a1a1a', dot: '#e53e3e' },
  }

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .stat-card { border-radius:16px;padding:20px;transition:transform 0.2s,box-shadow 0.2s; }
        .stat-card:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.08); }
        .proj-row { border-radius:14px;padding:14px 18px;background:#fff;border:1px solid rgba(0,0,0,0.06);transition:all 0.18s;text-decoration:none;display:block;margin-bottom:8px; }
        .proj-row:hover { transform:translateX(4px);border-color:rgba(78,128,64,0.3);box-shadow:0 4px 16px rgba(78,128,64,0.1); }
        .filter-btn { padding:6px 14px;border-radius:100px;border:1.5px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.18s; }
        .search-inp { padding:9px 16px;border-radius:12px;border:1.5px solid rgba(100,150,70,0.2);background:#f5faf2;font-size:13px;outline:none;width:240px;transition:all 0.2s; }
        .search-inp:focus { border-color:rgba(78,128,64,0.5);box-shadow:0 0 0 3px rgba(78,128,64,0.1); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28, animation: 'fadeUp 0.5s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 28 }}>🎯</span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a2e14', margin: 0, letterSpacing: '-0.5px' }}>
            War Room
          </h1>
          {stats.red > 0 && (
            <div style={{
              background: '#fff5f5', border: '1px solid #f08080', borderRadius: 100,
              padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 6
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e53e3e', animation: 'pulse 1.5s ease-in-out infinite' }}/>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#c53030' }}>{stats.red} at risk</span>
            </div>
          )}
        </div>
        <p style={{ color: '#6a8060', fontSize: 14, margin: 0 }}>
          {format(new Date(), 'EEEE, MMMM d')} · {stats.active} active projects
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Total Projects', value: stats.total, emoji: '📁', bg: 'linear-gradient(135deg,#f2faea,#eaf5e0)', border: 'rgba(100,160,70,0.2)' },
          { label: 'Active Now', value: stats.active, emoji: '⚡', bg: 'linear-gradient(135deg,#f0f8ff,#e8f4ff)', border: 'rgba(70,130,200,0.2)' },
          { label: 'Needs Attention', value: stats.red, emoji: '🔴', bg: 'linear-gradient(135deg,#fff5f5,#ffe8e8)', border: 'rgba(200,70,70,0.2)' },
          { label: 'Live / Hypercare', value: stats.live, emoji: '🚀', bg: 'linear-gradient(135deg,#f5fff0,#e8ffe0)', border: 'rgba(70,180,70,0.2)' },
        ].map(({ label, value, emoji, bg, border }, i) => (
          <div key={label} className="stat-card" style={{
            background: bg, border: `1px solid ${border}`,
            animation: `fadeUp 0.5s ${i * 0.08}s ease both`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 800, color: '#1a2e14', margin: '0 0 4px', letterSpacing: '-1px' }}>{value}</p>
            <p style={{ fontSize: 12, color: '#6a8060', margin: 0, fontWeight: 500 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'green', 'amber', 'red'] as const).map(f => {
            const isActive = filter === f
            const colors = f === 'all' ? { bg: '#1a2e14', border: '#1a2e14', text: '#fff', inactive: '#e8f0e0' } :
              f === 'green' ? { bg: '#4caf50', border: '#4caf50', text: '#fff', inactive: '#f0faf0' } :
              f === 'amber' ? { bg: '#f0a020', border: '#f0a020', text: '#fff', inactive: '#fffbf0' } :
              { bg: '#e53e3e', border: '#e53e3e', text: '#fff', inactive: '#fff5f5' }
            return (
              <button key={f} onClick={() => setFilter(f)} className="filter-btn" style={{
                background: isActive ? colors.bg : colors.inactive,
                borderColor: isActive ? colors.border : 'transparent',
                color: isActive ? colors.text : '#6a8060',
              }}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f !== 'all' && ` (${projects.filter(p => p.rag === f).length})`}
              </button>
            )
          })}
        </div>
        <input className="search-inp" placeholder="🔍  Search projects..."
          value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Project list */}
      <div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6a8060' }}>
            <span style={{ fontSize: 40 }}>🌱</span>
            <p style={{ marginTop: 12, fontSize: 14 }}>No projects found</p>
          </div>
        )}
        {filtered.map((p, i) => {
          const daysLeft = p.go_live_target ? differenceInDays(new Date(p.go_live_target), new Date()) : null
          const ragC = ragColors[p.rag as keyof typeof ragColors] ?? ragColors.green
          return (
            <Link key={p.id} href={`/projects/${p.id}/tracker`} className="proj-row"
              style={{ animation: `fadeUp 0.4s ${i * 0.05}s ease both` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: ragC.dot,
                  boxShadow: `0 0 0 3px ${ragC.bg}`
                }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2e14' }}>{p.project_code}</span>
                    <span style={{ fontSize: 13, color: '#4a6044' }}>{p.client_company}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                      background: p.status === 'active' ? '#e8f5ff' : '#f0faf0',
                      color: p.status === 'active' ? '#1a6aa8' : '#2d6a2d',
                      textTransform: 'capitalize'
                    }}>{p.status?.replace('_', ' ')}</span>
                    {p.is_sales_flagged && <span style={{ fontSize: 10, background: '#fff0f0', color: '#c53030', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>🚩 Flagged</span>}
                  </div>
                  <div style={{ display: 'flex', align: 'center', gap: 16 }}>
                    <span style={{ fontSize: 11, color: '#8aaa7a' }}>{p.solution_type}</span>
                    {p.om?.full_name && <span style={{ fontSize: 11, color: '#8aaa7a' }}>OM: {p.om.full_name}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  {p.health_score !== undefined && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 16, fontWeight: 800, color: p.health_score >= 70 ? '#2d8a2d' : p.health_score >= 40 ? '#a07000' : '#c53030', margin: 0 }}>{p.health_score}</p>
                      <p style={{ fontSize: 9, color: '#8aaa7a', margin: 0, fontWeight: 500 }}>HEALTH</p>
                    </div>
                  )}
                  {daysLeft !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: 13, fontWeight: 700, margin: 0,
                        color: daysLeft < 0 ? '#c53030' : daysLeft < 7 ? '#a07000' : '#2d6a2d'
                      }}>{daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}</p>
                      <p style={{ fontSize: 9, color: '#8aaa7a', margin: 0, fontWeight: 500 }}>TO GO-LIVE</p>
                    </div>
                  )}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8aaa7a" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* New project CTA */}
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href="/projects/new" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #4e8040, #7ab062)',
          color: '#fff', textDecoration: 'none', padding: '12px 28px',
          borderRadius: 14, fontSize: 14, fontWeight: 700,
          boxShadow: '0 6px 20px rgba(78,128,64,0.35)',
          transition: 'transform 0.2s'
        }}>
          <span style={{ fontSize: 16 }}>+</span>
          New Project
        </Link>
      </div>
    </div>
  )
}
