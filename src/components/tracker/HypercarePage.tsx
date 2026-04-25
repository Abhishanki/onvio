'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatDate, timeAgo, cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Clock, Plus, X } from 'lucide-react'

interface Props { project: any; issues: any[]; changeRequests: any[]; userRole: string; userName: string }

const SEVERITY_COLORS: Record<string, string> = {
  P1: 'bg-red-100 text-red-700', P2: 'bg-orange-100 text-orange-700',
  P3: 'bg-amber-100 text-amber-700', P4: 'bg-slate-100 text-slate-600',
}
const SLA_HOURS: Record<string, number> = { P1: 4, P2: 8, P3: 24, P4: 72 }
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-50 text-red-600', in_progress: 'bg-blue-50 text-blue-600',
  resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-100 text-slate-500',
}

export function HypercarePage({ project, issues: initialIssues, changeRequests: initialCRs, userRole, userName }: Props) {
  const [issues, setIssues] = useState(initialIssues)
  const [crs, setCRs] = useState(initialCRs)
  const [activeTab, setActiveTab] = useState<'issues' | 'cr'>('issues')
  const [showNewIssue, setShowNewIssue] = useState(false)
  const [showNewCR, setShowNewCR] = useState(false)
  const [issueForm, setIssueForm] = useState({ title: '', description: '', severity: 'P3' })
  const [crForm, setCRForm] = useState({ title: '', description: '', scope_impact: '', timeline_impact: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const createIssue = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const { data, error } = await supabase.from('hypercare_issues').insert({
      project_id: project.id,
      raised_by_name: userName,
      title: issueForm.title,
      description: issueForm.description,
      severity: issueForm.severity,
      sla_hours: SLA_HOURS[issueForm.severity],
    }).select().single()
    setSaving(false)
    if (error) { toast.error('Failed to create issue'); return }
    setIssues(prev => [data, ...prev])
    setShowNewIssue(false)
    setIssueForm({ title: '', description: '', severity: 'P3' })
    toast.success('Issue created')
  }

  const updateIssueStatus = async (issueId: string, status: string) => {
    await supabase.from('hypercare_issues').update({
      status,
      ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
    }).eq('id', issueId)
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i))
    toast.success('Issue updated')
  }

  const createCR = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const crNumber = `CR-${String(crs.length + 1).padStart(3, '0')}`
    const { data, error } = await supabase.from('change_requests').insert({
      project_id: project.id, cr_number: crNumber, ...crForm
    }).select().single()
    setSaving(false)
    if (error) { toast.error('Failed to create CR'); return }
    setCRs(prev => [data, ...prev])
    setShowNewCR(false)
    setCRForm({ title: '', description: '', scope_impact: '', timeline_impact: '' })
    toast.success('Change request created')
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hypercare — {project.project_code}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{project.client_company} · Post go-live support window</p>
        </div>
        {project.status !== 'completed' && (
          <button onClick={async () => {
            await supabase.from('projects').update({ status: 'completed' }).eq('id', project.id)
            await fetch('/api/emails/graduation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project_id: project.id }) })
            toast.success('Project marked complete! Graduation email sent.')
          }} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium">
            🎓 Graduate Project
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Issues', value: issues.length, color: '' },
          { label: 'Open', value: issues.filter(i => i.status === 'open').length, color: 'text-red-600' },
          { label: 'P1 / P2', value: issues.filter(i => i.severity === 'P1' || i.severity === 'P2').length, color: 'text-orange-600' },
          { label: 'Resolved', value: issues.filter(i => i.status === 'resolved' || i.status === 'closed').length, color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color || 'text-slate-900')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200">
        {([['issues', 'Issues'], ['cr', 'Change Requests']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
              activeTab === id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}>
            {label}
          </button>
        ))}
      </div>

      {/* Issues */}
      {activeTab === 'issues' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowNewIssue(true)}
              className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg">
              <Plus size={13}/> Raise Issue
            </button>
          </div>

          {showNewIssue && (
            <form onSubmit={createIssue} className="bg-white rounded-xl border border-red-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">New Issue</h3>
                <button type="button" onClick={() => setShowNewIssue(false)} className="text-slate-400"><X size={16}/></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input required value={issueForm.title} onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))}
                    className={inputCls} placeholder="Issue title"/>
                </div>
                <select value={issueForm.severity} onChange={e => setIssueForm(f => ({ ...f, severity: e.target.value }))} className={inputCls}>
                  {['P1', 'P2', 'P3', 'P4'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <textarea required value={issueForm.description} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className={inputCls} placeholder="Description..."/>
              <div className="flex justify-end gap-2">
                <button type="submit" disabled={saving} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create Issue'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {issues.length === 0 && <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No issues raised</div>}
            {issues.map(issue => (
              <div key={issue.id} className={cn('bg-white rounded-xl border p-4', issue.sla_breached ? 'border-red-200' : 'border-slate-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 mt-0.5', SEVERITY_COLORS[issue.severity])}>
                      {issue.severity}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{issue.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{issue.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span>SLA: {issue.sla_hours}h</span>
                        <span>By: {issue.raised_by_name}</span>
                        <span>{timeAgo(issue.created_at)}</span>
                        {issue.sla_breached && <span className="text-red-500 font-medium flex items-center gap-1"><Clock size={10}/>SLA Breached</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[issue.status])}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    {issue.status === 'open' && (
                      <button onClick={() => updateIssueStatus(issue.id, 'in_progress')}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100">Start</button>
                    )}
                    {issue.status === 'in_progress' && (
                      <button onClick={() => updateIssueStatus(issue.id, 'resolved')}
                        className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded hover:bg-emerald-100">Resolve</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Change Requests */}
      {activeTab === 'cr' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowNewCR(true)}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg">
              <Plus size={13}/> New CR
            </button>
          </div>

          {showNewCR && (
            <form onSubmit={createCR} className="bg-white rounded-xl border border-indigo-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">New Change Request</h3>
                <button type="button" onClick={() => setShowNewCR(false)} className="text-slate-400"><X size={16}/></button>
              </div>
              <input required value={crForm.title} onChange={e => setCRForm(f => ({ ...f, title: e.target.value }))}
                className={inputCls} placeholder="CR title"/>
              <textarea required value={crForm.description} onChange={e => setCRForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className={inputCls} placeholder="What is the change?"/>
              <div className="grid grid-cols-2 gap-3">
                <input value={crForm.scope_impact} onChange={e => setCRForm(f => ({ ...f, scope_impact: e.target.value }))}
                  className={inputCls} placeholder="Scope impact"/>
                <input value={crForm.timeline_impact} onChange={e => setCRForm(f => ({ ...f, timeline_impact: e.target.value }))}
                  className={inputCls} placeholder="Timeline impact (e.g. +3 days)"/>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create CR'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {crs.length === 0 && <div className="bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400 text-sm">No change requests</div>}
            {crs.map(cr => (
              <div key={cr.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">{cr.cr_number}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize',
                        cr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                        cr.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        cr.status === 'pending_client' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                        {cr.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 mt-2">{cr.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{cr.description}</p>
                    {(cr.scope_impact || cr.timeline_impact) && (
                      <div className="flex gap-3 mt-2 text-xs text-slate-400">
                        {cr.scope_impact && <span>Scope: {cr.scope_impact}</span>}
                        {cr.timeline_impact && <span>Timeline: {cr.timeline_impact}</span>}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-4">{timeAgo(cr.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
