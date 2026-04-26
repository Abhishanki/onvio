'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRealtimeProject } from '@/lib/hooks/useRealtime'
import { formatDate, daysUntil, statusBadgeClass, ownerBadgeClass, ownerLabel, statusLabel, cn } from '@/lib/utils'
import {
  ChevronDown, ChevronRight, ExternalLink, Copy, AlertTriangle,
  Clock, CheckCircle2, Flag, MoreHorizontal, Paperclip, MessageSquare, Plus
} from 'lucide-react'

type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'na'
const STATUS_OPTIONS: TaskStatus[] = ['not_started', 'in_progress', 'completed', 'blocked', 'na']

interface Props { project: any; userRole: string }

export function ProjectTracker({ project: initialProject, userRole }: Props) {
  const [phases, setPhases] = useState<any[]>(initialProject.phases ?? [])
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([initialProject.phases?.[0]?.id]))
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null)
  const [editingFields, setEditingFields] = useState<Record<string, any>>({})
  const supabase = createClient()

  // Real-time updates
  useRealtimeProject(initialProject.id, useCallback(async () => {
    const { data } = await supabase
      .from('project_phases')
      .select('*, tasks:project_tasks(*, subtasks:project_subtasks(*))')
      .eq('project_id', initialProject.id)
      .order('sort_order')
    if (data) setPhases(data)
  }, [initialProject.id]))

  const togglePhase = (id: string) => {
    setExpandedPhases(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }
  const toggleTask = (id: string) => {
    setExpandedTasks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const updateSubtaskStatus = async (subtaskId: string, status: TaskStatus, taskId: string, phaseId: string) => {
    const updates: any = { status }
    if (status === 'completed') updates.completed_date = new Date().toISOString().split('T')[0]
    if (status === 'in_progress' && !phases.flatMap(p => p.tasks).flatMap((t: any) => t.subtasks).find((s: any) => s.id === subtaskId)?.start_date) {
      updates.start_date = new Date().toISOString().split('T')[0]
    }
    const { error } = await supabase.from('project_subtasks').update(updates).eq('id', subtaskId)
    if (error) { toast.error('Failed to update'); return }
    setPhases(prev => prev.map(ph => ph.id !== phaseId ? ph : {
      ...ph,
      tasks: ph.tasks.map((t: any) => t.id !== taskId ? t : {
        ...t,
        subtasks: t.subtasks.map((s: any) => s.id !== subtaskId ? s : { ...s, ...updates })
      })
    }))
  }

  const saveSubtaskFields = async (subtaskId: string, taskId: string, phaseId: string) => {
    const fields = editingFields[subtaskId]
    if (!fields) return
    const { error } = await supabase.from('project_subtasks').update(fields).eq('id', subtaskId)
    if (error) { toast.error('Failed to save'); return }
    setPhases(prev => prev.map(ph => ph.id !== phaseId ? ph : {
      ...ph,
      tasks: ph.tasks.map((t: any) => t.id !== taskId ? t : {
        ...t,
        subtasks: t.subtasks.map((s: any) => s.id !== subtaskId ? s : { ...s, ...fields })
      })
    }))
    setEditingSubtask(null)
    setEditingFields(prev => { const n = { ...prev }; delete n[subtaskId]; return n })
    toast.success('Saved')
  }

  const setField = (subtaskId: string, key: string, value: any) => {
    setEditingFields(prev => ({ ...prev, [subtaskId]: { ...(prev[subtaskId] ?? {}), [key]: value } }))
  }

  // Stats
  const allSubtasks = phases.flatMap(p => p.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? [])
  const completed = allSubtasks.filter(s => s.status === 'completed').length
  const blocked = allSubtasks.filter(s => s.status === 'blocked').length
  const slaBreached = allSubtasks.filter(s => s.sla_breached).length
  const pct = allSubtasks.length > 0 ? Math.round((completed / allSubtasks.length) * 100) : 0
  const daysLeft = daysUntil(initialProject.go_live_target)
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/portal/${initialProject.portal_token}`

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('w-2.5 h-2.5 rounded-full shrink-0',
                initialProject.rag === 'green' ? 'bg-emerald-500' :
                initialProject.rag === 'amber' ? 'bg-amber-500' : 'bg-red-500')} />
              <h1 className="text-lg font-bold text-slate-900">{initialProject.project_code}</h1>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600">{initialProject.client_company}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize',
                initialProject.status === 'active' ? 'bg-blue-50 text-blue-700' :
                initialProject.status === 'live' ? 'bg-emerald-50 text-emerald-700' :
                'bg-slate-100 text-slate-600')}>
                {initialProject.status?.replace('_', ' ')}
              </span>
              {initialProject.is_sales_flagged && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium flex items-center gap-1">
                  <Flag size={10}/> Sales Flag
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">{initialProject.solution_type} · {initialProject.client_name}
              {initialProject.om && <span> · OM: {initialProject.om.full_name}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { navigator.clipboard.writeText(portalUrl); toast.success('Portal link copied!') }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
              <Copy size={11}/> Portal Link
            </button>
            <Link href={`/projects/${initialProject.id}/dashboard`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
              Dashboard <ExternalLink size={11}/>
            </Link>
          </div>
        </div>

        {/* Progress + stats */}
        <div className="mt-4 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Overall progress</span>
              <span className="text-xs font-semibold text-slate-700">{completed}/{allSubtasks.length} tasks · {pct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs shrink-0">
            {blocked > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle size={12}/> {blocked} blocked
              </div>
            )}
            {slaBreached > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Clock size={12}/> {slaBreached} SLA breach
              </div>
            )}
            {daysLeft !== null && (
              <div className={cn('font-semibold',
                daysLeft < 0 ? 'text-red-600' : daysLeft < 7 ? 'text-amber-600' : 'text-slate-600')}>
                {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d to go-live`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase accordion */}
      {phases.map((phase, phaseIdx) => {
        const phaseSubs = phase.tasks?.flatMap((t: any) => t.subtasks ?? []) ?? []
        const phaseDone = phaseSubs.filter((s: any) => s.status === 'completed').length
        const phaseBlocked = phaseSubs.filter((s: any) => s.status === 'blocked').length
        const phasePct = phaseSubs.length > 0 ? Math.round((phaseDone / phaseSubs.length) * 100) : 0
        const isOpen = expandedPhases.has(phase.id)

        return (
          <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Phase header */}
            <button onClick={() => togglePhase(phase.id)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 text-left transition-colors">
              <span className="text-slate-400 shrink-0">
                {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
              </span>
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">
                {phaseIdx + 1}
              </span>
              <span className="font-semibold text-slate-900 flex-1">{phase.name}</span>
              {phaseBlocked > 0 && <span className="flex items-center gap-1 text-xs text-red-500"><AlertTriangle size={11}/>{phaseBlocked}</span>}
              {phasePct === 100 && <CheckCircle2 size={14} className="text-emerald-500"/>}
              <div className="flex items-center gap-2 ml-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${phasePct}%` }}/>
                </div>
                <span className="text-xs text-slate-400 w-7 text-right">{phasePct}%</span>
              </div>
            </button>

            {/* Tasks */}
            {isOpen && (
              <div className="border-t border-slate-100">
                {(phase.tasks ?? []).map((task: any) => {
                  const taskOpen = expandedTasks.has(task.id)
                  const taskSubs = task.subtasks ?? []
                  const taskDone = taskSubs.filter((s: any) => s.status === 'completed').length

                  return (
                    <div key={task.id} className="border-b border-slate-50 last:border-0">
                      <button onClick={() => toggleTask(task.id)}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 text-left">
                        <span className="text-slate-300 shrink-0 ml-5">
                          {taskOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                        </span>
                        <span className="text-sm font-medium text-slate-700 flex-1">{task.name}</span>
                        <span className="text-xs text-slate-400">{taskDone}/{taskSubs.length}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', ownerBadgeClass(task.owner))}>
                          {ownerLabel(task.owner)}
                        </span>
                        {task.support_doc_url && (
                          <a href={task.support_doc_url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1">
                            <Paperclip size={11}/>{task.support_doc_title ?? 'Doc'}
                          </a>
                        )}
                      </button>

                      {/* Subtasks table */}
                      {taskOpen && taskSubs.length > 0 && (
                        <div className="ml-14 mr-4 mb-3">
                          <div className="rounded-lg border border-slate-100 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium w-1/3">Subtask</th>
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Owner</th>
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium">TAT</th>
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Due</th>
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Status</th>
                                  <th className="text-left px-3 py-2 text-slate-400 font-medium">Tickets</th>
                                  <th className="px-3 py-2 w-8"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskSubs.map((sub: any) => {
                                  const isEditing = editingSubtask === sub.id
                                  const edited = editingFields[sub.id] ?? {}
                                  const displaySub = { ...sub, ...edited }

                                  return (
                                    <tr key={sub.id} className={cn('border-b border-slate-50 last:border-0',
                                      sub.sla_breached ? 'bg-red-50/30' : 'hover:bg-slate-50/50',
                                      isEditing && 'bg-indigo-50/30')}>
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                          {sub.sla_breached && <Clock size={10} className="text-red-400 shrink-0"/>}
                                          <span className={cn('text-slate-700', sub.status === 'completed' && 'line-through text-slate-400')}>
                                            {sub.name}
                                          </span>
                                        </div>
                                        {sub.support_doc_url && (
                                          <a href={sub.support_doc_url} target="_blank" rel="noopener noreferrer"
                                            className="text-indigo-400 hover:text-indigo-600 flex items-center gap-0.5 mt-0.5">
                                            <Paperclip size={9}/> {sub.support_doc_title ?? 'Doc'}
                                          </a>
                                        )}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className={cn('px-1.5 py-0.5 rounded text-xs', ownerBadgeClass(sub.owner))}>
                                          {ownerLabel(sub.owner)}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-slate-500">{sub.tat_days}d</td>
                                      <td className="px-3 py-2 text-slate-500">
                                        {sub.due_date ? formatDate(sub.due_date, 'MMM d') : '—'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <select value={displaySub.status}
                                          onChange={e => updateSubtaskStatus(sub.id, e.target.value as TaskStatus, task.id, phase.id)}
                                          className={cn('text-xs rounded-md px-1.5 py-1 border-0 cursor-pointer font-medium', statusBadgeClass(displaySub.status))}>
                                          {STATUS_OPTIONS.map(s => (
                                            <option key={s} value={s}>{statusLabel(s)}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-3 py-2">
                                        {isEditing ? (
                                          <div className="space-y-1">
                                            <input value={edited.jira_ticket_id ?? sub.jira_ticket_id ?? ''}
                                              onChange={e => setField(sub.id, 'jira_ticket_id', e.target.value)}
                                              placeholder="JIRA-123" className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs"/>
                                            <input value={edited.kapture_ticket_id ?? sub.kapture_ticket_id ?? ''}
                                              onChange={e => setField(sub.id, 'kapture_ticket_id', e.target.value)}
                                              placeholder="KAP-456" className="w-full border border-slate-200 rounded px-1.5 py-0.5 text-xs"/>
                                          </div>
                                        ) : (
                                          <div className="space-y-0.5">
                                            {sub.jira_ticket_id && (
                                              <div className="flex items-center gap-1">
                                                <span className="bg-blue-50 text-blue-600 px-1 rounded text-xs">J</span>
                                                {sub.jira_ticket_url
                                                  ? <a href={sub.jira_ticket_url} target="_blank" rel="noopener noreferrer"
                                                      className="text-blue-500 hover:underline flex items-center gap-0.5">
                                                      {sub.jira_ticket_id}<ExternalLink size={9}/>
                                                    </a>
                                                  : <span className="text-slate-600">{sub.jira_ticket_id}</span>}
                                              </div>
                                            )}
                                            {sub.kapture_ticket_id && (
                                              <div className="flex items-center gap-1">
                                                <span className="bg-orange-50 text-orange-600 px-1 rounded text-xs">K</span>
                                                <span className="text-slate-600">{sub.kapture_ticket_id}</span>
                                              </div>
                                            )}
                                            {!sub.jira_ticket_id && !sub.kapture_ticket_id && <span className="text-slate-300">—</span>}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-2 py-2">
                                        {isEditing ? (
                                          <div className="flex gap-1">
                                            <button onClick={() => saveSubtaskFields(sub.id, task.id, phase.id)}
                                              className="text-xs bg-indigo-600 text-white px-2 py-1 rounded">Save</button>
                                            <button onClick={() => { setEditingSubtask(null); setEditingFields(p => { const n={...p}; delete n[sub.id]; return n }) }}
                                              className="text-xs text-slate-400 px-1 py-1">✕</button>
                                          </div>
                                        ) : (
                                          <button onClick={() => setEditingSubtask(sub.id)}
                                            className="text-slate-300 hover:text-slate-500 p-0.5 rounded">
                                            <MoreHorizontal size={13}/>
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
