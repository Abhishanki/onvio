'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props { org: any }

export function BrandingSettings({ org }: Props) {
  const [form, setForm] = useState({
    name: org?.name ?? '',
    website_url: org?.website_url ?? '',
    primary_color: org?.primary_color ?? '#6366f1',
    accent_color: org?.accent_color ?? '#4f46e5',
    reminder_default_hours: org?.reminder_default_hours ?? 48,
    escalation_l1_hours: org?.escalation_l1_hours ?? 48,
    escalation_l2_hours: org?.escalation_l2_hours ?? 96,
    escalation_l3_hours: org?.escalation_l3_hours ?? 144,
    hypercare_weeks: org?.hypercare_weeks ?? 4,
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('organisations').update(form).eq('id', org.id)
    setSaving(false)
    if (error) { toast.error('Save failed'); return }
    toast.success('Settings saved!')
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5"

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Org Settings & Branding</h1>
        <p className="text-slate-500 text-sm mt-0.5">Controls how Onvio looks for your clients</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Organisation</h2>
          <div>
            <label className={labelCls}>Organisation Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls}/>
          </div>
          <div>
            <label className={labelCls}>Website URL</label>
            <input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
              className={inputCls} placeholder="https://unicommerce.com"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Primary Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-1"/>
                <input value={form.primary_color} onChange={e => setForm(f => ({ ...f, primary_color: e.target.value }))}
                  className={inputCls} placeholder="#6366f1"/>
              </div>
            </div>
            <div>
              <label className={labelCls}>Accent Color</label>
              <div className="flex gap-2">
                <input type="color" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-1"/>
                <input value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))}
                  className={inputCls} placeholder="#4f46e5"/>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className={labelCls}>Portal Preview</label>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4" style={{ background: form.primary_color }}>
                <p className="text-white font-semibold text-sm">{form.name || 'Your Company'}</p>
                <p className="text-white/70 text-xs mt-0.5">Implementation Portal</p>
              </div>
              <div className="p-4 bg-white">
                <div className="h-2 rounded-full mb-2" style={{ background: form.primary_color, width: '60%' }}/>
                <p className="text-xs text-slate-400">Progress bar preview</p>
                <button className="mt-3 text-xs px-3 py-1.5 rounded-lg text-white" style={{ background: form.primary_color }}>
                  View Portal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="font-semibold text-slate-900">Escalation Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'reminder_default_hours', label: 'Default Reminder (hours)' },
              { key: 'escalation_l1_hours', label: 'L1 Escalation (hours)' },
              { key: 'escalation_l2_hours', label: 'L2 Escalation (hours)' },
              { key: 'escalation_l3_hours', label: 'L3 Escalation (hours)' },
              { key: 'hypercare_weeks', label: 'Hypercare Duration (weeks)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="number" value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                  className={inputCls} min={1}/>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm disabled:opacity-60 transition-colors">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
