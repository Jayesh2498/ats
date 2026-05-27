// Workflow Trigger — enqueues executions when events fire
// Call this when: application created, stage changed
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface TriggerPayload {
  trigger_type: 'stage_change' | 'application_created'
  application_id: string
  workspace_id?: string
  data: {
    job_id?: string
    from_stage_id?: string
    to_stage_id?: string
    from_stage_name?: string
    to_stage_name?: string
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: TriggerPayload = await req.json()
    const { trigger_type, application_id, workspace_id = 'default', data } = payload

    console.log(`Trigger fired: ${trigger_type} for application ${application_id}`)

    // Find matching active workflows
    const { data: workflows, error: wfError } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_type', trigger_type)
      .eq('is_active', true)
      .eq('workspace_id', workspace_id)

    if (wfError) throw wfError

    const enqueued: string[] = []

    for (const workflow of (workflows || [])) {
      // Check trigger_config filters
      const cfg = workflow.trigger_config || {}

      // For stage_change: optionally filter by specific stage
      if (trigger_type === 'stage_change' && cfg.stage_id) {
        if (cfg.stage_id !== data.to_stage_id) {
          console.log(`  Skipping workflow ${workflow.id} — stage filter mismatch`)
          continue
        }
      }

      // For stage_change: optionally filter by job
      if (cfg.job_id && cfg.job_id !== data.job_id) {
        console.log(`  Skipping workflow ${workflow.id} — job filter mismatch`)
        continue
      }

      // Enqueue execution
      const { data: execution, error: execError } = await supabase
        .from('workflow_executions')
        .insert({
          workflow_id: workflow.id,
          application_id,
          trigger_type,
          trigger_data: data,
          status: 'pending',
          current_action_index: 0,
        })
        .select()
        .single()

      if (execError) {
        console.error(`  Failed to enqueue workflow ${workflow.id}:`, execError)
        continue
      }

      enqueued.push(execution.id)
      console.log(`  Enqueued execution ${execution.id} for workflow ${workflow.name}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        trigger_type,
        application_id,
        workflows_matched: workflows?.length || 0,
        executions_enqueued: enqueued.length,
        execution_ids: enqueued,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
