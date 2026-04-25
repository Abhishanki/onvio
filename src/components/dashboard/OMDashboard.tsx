'use client'

import Link from 'next/link'
import { differenceInDays, format } from 'date-fns'
import type { Project, Profile } from '@/lib/types'
import { ArrowRight, AlertTriangle } from 'lucide-react'

interface Props { profile: Profile; projects: Project[] }

export function OMDashboard({ profile, projects }: Props) {
  const active = projects.filter(p => ['active', 'live', 'hypercare'].includes(p.status))
  const atRisk = projects.filter(p => p.rag === 'red' || p.rag === 'amber')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good morning, {profile.full_name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 text-sm mt-0.5">Here is what needs your attention today</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Projects', value: active.length },
          { label: 'At Risk', value: atRisk.length },
          { label: 'Total', value: projects.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {atRisk.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Projects needing attention</span>
          </div>
          <div className="space-y-2">
            {atRisk.map(p => (
              <Link key={p.id} href={`/projects/${p.id}/tracker`}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-100 hover:border-amber-300 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{p.project_code}</p>
                  <p className="text-xs text-slate-500">{p.client_company}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.rag === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">My Projects</h2>
          <Link href="/projects/new" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ New</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {projects.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">No projects yet</div>
          )}
          {projects.map(p => {
            const days = p.go_live_target ? differenceInDays(new Date(p.go_live_target), new Date()) : null
            return (
              <Link key={p.id} href={`/projects/${p.id}/tracker`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.rag === 'green' ? 'bg-emerald-500' : p.rag === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{p.project_code}</p>
                  <p className="text-xs text-slate-400">{p.client_company} · {p.solution_type}</p>
                </div>
                {days !== null && (
                  <p className={`text-sm font-medium ${days < 0 ? 'text-red-600' : days < 14 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  p.status === 'active' ? 'bg-blue-50 text-blue-600' :
                  p.status === 'live' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-slate-50 text-slate-500'
                }`}>{p.status}</span>
                <ArrowRight size={14} className="text-slate-300" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
