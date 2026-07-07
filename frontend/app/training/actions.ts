'use server'

// WS-3: persist the signed-in consultant's training state. Two self-only
// writes, both direct to PostgREST with the per-user token (RLS ts_self /
// tp_self: employee_id must be the signed-in employee — contract DAT-TRAIN-SELF,
// cell G1):
//  • training_status  — product, ILT date, and the three billable flags that
//    drive V-BILL-STAGE (getting_started_done / ilt_done / certified).
//  • training_progress — one row per completed learning module, keyed
//    `${product}:${pathId}:${moduleSlug}`.
// The employee_id always comes from the session, never the caller.
import { auth } from '@/auth'

export interface TrainingWriteResult {
  ok: boolean
  error?: string
}

/** Full self-row state for the upsert (product is not null with no default). */
export interface TrainingStatusInput {
  product: string
  ilt_date: string | null
  getting_started_done: boolean
  ilt_done: boolean
  certified: boolean
}

// Mirrors the product_id enum (001_schema.sql). Postgres re-validates anyway;
// this just turns a bad value into a clean error instead of a PostgREST 400.
const PRODUCT_IDS = new Set([
  'intacct',
  'x3',
  '300people',
  '200evo',
  'pastel',
  'payroll',
])

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// `${product}:${pathId}:${moduleSlug}` — lowercase alnum segments with hyphens.
const MODULE_KEY_RE = /^[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/

interface Ctx {
  base: string
  token: string
  employeeId: string
}

async function ctx(): Promise<Ctx | { error: string }> {
  const session = await auth()
  if (!session?.employee || !session?.pulseToken) return { error: 'Not signed in' }
  const base = process.env.PULSE_POSTGREST_URL
  if (!base) return { error: 'Data API not configured' }
  return { base, token: session.pulseToken, employeeId: session.employee.id }
}

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  }
}

/**
 * Upsert the signed-in employee's training_status row (the whole self-row
 * state — first write creates it, later writes replace it). The acceptance
 * test that matters: set the ILT date, reload, still there.
 */
export async function saveTrainingStatus(
  input: TrainingStatusInput,
): Promise<TrainingWriteResult> {
  const c = await ctx()
  if ('error' in c) return { ok: false, error: c.error }
  if (!PRODUCT_IDS.has(input.product)) {
    return { ok: false, error: 'Unknown product' }
  }
  if (input.ilt_date != null && !ISO_DATE_RE.test(input.ilt_date)) {
    return { ok: false, error: 'Invalid ILT date' }
  }
  try {
    const res = await fetch(`${c.base}/training_status?on_conflict=employee_id`, {
      method: 'POST',
      headers: headers(c.token),
      cache: 'no-store',
      body: JSON.stringify([
        {
          employee_id: c.employeeId,
          product: input.product,
          ilt_date: input.ilt_date,
          getting_started_done: Boolean(input.getting_started_done),
          ilt_done: Boolean(input.ilt_done),
          certified: Boolean(input.certified),
        },
      ]),
    })
    return res.ok
      ? { ok: true }
      : { ok: false, error: 'Could not save your training status' }
  } catch {
    return { ok: false, error: 'Could not reach the data service' }
  }
}

/** Upsert one learning-module completion for the signed-in employee. */
export async function saveTrainingModule(
  moduleKey: string,
  done: boolean,
): Promise<TrainingWriteResult> {
  const c = await ctx()
  if ('error' in c) return { ok: false, error: c.error }
  if (!MODULE_KEY_RE.test(moduleKey) || moduleKey.length > 200) {
    return { ok: false, error: 'Unknown module' }
  }
  try {
    const res = await fetch(
      `${c.base}/training_progress?on_conflict=employee_id,module_key`,
      {
        method: 'POST',
        headers: headers(c.token),
        cache: 'no-store',
        body: JSON.stringify([
          {
            employee_id: c.employeeId,
            module_key: moduleKey,
            done: Boolean(done),
          },
        ]),
      },
    )
    return res.ok
      ? { ok: true }
      : { ok: false, error: 'Could not save your progress' }
  } catch {
    return { ok: false, error: 'Could not reach the data service' }
  }
}
