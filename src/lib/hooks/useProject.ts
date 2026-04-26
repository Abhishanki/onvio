'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useProject(projectId: string) {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProject = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        om:profiles!projects_om_id_fkey(id,full_name,email,photo_url,designation),
        lead:profiles!projects_lead_id_fkey(id,full_name,email,photo_url,designation),
        manager:profiles!projects_manager_id_fkey(id,full_name,email,photo_url,designation),
        organisation:organisations(name,logo_url,primary_color,website_url),
        phases:project_phases(
          *,
          tasks:project_tasks(*, subtasks:project_subtasks(*))
        )
      `)
      .eq('id', projectId)
      .single()
    setProject(data)
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchProject() }, [fetchProject])

  return { project, loading, refetch: fetchProject }
}
