'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { templates: any[]; orgId: string }

export function TemplateEditor({ templates: initial, orgId }: Props) {
  const [templates, setTemplates] = useState(initial)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initial[0]?.id ?? '')
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [editingPhase, setEditingPhase] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const supabase = createClient()

  const currentTemplate = templates.find(t => t.id === selectedTemplate)
  const phases = currentTemplate?.phases ?? []

  const savePhase = async (phaseId: string) => {
    await supabase.from('template_phases').update({ name: editValue }).eq('id', phaseId)
    setTemplates(prev => prev.map(t => t.id !== selectedTemplate ? t : {
      ...t, phases: t.phases.map((p: any) => p.id !== phaseId ? p : { ...p, name: editValue })
    }))
    setEditingPhase(null)
    toast.success('Phase updated')
  }

  const saveTask = async (taskId: string, phaseId: string) => {
    await supabase.from('template_tasks').update({ name: editValue }).eq('id', taskId)
    setTemplates(prev => prev.map(t => t.id !== selectedTemplate ? t : {
      ...t, phases: t.phases.map((p: any) => p.id !== phaseId ? p : {
        ...p, tasks: p.tasks.map((tk: any) => tk.id !== taskId ? tk : { ...tk, name: editValue })
      })
    }))
    setEditingTask(null)
    toast.success('Task updated')
  }

  const addPhase = async () => {
    const name = `New Phase ${phases.length + 1}`
    const { data } = await supabase.from('template_phases').insert({
      template_id: selectedTemplate, name, sort_order: phases.length
    }).select().single()
    if (data) {
      setTemplates(prev => prev.map(t => t.id !== selectedTemplate ? t : {
        ...t, phases: [...t.phases, { ...data, tasks: [] }]
      }))
      toast.success('Phase added')
    }
  }

  const addTask = async (phaseId: string) => {
    const phase = phases.find((p: any) => p.id === phaseId)
    const { data } = await supabase.from('template_tasks').insert({
      phase_id: phaseId, name: 'New Task', owner: 'uc', tat_days: 1,
      sort_order: (phase?.tasks?.length ?? 0)
    }).select().single()
    if (data) {
      setTemplates(prev => prev.map(t => t.id !== selectedTemplate ? t : {
        ...t, phases: t.phases.map((p: any) => p.id !== phaseId ? p : {
          ...p, tasks: [...p.tasks, { ...data, subtasks: [] }]
        })
      }))
      toast.success('Task added')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Template Editor</h1>
        <p className="text-slate-500 text-sm mt-0.5">Edit phases and tasks for each solution type</p>
      </div>

      {/* Template selector */}
      <div className="flex gap-2">
        {templates.map(t => (
          <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedTemplate === t.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {t.name}
          </button>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase: any, pi: number) => {
          const isOpen = expandedPhases.has(phase.id)
          return (
            <div key={phase.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button onClick={() => setExpandedPhases(prev => { const s = new Set(prev); s.has(phase.id) ? s.delete(phase.id) : s.add(phase.id); return s })}
                  className="text-slate-400">
                  {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                </button>
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center shrink-0">{pi+1}</span>
                {editingPhase === phase.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') savePhase(phase.id); if (e.key === 'Escape') setEditingPhase(null) }}
                      className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    <button onClick={() => savePhase(phase.id)} className="text-emerald-500"><Check size={15}/></button>
                    <button onClick={() => setEditingPhase(null)} className="text-slate-400"><X size={15}/></button>
                  </div>
                ) : (
                  <span className="font-semibold text-slate-900 flex-1">{phase.name}</span>
                )}
                {editingPhase !== phase.id && (
                  <button onClick={() => { setEditingPhase(phase.id); setEditValue(phase.name) }}
                    className="p-1 text-slate-300 hover:text-slate-500 rounded"><Edit2 size={13}/></button>
                )}
              </div>

              {isOpen && (
                <div className="border-t border-slate-100">
                  {(phase.tasks ?? []).map((task: any) => {
                    const taskOpen = expandedTasks.has(task.id)
                    return (
                      <div key={task.id} className="border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-3 px-5 py-3">
                          <button onClick={() => setExpandedTasks(prev => { const s = new Set(prev); s.has(task.id) ? s.delete(task.id) : s.add(task.id); return s })}
                            className="text-slate-300 ml-7">{taskOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>
                          {editingTask === task.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveTask(task.id, phase.id); if (e.key === 'Escape') setEditingTask(null) }}
                                className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none"/>
                              <button onClick={() => saveTask(task.id, phase.id)} className="text-emerald-500"><Check size={13}/></button>
                              <button onClick={() => setEditingTask(null)} className="text-slate-400"><X size={13}/></button>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-700 flex-1">{task.name}</span>
                          )}
                          <span className={cn('text-xs px-2 py-0.5 rounded-full',
                            task.owner === 'customer' ? 'bg-orange-50 text-orange-600' :
                            task.owner === 'uc' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600')}>
                            {task.owner}
                          </span>
                          <span className="text-xs text-slate-400">{task.tat_days}d TAT</span>
                          {editingTask !== task.id && (
                            <button onClick={() => { setEditingTask(task.id); setEditValue(task.name) }}
                              className="p-0.5 text-slate-300 hover:text-slate-500"><Edit2 size={11}/></button>
                          )}
                        </div>

                        {taskOpen && (task.subtasks ?? []).length > 0 && (
                          <div className="ml-20 mr-5 mb-3 space-y-1">
                            {task.subtasks.map((sub: any) => (
                              <div key={sub.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"/>
                                <span className="text-slate-600 flex-1">{sub.name}</span>
                                <span className="text-slate-400">{sub.owner} · {sub.tat_days}d</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="px-5 py-3">
                    <button onClick={() => addTask(phase.id)}
                      className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 ml-14">
                      <Plus size={12}/> Add task
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        <button onClick={addPhase}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 bg-white border border-dashed border-indigo-300 rounded-xl px-5 py-3 w-full justify-center hover:bg-indigo-50 transition-colors">
          <Plus size={14}/> Add Phase
        </button>
      </div>
    </div>
  )
}
