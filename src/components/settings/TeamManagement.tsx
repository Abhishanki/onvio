'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { UserPlus, Mail, User, Shield } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

interface Props { members: any[]; leads: any[] }

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-purple-50 text-purple-700',
  lead: 'bg-blue-50 text-blue-700',
  om: 'bg-indigo-50 text-indigo-600',
}

export function TeamManagement({ members, leads }: Props) {
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'om', lead_id: '', designation: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/auth/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteForm)
    })
    setLoading(false)
    if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Invite failed'); return }
    toast.success(`Invite sent to ${inviteForm.email}`)
    setShowInvite(false)
    setInviteForm({ email: '', full_name: '', role: 'om', lead_id: '', designation: '' })
  }

  const toggleActive = async (memberId: string, current: boolean) => {
    await supabase.from('profiles').update({ is_active: !current }).eq('id', memberId)
    toast.success(`Member ${!current ? 'activated' : 'deactivated'}`)
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{members.length} members</p>
        </div>
        <button onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <UserPlus size={14}/> Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Invite Team Member</h2>
          <form onSubmit={handleInvite} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input value={inviteForm.full_name} onChange={e => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                required className={inputCls} placeholder="Priya Sharma"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                required className={inputCls} placeholder="priya@unicommerce.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role *</label>
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                <option value="om">Onboarding Manager</option>
                <option value="lead">Team Lead</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            {inviteForm.role === 'om' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reporting Lead</label>
                <select value={inviteForm.lead_id} onChange={e => setInviteForm(f => ({ ...f, lead_id: e.target.value }))} className={inputCls}>
                  <option value="">Select lead...</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
              <input value={inviteForm.designation} onChange={e => setInviteForm(f => ({ ...f, designation: e.target.value }))}
                className={inputCls} placeholder="e.g. Senior OM"/>
            </div>
            <div className="col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowInvite(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-60">
                {loading ? 'Sending…' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Member</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Role</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Reports To</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
          </tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {m.photo_url
                      ? <img src={m.photo_url} className="w-8 h-8 rounded-full object-cover"/>
                      : <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center">
                          {getInitials(m.full_name)}
                        </div>}
                    <div>
                      <p className="font-medium text-slate-900">{m.full_name}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cn('text-xs px-2 py-1 rounded-full font-medium capitalize', ROLE_COLORS[m.role] ?? 'bg-slate-100 text-slate-600')}>
                    {m.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{m.lead?.full_name ?? '—'}</td>
                <td className="px-5 py-3">
                  <button onClick={() => toggleActive(m.id, m.is_active)}
                    className={cn('text-xs px-2 py-0.5 rounded-full', m.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
