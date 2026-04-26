'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { differenceInDays, format } from 'date-fns'
import { CheckCircle2, ChevronDown, ChevronRight, Clock, AlertCircle, LogOut } from 'lucide-react'
import { cn, statusLabel, ownerLabel } from '@/lib/utils'

interface Props { project: any; token: string }

export function ClientPortal({ project, token }: Props) {
  const [phases, setPhases] = useState(project.phases ?? [])
  const [expanded, setExpanded] = useState<Set<string>>(new Set([project.phases?.[0]?.id]))
  const [activeTab, setActiveTab] = useState<'tracker' | 'team' | 'uat'>('tracker')
  const [uatItems, setUatItems] = useState<any[]>([])
  const [signoffName, setSignoffName] = useState('')
  const [signoffEmail, setSignoffEmail] = useState('')
  const [signing, setSigning] = useState(false)
  const supabase = createClient()

  const org = project.organisation
  const primary = org?.primary_color ?? '#6366f1'
  const daysLeft = project.go_live_target ? differenceInDays(new Date(project.go_live_target), new Date()) : null

  const allSubs = useMemo(() => phases.flatMap((p: any) => p.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []), [phases])
  const completedCount = allSubs.filter((s: any) => s.status === 'completed').length
  const customerPending = allSubs.filter((s: any) => s.owner !== 'uc' && s.status !== 'completed' && s.status !== 'na')
  const pct = allSubs.length > 0 ? Math.round((completedCount / allSubs.length) * 100) : 0

  const updateClientTask = async (subtaskId: string, taskId: string, phaseId: string, status: string) => {
    const { error } = await supabase.from('project_subtasks')
      .update({ status, ...(status === 'completed' ? { completed_date: new Date().toISOString().split('T')[0] } : {}) })
      .eq('id', subtaskId)
    if (error) { toast.error('Update failed'); return }
    setPhases((prev: any[]) => prev.map(ph => ph.id !== phaseId ? ph : {
      ...ph, tasks: ph.tasks.map((t: any) => t.id !== taskId ? t : {
        ...t, subtasks: t.subtasks.map((s: any) => s.id !== subtaskId ? s : { ...s, status })
      })
    }))
    toast.success('Task updated!')
  }

  const handleUATSignoff = async () => {
    if (!signoffName || !signoffEmail) { toast.error('Please enter your name and email'); return }
    setSigning(true)
    const { error } = await supabase.from('uat_signoffs').insert({
      project_id: project.id,
      signed_by_name: signoffName,
      signed_by_email: signoffEmail,
    })
    setSigning(false)
    if (error) { toast.error('Sign-off failed'); return }
    // Update project status
    await supabase.from('projects').update({ status: 'go_live_ready' }).eq('id', project.id)
    toast.success('UAT signed off! Your OM has been notified.')
  }

  const team = [
    { ...project.om, role_label: 'Onboarding Manager' },
    { ...project.lead, role_label: 'Implementation Lead' },
    { ...project.manager, role_label: 'Director' },
  ].filter(m => m?.full_name)

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org?.logo_url
              ? <img src={org.logo_url} alt={org.name} className="h-8 object-contain"/>
              : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: primary }}>{org?.name?.[0] ?? 'O'}</div>}
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">{project.client_company}</p>
              <p className="text-xs text-slate-400">{project.project_code} · Implementation Portal</p>
            </div>
          </div>
          <div className="text-xs text-slate-400">Powered by <span className="font-semibold text-slate-600">Onvio</span></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Welcome, {project.client_name}! 👋</h1>
              <p className="text-slate-500 text-sm mt-1">{project.solution_type} Implementation</p>
            </div>
            {daysLeft !== null && (
              <div className="sm:text-right">
                <p className={cn('text-3xl font-bold',
                  daysLeft < 0 ? 'text-red-600' : daysLeft < 7 ? 'text-amber-600' : 'text-emerald-600')}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                </p>
                <p className="text-xs text-slate-400">{daysLeft < 0 ? 'overdue' : 'to go-live'}</p>
                {project.go_live_target && (
                  <p className="text-xs text-slate-400">{format(new Date(project.go_live_target), 'MMM d, yyyy')}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-600">Overall progress</span>
              <span className="font-semibold text-slate-900">{completedCount}/{allSubs.length} tasks · {pct}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: primary }}/>
            </div>
          </div>

          {customerPending.length > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
              <AlertCircle size={14} className="text-amber-500 shrink-0"/>
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{customerPending.length} action{customerPending.length > 1 ? 's' : ''} required</span> from your side
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-slate-200">
          {(['tracker', 'team', 'uat'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('flex-1 py-2.5 text-sm font-medium rounded-lg transition-all',
                activeTab === tab ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              style={activeTab === tab ? { background: primary } : {}}>
              {tab === 'uat' ? 'UAT Sign-off' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tracker */}
        {activeTab === 'tracker' && (
          <div className="space-y-3">
            {phases.map((phase: any) => {
              const subs = phase.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []
              const done = subs.filter((s: any) => s.status === 'completed').length
              const phasePct = subs.length > 0 ? Math.round((done / subs.length) * 100) : 0
              const isOpen = expanded.has(phase.id)

              return (
                <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button onClick={() => setExpanded(prev => { const s = new Set(prev); s.has(phase.id) ? s.delete(phase.id) : s.add(phase.id); return s })}
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 text-left">
                    {isOpen ? <ChevronDown size={15} className="text-slate-400"/> : <ChevronRight size={15} className="text-slate-400"/>}
                    <span className="font-semibold text-slate-900 flex-1">{phase.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${phasePct}%`, background: primary }}/>
                      </div>
                      <span className="text-xs text-slate-400">{phasePct}%</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100">
                      {phase.tasks?.map((task: any) => (
                        <div key={task.id} className="border-b border-slate-50 last:border-0">
                          <div className="px-5 py-3 flex items-center gap-3">
                            <div className="w-6 shrink-0 flex justify-center">
                              {task.status === 'completed'
                                ? <CheckCircle2 size={15} className="text-emerald-500"/>
                                : <div className="w-4 h-4 rounded-full border-2 border-slate-300"/>}
                            </div>
                            <span className={cn('text-sm font-medium flex-1', task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700')}>{task.name}</span>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full',
                              task.owner === 'customer' ? 'bg-orange-50 text-orange-600' :
                              task.owner === 'uc' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600')}>
                              {task.owner === 'customer' ? '⚡ Your task' : task.owner === 'uc' ? 'Our task' : 'Shared'}
                            </span>
                          </div>

                          {/* Subtasks */}
                          {(task.subtasks ?? []).length > 0 && (
                            <div className="ml-14 mr-4 mb-3 space-y-1.5">
                              {task.subtasks.map((sub: any) => (
                                <div key={sub.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg',
                                  sub.owner !== 'uc' && sub.status !== 'completed' ? 'bg-orange-50/50' : 'bg-slate-50/50')}>
                                  {sub.status === 'completed'
                                    ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0"/>
                                    : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"/>}
                                  <span className={cn('text-sm flex-1', sub.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-600')}>
                                    {sub.name}
                                  </span>
                                  {/* Client can update their own tasks */}
                                  {sub.owner !== 'uc' && sub.status !== 'completed' && (
                                    <button onClick={() => updateClientTask(sub.id, task.id, phase.id, 'completed')}
                                      className="text-xs px-2.5 py-1 rounded-lg text-white font-medium shrink-0"
                                      style={{ background: primary }}>
                                      Mark Done
                                    </button>
                                  )}
                                  {sub.owner !== 'uc' && sub.status !== 'completed' && sub.status !== 'not_started' && (
                                    <span className="text-xs text-orange-500 font-medium shrink-0">In progress</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Team */}
        {activeTab === 'team' && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-4">Meet Your Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {team.map((member: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                  {member.photo_url
                    ? <img src={member.photo_url} alt={member.full_name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-slate-100"/>
                    : <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold border-2 border-white shadow-sm"
                        style={{ background: primary }}>{member.full_name?.[0]}</div>}
                  <p className="font-semibold text-slate-900">{member.full_name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{member.role_label}</p>
                  {member.designation && <p className="text-xs text-slate-400">{member.designation}</p>}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-xs mt-2 block hover:underline" style={{ color: primary }}>
                      {member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UAT Sign-off */}
        {activeTab === 'uat' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={18} className="text-indigo-500"/>
              <h2 className="font-semibold text-slate-900">User Acceptance Testing Sign-off</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              By signing off, you confirm that all UAT scenarios have been tested and you approve the go-live.
            </p>

            {project.status === 'go_live_ready' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2"/>
                <p className="font-semibold text-emerald-800">UAT signed off!</p>
                <p className="text-sm text-emerald-600 mt-1">Your project is marked as Go-Live Ready.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">Before signing off, confirm:</p>
                  {[
                    'All core workflows have been tested successfully',
                    'Order management is functioning correctly',
                    'Inventory sync is working as expected',
                    'Training has been completed for warehouse staff',
                  ].map((item, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600"/>
                      <span className="text-sm text-slate-600">{item}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your full name *</label>
                    <input value={signoffName} onChange={e => setSignoffName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Jane Doe"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Your email *</label>
                    <input type="email" value={signoffEmail} onChange={e => setSignoffEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="jane@company.com"/>
                  </div>
                </div>
                <button onClick={handleUATSignoff} disabled={signing}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-opacity"
                  style={{ background: primary }}>
                  {signing ? 'Submitting…' : '✅ I confirm UAT is complete — Submit Sign-off'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
