import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const CreateProjectSchema = z.object({
  client_name: z.string().min(1),
  client_company: z.string().min(1),
  solution_type: z.string().min(1),
  template_id: z.string().uuid().optional(),
  lead_id: z.string().uuid(),
  om_id: z.string().uuid(),
  client_contact_l1_name: z.string().optional(),
  client_contact_l1_email: z.string().email().optional(),
  client_contact_l1_phone: z.string().optional(),
  client_contact_l2_name: z.string().optional(),
  client_contact_l2_email: z.string().email().optional(),
  go_live_target: z.string().optional(),
  kickoff_date: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  let query = supabase
    .from('projects')
    .select(`*, manager:profiles!projects_manager_id_fkey(id,full_name,email,photo_url), lead:profiles!projects_lead_id_fkey(id,full_name,email,photo_url), om:profiles!projects_om_id_fkey(id,full_name,email,photo_url)`)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (profile.role === 'lead') query = query.eq('lead_id', user.id)
  if (profile.role === 'om') query = query.eq('om_id', user.id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!['manager', 'lead'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data

  // Generate project code
  const { data: codeResult } = await adminSupabase
    .rpc('generate_project_code', { org_slug: profile.organisation?.slug ?? 'uc' })

  const project_code = codeResult ?? `PROJ-${Date.now()}`

  // Create project
  const { data: project, error } = await adminSupabase
    .from('projects')
    .insert({
      org_id: profile.org_id,
      project_code,
      manager_id: profile.role === 'manager' ? user.id : profile.lead_id,
      ...data,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Clone template phases/tasks if template_id provided
  if (data.template_id) {
    await cloneTemplate(adminSupabase, project.id, data.template_id)
  }

  // Log activity
  await adminSupabase.from('activity_log').insert({
    project_id: project.id,
    actor_id: user.id,
    actor_name: profile.full_name,
    action: 'Project created',
    entity_type: 'project',
    entity_id: project.id,
    entity_name: project_code,
  })

  return NextResponse.json(project, { status: 201 })
}

async function cloneTemplate(supabase: any, projectId: string, templateId: string) {
  const { data: phases } = await supabase
    .from('template_phases')
    .select('*, tasks:template_tasks(*, subtasks:template_subtasks(*))')
    .eq('template_id', templateId)
    .order('sort_order')

  for (const phase of phases ?? []) {
    const { data: newPhase } = await supabase
      .from('project_phases')
      .insert({
        project_id: projectId,
        template_phase_id: phase.id,
        name: phase.name,
        description: phase.description,
        sort_order: phase.sort_order,
        is_active: phase.sort_order === 0,
      })
      .select().single()

    for (const task of phase.tasks ?? []) {
      const { data: newTask } = await supabase
        .from('project_tasks')
        .insert({
          project_id: projectId,
          phase_id: newPhase.id,
          template_task_id: task.id,
          name: task.name,
          description: task.description,
          owner: task.owner,
          tat_days: task.tat_days,
          support_doc_url: task.support_doc_url,
          support_doc_title: task.support_doc_title,
          sort_order: task.sort_order,
        })
        .select().single()

      for (const subtask of task.subtasks ?? []) {
        await supabase.from('project_subtasks').insert({
          project_id: projectId,
          task_id: newTask.id,
          template_subtask_id: subtask.id,
          name: subtask.name,
          description: subtask.description,
          owner: subtask.owner,
          tat_days: subtask.tat_days,
          support_doc_url: subtask.support_doc_url,
          support_doc_title: subtask.support_doc_title,
          sort_order: subtask.sort_order,
        })
      }
    }
  }
}
