// ============================================================
// Workflow Automation Types
// ============================================================

export type TriggerType = 'stage_change' | 'application_created'
export type ActionType = 'send_email' | 'delay' | 'move_stage'
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused'
export type DelayUnit = 'minutes' | 'hours' | 'days'

// ── Trigger configs ──────────────────────────────────────────

export interface StageChangeTriggerConfig {
  stage_id?: string     // optional: only fire for this stage
  stage_name?: string   // display only
  job_id?: string       // optional: only for this job
}

export interface ApplicationCreatedTriggerConfig {
  job_id?: string       // optional: only for this job
}

export type TriggerConfig = StageChangeTriggerConfig | ApplicationCreatedTriggerConfig

// ── Action configs ───────────────────────────────────────────

export interface SendEmailActionConfig {
  to?: string           // defaults to candidate email
  subject: string
  body: string
}

export interface DelayActionConfig {
  duration: number
  unit: DelayUnit
}

export interface MoveStageActionConfig {
  stage_id: string
  stage_name: string
}

export type ActionConfig = SendEmailActionConfig | DelayActionConfig | MoveStageActionConfig

// ── DB Row types ─────────────────────────────────────────────

export interface Workflow {
  id: string
  name: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: TriggerConfig
  is_active: boolean
  workspace_id: string
  created_at: string
  updated_at: string
  // joined
  actions?: WorkflowAction[]
  execution_count?: number
}

export interface WorkflowAction {
  id: string
  workflow_id: string
  type: ActionType
  config: ActionConfig
  order_index: number
  created_at: string
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  application_id: string
  trigger_type: TriggerType
  trigger_data: Record<string, unknown>
  status: ExecutionStatus
  current_action_index: number
  resume_at: string | null
  error_message: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  // joined
  workflow?: Pick<Workflow, 'id' | 'name' | 'trigger_type'>
}

// ── Input types ──────────────────────────────────────────────

export interface CreateWorkflowInput {
  name: string
  description?: string
  trigger_type: TriggerType
  trigger_config: TriggerConfig
  actions: CreateWorkflowActionInput[]
}

export interface CreateWorkflowActionInput {
  type: ActionType
  config: ActionConfig
  order_index: number
}

// ── UI builder state ─────────────────────────────────────────

export interface BuilderAction {
  id: string   // temp local id
  type: ActionType
  config: Partial<ActionConfig>
  order_index: number
}

export interface BuilderState {
  name: string
  description: string
  trigger_type: TriggerType | ''
  trigger_config: Partial<TriggerConfig>
  actions: BuilderAction[]
}

// ── Display helpers ──────────────────────────────────────────

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  stage_change: 'Stage Changed',
  application_created: 'Application Created',
}

export const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  stage_change: 'Fires when a candidate moves to a new pipeline stage',
  application_created: 'Fires when a new application is submitted',
}

export const ACTION_LABELS: Record<ActionType, string> = {
  send_email: 'Send Email',
  delay: 'Wait / Delay',
  move_stage: 'Move Stage',
}

export const ACTION_DESCRIPTIONS: Record<ActionType, string> = {
  send_email: 'Send an email to the candidate',
  delay: 'Wait before running the next action',
  move_stage: 'Move the candidate to a different stage',
}

export const ACTION_ICONS: Record<ActionType, string> = {
  send_email: 'mail',
  delay: 'clock',
  move_stage: 'arrow-right',
}

export const STATUS_COLORS: Record<ExecutionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  running: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  paused: 'bg-purple-100 text-purple-700 border-purple-200',
}
