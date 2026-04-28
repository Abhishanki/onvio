'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeProject(projectId: string, onUpdate: () => void) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_subtasks',
        filter: `project_id=eq.${projectId}`,
      }, onUpdate)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_tasks',
        filter: `project_id=eq.${projectId}`,
      }, onUpdate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [projectId, onUpdate])
}
