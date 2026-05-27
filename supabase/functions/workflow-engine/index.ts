// Workflow Execution Engine
// Processes pending/paused workflow executions from the queue
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

interface WorkflowExecution {
  id: string
  workflow_id: string
  application_id: string
  trigger_type: string
  trigger_data: Record<string, unknown>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  current_action_index: number
  resume_at: string | null
  error_message: string | null
}

interface WorkflowAction {
  id: string
  workflow_id: string
  type: 'send_email' | 'delay' | 'move_stage'
  config: Record<string, unknown>
  order_index: number
}

async function processExecution(execution: WorkflowExecution): Promise<void> {
  console.log(`Processing execution ${execution.id}`)

  // Mark as running
  await supabase
    .from('workflow_executions')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', execution.id)

  // Load all actions for this workflow
  const { data: actions, error: actionsError } = await supabase
    .from('workflow_actions')
    .select('*')
    .eq('workflow_id', execution.workflow_id)
    .order('order_index', { ascending: true })

  if (actionsError || !actions) {
    await failExecution(execution.id, `Failed to load actions: ${actionsError?.message}`)
    return
  }

  // Process actions starting from current_action_index
  let actionIndex = execution.current_action_index

  while (actionIndex < actions.length) {
    const action = actions[actionIndex] as WorkflowAction
    console.log(`  Action [${actionIndex}]: ${action.type}`)

    try {
      const result = await executeAction(action, execution)

      if (result.paused) {
        // Delay action — schedule resume
        await supabase
          .from('workflow_executions')
          .update({
            status: 'paused',
            current_action_index: actionIndex + 1,
            resume_at: result.resumeAt,
          })
          .eq('id', execution.id)
        return
      }

      actionIndex++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await failExecution(execution.id, `Action ${action.type} failed: ${msg}`)
      return
    }
  }

  // All actions done — mark complete
  await supabase
    .from('workflow_executions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', execution.id)

  console.log(`Execution ${execution.id} completed`)
}

interface ActionResult {
  paused: boolean
  resumeAt?: string
}

async function executeAction(
  action: WorkflowAction,
  execution: WorkflowExecution
): Promise<ActionResult> {
  switch (action.type) {
    case 'send_email': {
      const cfg = action.config as { to?: string; subject?: string; body?: string }
      console.log(`    → Send email to: ${cfg.to || '[candidate email]'} | Subject: ${cfg.subject}`)
      // In production: call Resend/SendGrid API here
      // For now: log and simulate success
      await logActionResult(execution.id, action.id, 'send_email', {
        to: cfg.to,
        subject: cfg.subject,
        simulated: true,
      })
      return { paused: false }
    }

    case 'move_stage': {
      const cfg = action.config as { stage_id?: string; stage_name?: string }
      console.log(`    → Move to stage: ${cfg.stage_name || cfg.stage_id}`)
      
      if (cfg.stage_id) {
        await supabase
          .from('applications')
          .update({ current_stage_id: cfg.stage_id, updated_at: new Date().toISOString() })
          .eq('id', execution.application_id)
      }

      await logActionResult(execution.id, action.id, 'move_stage', cfg)
      return { paused: false }
    }

    case 'delay': {
      const cfg = action.config as { duration?: number; unit?: 'minutes' | 'hours' | 'days' }
      const duration = cfg.duration || 1
      const unit = cfg.unit || 'hours'

      const multipliers: Record<string, number> = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
      }
      const ms = duration * (multipliers[unit] || multipliers.hours)
      const resumeAt = new Date(Date.now() + ms).toISOString()

      console.log(`    → Delay ${duration} ${unit} — resume at ${resumeAt}`)
      return { paused: true, resumeAt }
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

async function logActionResult(
  executionId: string,
  actionId: string,
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  // Could write to a workflow_execution_logs table if needed
  console.log(`    ✓ ${type} logged`, JSON.stringify(data))
}

async function failExecution(id: string, message: string): Promise<void> {
  console.error(`Execution ${id} FAILED: ${message}`)
  await supabase
    .from('workflow_executions')
    .update({ status: 'failed', error_message: message })
    .eq('id', id)
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const now = new Date().toISOString()

    // Fetch due executions: pending OR paused with resume_at in the past
    const { data: executions, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .or(`status.eq.pending,and(status.eq.paused,resume_at.lte.${now})`)
      .limit(10)

    if (error) throw error

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const execution of (executions || [])) {
      try {
        await processExecution(execution as WorkflowExecution)
        results.processed++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        results.errors.push(`${execution.id}: ${msg}`)
        results.skipped++
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
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
