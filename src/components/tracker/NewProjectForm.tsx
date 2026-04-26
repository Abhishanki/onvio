'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  templates: any[]
  leads: any[]
  oms: any[]
  currentProfile: any
}

const STEPS = ['Client Details', 'Team Assignment', 'Client Contacts', 'Review']

export function NewProjectForm({ templates, leads, oms, currentProfile }: Props) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    client_name: '',
    client_company: '',
    solution_type: '',
    template_id: '',
    go_live_target: '',
    kickoff_date: '',
    lead_id: '',
    om_id: '',
    client_contact_l1_name: '',
    client_contact_l1_email: '',
    client_contact_l1_phone: '',
    client_contact_l2_name: '',
    client_contact_l2_email: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error?.message ?? 'Failed to create project'); return }
      toast.success(`Project ${data.project_code} created!`)
      router.push(`/projects/${data.id}/tracker`)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
  const labelCls = "block text-sm font-medium text-slate-700 mb-1.5"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
        <p className="text-slate-500 text-sm mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < step ? 'bg-indigo-600 text-white' : i === step ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300' : 'bg-slate-100 text-slate-400'
            }`}>{i + 1}</div>
            {i < STEPS.length - 1 && <div className={`h-px w-8 ${i < step ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        {step === 0 && (
          <>
            <div>
              <label className={labelCls}>Client Name *</label>
              <input className={inputCls} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelCls}>Company Name *</label>
              <input className={inputCls} value={form.client_company} onChange={e => set('client_company', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className={labelCls}>Solution Type *</label>
              <select className={inputCls} value={form.template_id} onChange={e => {
                const t = templates.find(t => t.id === e.target.value)
                set('template_id', e.target.value)
                if (t) set('solution_type', t.name)
              }}>
                <option value="">Select solution...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kickoff Date</label>
                <input type="date" className={inputCls} value={form.kickoff_date} onChange={e => set('kickoff_date', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Go-Live Target</label>
                <input type="date" className={inputCls} value={form.go_live_target} onChange={e => set('go_live_target', e.target.value)} />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <label className={labelCls}>Team Lead *</label>
              <select className={inputCls} value={form.lead_id} onChange={e => set('lead_id', e.target.value)}>
                <option value="">Select lead...</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Onboarding Manager *</label>
              <select className={inputCls} value={form.om_id} onChange={e => set('om_id', e.target.value)}>
                <option value="">Select OM...</option>
                {oms.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Project Notes</label>
              <textarea rows={3} className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special requirements or context..." />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-sm font-medium text-slate-700 mb-3">Primary Contact (L1)</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Name</label>
                <input className={inputCls} value={form.client_contact_l1_name} onChange={e => set('client_contact_l1_name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" className={inputCls} value={form.client_contact_l1_email} onChange={e => set('client_contact_l1_email', e.target.value)} placeholder="jane@client.com" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.client_contact_l1_phone} onChange={e => set('client_contact_l1_phone', e.target.value)} placeholder="+91 9XXXXXXXXX" />
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-700 mb-3">Secondary Contact (L2) — Optional</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Name</label>
                  <input className={inputCls} value={form.client_contact_l2_name} onChange={e => set('client_contact_l2_name', e.target.value)} placeholder="Bob Jones" />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" className={inputCls} value={form.client_contact_l2_email} onChange={e => set('client_contact_l2_email', e.target.value)} placeholder="bob@client.com" />
                </div>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 mb-4">Review before creating</h3>
            {[
              ['Client', `${form.client_name} · ${form.client_company}`],
              ['Solution', templates.find(t => t.id === form.template_id)?.name ?? '—'],
              ['Go-Live Target', form.go_live_target || '—'],
              ['Lead', leads.find(l => l.id === form.lead_id)?.full_name ?? '—'],
              ['OM', oms.find(o => o.id === form.om_id)?.full_name ?? '—'],
              ['Primary Contact', form.client_contact_l1_email || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500">{k}</span>
                <span className="text-sm font-medium text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && (!form.client_name || !form.client_company || !form.template_id)) ||
              (step === 1 && (!form.lead_id || !form.om_id))
            }
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        )}
      </div>
    </div>
  )
}
