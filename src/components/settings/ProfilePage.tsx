'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Upload, User } from 'lucide-react'
import { getInitials } from '@/lib/utils'

interface Props { profile: any }

export function ProfilePage({ profile }: Props) {
  const [form, setForm] = useState({ full_name: profile.full_name, designation: profile.designation ?? '', phone: profile.phone ?? '' })
  const [photoUrl, setPhotoUrl] = useState(profile.photo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('profiles').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(path)
    await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', profile.id)
    setPhotoUrl(publicUrl)
    setUploading(false)
    toast.success('Photo updated!')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id)
    setSaving(false)
    if (error) { toast.error('Save failed'); return }
    toast.success('Profile updated!')
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your photo appears in client portals</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {/* Photo */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          <div className="relative">
            {photoUrl
              ? <img src={photoUrl} alt={form.full_name} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"/>
              : <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-slate-200">
                  {getInitials(form.full_name)}
                </div>}
          </div>
          <div>
            <p className="font-medium text-slate-900 mb-1">{form.full_name}</p>
            <p className="text-sm text-slate-500 capitalize mb-3">{profile.role} · {profile.organisation?.name}</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 text-slate-600 disabled:opacity-60">
              <Upload size={13}/>{uploading ? 'Uploading…' : 'Change Photo'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
            <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
              className={inputCls} placeholder="e.g. Senior Onboarding Manager"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className={inputCls} placeholder="+91 9XXXXXXXXX"/>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
