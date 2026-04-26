'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate, timeAgo, ragBadgeClass, cn } from '@/lib/utils'
import {
  ArrowLeft, Send, FileDown, Flag, ToggleLeft, ToggleRight,
  Activity, BarChart2, Layers, AlertCircle, Mail
} from 'lucide-react'

interface Props {
  project: any
  channels: any[]
  activityLog: any[]
  userRole: string
}

type Tab = 'overview' | 'channels' | 'activity' | 'emails'

export function ProjectDashboard({ project, channels: initialChannels, activityLog, userRole }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [channels, setChannels] = useState(initialChannels)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [welcomeNote, setWelcomeNote] = useState('')
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [isSalesFlag, setIsSalesFlag] = useState(project.is_sales_flagged)
  const [salesFlagReason, setSalesFlagReason] = useState(project.sales_flag_reason ?? '')
  const supabase = createClient()

  // Phase stats
  const phases = project.phases ?? []
  const allSubs = phases.flatMap((p: any) => p.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? [])
  const total = allSubs.length
  const completed = allSubs.filter((s: any) => s.status === 'completed').length
  const blocked = allSubs.filter((s: any) => s.status === 'blocked').length

  const phaseStats = phases.map((phase: any) => {
    const subs = phase.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []
    const done = subs.filter((s: any) => s.status === 'completed').length
    return { name: phase.name, total: subs.length, done, pct: subs.length > 0 ? Math.round((done / subs.length) * 100) : 0 }
  })

  const sendWelcomeEmail = async () => {
    setSendingEmail('welcome')
    const res = await fetch('/api/emails/welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, custom_note: welcomeNote }),
    })
    setSendingEmail(null)
    setShowWelcomeModal(false)
    if (!res.ok) { toast.error('Failed to send email'); return }
    toast.success('Welcome email sent!')
  }

  const sendDashboard = async () => {
    setSendingEmail('dashboard')
    const res = await fetch('/api/emails/dashboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id })
    })
    setSendingEmail(null)
    if (!res.ok) { toast.error('Failed to send dashboard'); return }
    toast.success('Dashboard email sent to client!')
  }

  const toggleChannel = async (channelId: string, field: 'order_sync' | 'inventory_sync', current: boolean) => {
    await supabase.from('project_channels').update({ [field]: !current }).eq('id', channelId)
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, [field]: !current } : c))
  }

  const toggleSalesFlag = async () => {
    const newVal = !isSalesFlag
    await supabase.from('projects').update({ is_sales_flagged: newVal, sales_flag_reason: newVal ? salesFlagReason : null }).eq('id', project.id)
    setIsSalesFlag(newVal)
    toast.success(newVal ? 'Sales flag raised' : 'Sales flag cleared')
  }

  const exportToSheets = async () => {
    const res = await fetch(`/api/projects/${project.id}/export`)
    if (!res.ok) { toast.error('Export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${project.project_code}.xlsx`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported!')
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'channels', label: 'Channels', icon: Layers },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'emails', label: 'Emails & Actions', icon: Mail },
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${project.id}/tracker`} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
          <ArrowLeft size={16}/>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900">{project.project_code} · Dashboard</h1>
          <p className="text-xs text-slate-400">{project.client_company} · {project.solution_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToSheets} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
            <FileDown size={12}/> Export XLSX
          </button>
          <button onClick={() => setShowWelcomeModal(true)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
            <Send size={11}/> Send Welcome
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Progress', value: `${total > 0 ? Math.round((completed/total)*100) : 0}%`, sub: `${completed}/${total} tasks` },
          { label: 'Health Score', value: project.health_score, sub: '/100' },
          { label: 'Blocked', value: blocked, sub: 'tasks', alert: blocked > 0 },
          { label: 'RAG Status', value: project.rag.toUpperCase(), sub: project.rag_override ? 'manual' : 'auto',
            badge: ragBadgeClass(project.rag) },
        ].map(({ label, value, sub, alert, badge }) => (
          <div key={label} className={cn('bg-white rounded-xl border p-4',
            alert ? 'border-red-200' : 'border-slate-200')}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={cn('text-xl font-bold', alert ? 'text-red-600' : 'text-slate-900',
              badge && `px-2 py-0.5 rounded-full text-sm border inline-block ${badge}`)}>
              {value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50')}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Phase Progress</h3>
            <div className="space-y-3">
              {phaseStats.map((ph: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 w-40 truncate">{ph.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${ph.pct}%` }}/>
                  </div>
                  <span className="text-xs text-slate-500 w-16 text-right">{ph.done}/{ph.total} · {ph.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sales flag */}
          <div className={cn('bg-white rounded-xl border p-5', isSalesFlag ? 'border-red-200' : 'border-slate-200')}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flag size={15} className={isSalesFlag ? 'text-red-500' : 'text-slate-400'}/>
                <span className="font-semibold text-slate-900">Sales Intervention</span>
                {isSalesFlag && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">Active</span>}
              </div>
              <button onClick={toggleSalesFlag}
                className={cn('text-xs px-3 py-1.5 rounded-lg font-medium transition-colors',
                  isSalesFlag ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {isSalesFlag ? 'Clear Flag' : 'Raise Flag'}
              </button>
            </div>
            {!isSalesFlag && (
              <textarea value={salesFlagReason} onChange={e => setSalesFlagReason(e.target.value)} rows={2}
                placeholder="Describe why sales intervention is needed..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"/>
            )}
            {isSalesFlag && salesFlagReason && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{salesFlagReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Channels tab */}
      {activeTab === 'channels' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Channel Status</h3>
            <span className="text-xs text-slate-400">{channels.length} channels</span>
          </div>
          {channels.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">No channels configured</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Channel</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Active</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Order Sync</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Inventory Sync</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Go-Live</th>
              </tr></thead>
              <tbody>
                {channels.map(ch => (
                  <tr key={ch.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-900">{ch.channel_name}</td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', ch.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {ch.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleChannel(ch.id, 'order_sync', ch.order_sync)}>
                        {ch.order_sync ? <ToggleRight size={20} className="text-emerald-500"/> : <ToggleLeft size={20} className="text-slate-300"/>}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleChannel(ch.id, 'inventory_sync', ch.inventory_sync)}>
                        {ch.inventory_sync ? <ToggleRight size={20} className="text-emerald-500"/> : <ToggleLeft size={20} className="text-slate-300"/>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(ch.go_live_date) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activity log tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Activity Log</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {activityLog.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">No activity yet</div>}
            {activityLog.map(entry => (
              <div key={entry.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity size={11} className="text-slate-500"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{entry.actor_name}</span> {entry.action}
                    {entry.entity_name && <span className="text-slate-500"> · {entry.entity_name}</span>}
                  </p>
                  {entry.remarks && <p className="text-xs text-slate-400 mt-0.5">{entry.remarks}</p>}
                  {(entry.jira_id || entry.kapture_id) && (
                    <div className="flex gap-2 mt-1">
                      {entry.jira_id && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">JIRA: {entry.jira_id}</span>}
                      {entry.kapture_id && <span className="text-xs bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">KAP: {entry.kapture_id}</span>}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400 shrink-0">{timeAgo(entry.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emails tab */}
      {activeTab === 'emails' && (
        <div className="space-y-3">
          {[
            { title: 'Welcome Email', desc: 'Sent from your email with portal link, team photos, and go-live date', action: () => setShowWelcomeModal(true), label: 'Send Welcome', color: 'bg-indigo-600 hover:bg-indigo-700' },
            { title: 'Send Dashboard', desc: 'Rich HTML email with phase progress, channels, and blocked items', action: sendDashboard, label: sendingEmail === 'dashboard' ? 'Sending…' : 'Send Dashboard', color: 'bg-slate-800 hover:bg-slate-900' },
          ].map(({ title, desc, action, label, color }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button onClick={action} disabled={!!sendingEmail}
                className={cn('text-sm px-4 py-2 rounded-lg text-white font-medium transition-colors shrink-0', color, sendingEmail && 'opacity-60')}>
                {label}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Welcome email modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-bold text-slate-900 mb-1">Send Welcome Email</h2>
            <p className="text-sm text-slate-500 mb-4">
              To: {project.client_contact_l1_email ?? project.client_name}<br/>
              From: {project.om?.full_name} ({project.om?.email})
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Personal note (optional)</label>
              <textarea value={welcomeNote} onChange={e => setWelcomeNote(e.target.value)} rows={3}
                placeholder="Add a personal message for the client..."
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowWelcomeModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={sendWelcomeEmail} disabled={sendingEmail === 'welcome'}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {sendingEmail === 'welcome' ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
