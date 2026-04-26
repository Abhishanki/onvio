import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate, daysUntil, ragDotClass, cn } from '@/lib/utils'

export default async function ProjectsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  let query = supabase
    .from('projects')
    .select('*, om:profiles!projects_om_id_fkey(id,full_name), lead:profiles!projects_lead_id_fkey(id,full_name)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (profile.role === 'lead') query = query.eq('lead_id', user.id)
  if (profile.role === 'om') query = query.eq('om_id', user.id)

  const { data: projects } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects?.length ?? 0} projects</p>
        </div>
        {['manager', 'lead'].includes(profile.role) && (
          <Link href="/projects/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + New Project
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Project</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Client</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Solution</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">OM</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Go-Live</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">RAG</th>
            <th className="text-left px-5 py-3 text-slate-500 font-medium">Status</th>
            <th className="px-5 py-3"/>
          </tr></thead>
          <tbody>
            {(!projects || projects.length === 0) && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">
                No projects yet. <Link href="/projects/new" className="text-indigo-600 hover:underline">Create one →</Link>
              </td></tr>
            )}
            {(projects ?? []).map((p: any) => {
              const days = daysUntil(p.go_live_target)
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{p.project_code}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{p.client_company}</td>
                  <td className="px-5 py-3"><span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.solution_type}</span></td>
                  <td className="px-5 py-3 text-slate-600">{p.om?.full_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    {days !== null
                      ? <span className={cn('font-medium', days < 0 ? 'text-red-600' : days < 7 ? 'text-amber-600' : 'text-slate-600')}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}
                        </span>
                      : <span className="text-slate-400">{formatDate(p.go_live_target) ?? '—'}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('w-2 h-2 rounded-full', ragDotClass(p.rag))}/>
                      <span className="text-slate-600 capitalize text-xs">{p.rag}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize',
                      p.status === 'active' ? 'bg-blue-50 text-blue-700' :
                      p.status === 'live' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'completed' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-500')}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/projects/${p.id}/tracker`} className="text-indigo-500 hover:text-indigo-700 text-xs font-medium">
                      Open →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
