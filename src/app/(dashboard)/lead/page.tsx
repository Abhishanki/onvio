import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LeadDashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: projects } = await supabase.from('projects').select('*, om:profiles!projects_om_id_fkey(id,full_name)').eq('lead_id', user.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-500 text-sm mt-0.5">{projects?.length ?? 0} active projects</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Project</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">Client</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">OM</th>
            <th className="text-left px-4 py-3 text-slate-500 font-medium">RAG</th>
          </tr></thead>
          <tbody>
            {(projects ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.project_code}</td>
                <td className="px-4 py-3 text-slate-600">{p.client_company}</td>
                <td className="px-4 py-3 text-slate-600">{p.om?.full_name}</td>
                <td className="px-4 py-3">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${p.rag === 'green' ? 'bg-emerald-500' : p.rag === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
