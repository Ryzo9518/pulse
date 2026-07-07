'use client'

// Training data controllers (WS-3). Behind NEXT_PUBLIC_PULSE_DATA=live the
// employee controller reads the products catalog + the signed-in consultant's
// training_status / training_progress rows via the proxy (RLS-scoped) and
// writes back through the self-only server actions; the team controller
// composes the billable roll-up from the rows RLS lets the caller see (own
// team for managers, everyone for admin). Otherwise both delegate to the mock
// seam, preserving current behaviour. Same shapes the Training screen already
// consumes, so the rendering is unchanged.
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  saveTrainingModule,
  saveTrainingStatus,
  type TrainingStatusInput,
} from '@/app/training/actions'
import {
  getBillableSummary,
  getEmployeeMilestones,
  getEmployeeOverallProgress,
  getTrainingEnrolment,
  listProducts,
  setTrainingIltDate,
  setTrainingMilestone,
  setTrainingModule,
  setTrainingProduct,
} from '@/lib/mock'
import {
  billableStage,
  computeMilestones,
  computeOverallProgress,
  pathsFor,
  productById,
} from '@/lib/mock/training'
import {
  composeBillableSummary,
  toEnrolment,
  type ProgressEntry,
  type RosterEmployee,
} from '@/lib/data/training-live'
import type {
  BillableMilestone,
  BillableStage,
  BillableSummaryRow,
  Employee,
  MilestoneKey,
  Product,
  ProductId,
  TrainingEnrolment,
  TrainingPath,
  TrainingStatusRow,
} from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-store' })
  if (!res.ok) throw new Error(`${path.split('?')[0]} (${res.status})`)
  return res.json() as Promise<T>
}

// ── Employee controller ───────────────────────────────────────────────────────

export type MilestoneFlag = 'getting_started_done' | 'ilt_done' | 'certified'

export interface TrainingController {
  /** The Sage product catalog (live: products table; mock: seeded list). */
  products: Product[]
  /** The consultant's enrolment view-model (undefined until first write). */
  enrolment: TrainingEnrolment | undefined
  productId: ProductId
  product: Product
  /** Learning paths for the selected product (client catalog content). */
  paths: TrainingPath[]
  milestones: BillableMilestone[]
  overall: { done: number; total: number; percent: number }
  stage: BillableStage
  loading: boolean
  error: string | null
  /** True while a write is in flight (MSG-PENDING-SAVING). */
  saving: boolean
  /** Each mutation resolves true on success; false = state unchanged (MSG-ERR-GENERIC). */
  setProduct: (productId: ProductId) => Promise<boolean>
  setIltDate: (iltDate: string | null) => Promise<boolean>
  setFlag: (key: MilestoneFlag, value: boolean) => Promise<boolean>
  setModule: (moduleKey: string, value: boolean) => Promise<boolean>
}

interface LiveTrainingState {
  products: Product[]
  status: TrainingStatusRow | null
  progress: ProgressEntry[]
  loading: boolean
  error: string | null
}

/** The full self-row payload a training_status upsert needs (product is not null). */
function statusInput(
  status: TrainingStatusRow | null,
  patch: Partial<TrainingStatusInput> = {},
): TrainingStatusInput {
  return {
    product: status?.product ?? 'intacct',
    ilt_date: status?.ilt_date ?? null,
    getting_started_done: status?.getting_started_done ?? false,
    ilt_done: status?.ilt_done ?? false,
    certified: status?.certified ?? false,
    ...patch,
  }
}

export function useTraining(employee: Employee | null): TrainingController {
  const employeeId = employee?.id
  const [tick, setTick] = useState(0)
  const [saving, setSaving] = useState(0)
  const [live, setLive] = useState<LiveTrainingState>(() => ({
    products: [],
    status: null,
    progress: [],
    loading: LIVE,
    error: null,
  }))
  // The latest status row, readable inside async mutations without re-binding.
  const statusRef = useRef<TrainingStatusRow | null>(null)
  statusRef.current = live.status

  useEffect(() => {
    if (!LIVE || !employeeId) return
    let active = true
    setLive((s) => ({ ...s, loading: true, error: null }))
    const id = encodeURIComponent(employeeId)
    Promise.all([
      getJson<Product[]>('/api/rest/products?order=id'),
      getJson<TrainingStatusRow[]>(
        `/api/rest/training_status?employee_id=eq.${id}&limit=1`,
      ),
      getJson<ProgressEntry[]>(
        `/api/rest/training_progress?employee_id=eq.${id}&select=module_key,done`,
      ),
    ])
      .then(([products, statusRows, progress]) => {
        if (!active) return
        setLive({
          products,
          status: statusRows[0] ?? null,
          progress,
          loading: false,
          error: null,
        })
      })
      .catch((e: unknown) => {
        if (active) {
          setLive((s) => ({
            ...s,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load',
          }))
        }
      })
    return () => {
      active = false
    }
  }, [employeeId, tick])

  /** Run one write with the pending counter held (MSG-PENDING-SAVING). */
  const track = useCallback(async (write: () => Promise<boolean>) => {
    setSaving((n) => n + 1)
    try {
      return await write()
    } finally {
      setSaving((n) => n - 1)
    }
  }, [])

  /** Upsert the self status row; local state only changes when the DB write lands. */
  const writeStatus = useCallback(
    (patch: Partial<TrainingStatusInput>) =>
      track(async () => {
        if (!employeeId) return false
        const input = statusInput(statusRef.current, patch)
        const result = await saveTrainingStatus(input)
        if (!result.ok) return false
        setLive((s) => ({
          ...s,
          status: {
            employee_id: employeeId,
            product: input.product as ProductId,
            cert_path: s.status?.cert_path ?? 'implementation',
            ilt_date: input.ilt_date,
            getting_started_done: input.getting_started_done,
            ilt_done: input.ilt_done,
            certified: input.certified,
            updated_at: new Date().toISOString(),
          },
        }))
        return true
      }),
    [employeeId, track],
  )

  const setProduct = useCallback(
    async (productId: ProductId) => {
      if (!LIVE) {
        if (!employeeId) return false
        setTrainingProduct(employeeId, productId)
        setTick((t) => t + 1)
        return true
      }
      return writeStatus({ product: productId })
    },
    [employeeId, writeStatus],
  )

  const setIltDate = useCallback(
    async (iltDate: string | null) => {
      if (!LIVE) {
        if (!employeeId) return false
        setTrainingIltDate(employeeId, iltDate)
        setTick((t) => t + 1)
        return true
      }
      return writeStatus({ ilt_date: iltDate || null })
    },
    [employeeId, writeStatus],
  )

  const setFlag = useCallback(
    async (key: MilestoneFlag, value: boolean) => {
      if (!LIVE) {
        if (!employeeId) return false
        setTrainingMilestone(employeeId, key, value)
        setTick((t) => t + 1)
        return true
      }
      return writeStatus({ [key]: value })
    },
    [employeeId, writeStatus],
  )

  const setModule = useCallback(
    async (moduleKey: string, value: boolean) => {
      if (!LIVE) {
        if (!employeeId) return false
        setTrainingModule(employeeId, moduleKey, value)
        setTick((t) => t + 1)
        return true
      }
      return track(async () => {
        if (!employeeId) return false
        // Ensure the enrolment row exists first (mirrors the mock seam), so the
        // team roll-up counts this consultant once they start ticking modules.
        if (!statusRef.current) {
          const created = await saveTrainingStatus(statusInput(null))
          if (!created.ok) return false
          setLive((s) => ({
            ...s,
            status: s.status ?? {
              employee_id: employeeId,
              product: 'intacct',
              cert_path: 'implementation',
              ilt_date: null,
              getting_started_done: false,
              ilt_done: false,
              certified: false,
              updated_at: new Date().toISOString(),
            },
          }))
        }
        const result = await saveTrainingModule(moduleKey, value)
        if (!result.ok) return false
        setLive((s) => ({
          ...s,
          progress: [
            ...s.progress.filter((p) => p.module_key !== moduleKey),
            { module_key: moduleKey, done: value },
          ],
        }))
        return true
      })
    },
    [employeeId, track],
  )

  if (LIVE) {
    const enrolment = toEnrolment(live.status, live.progress)
    const productId = enrolment?.product_id ?? 'intacct'
    const product =
      live.products.find((p) => p.id === productId) ?? productById(productId)
    const modulesDone = enrolment?.modules_done ?? {}
    return {
      products: live.products,
      enrolment,
      productId,
      product,
      paths: pathsFor(productId),
      milestones: employee ? computeMilestones(employee, enrolment) : [],
      overall: computeOverallProgress(productId, modulesDone),
      stage: billableStage({
        getting_started_done: Boolean(enrolment?.getting_started_done),
        ilt_done: Boolean(enrolment?.ilt_done),
        certified: Boolean(enrolment?.certified),
      }),
      loading: live.loading,
      error: live.error,
      saving: saving > 0,
      setProduct,
      setIltDate,
      setFlag,
      setModule,
    }
  }

  // Mock mode: re-read the (mutable) mock seam on each tick.
  void tick
  const enrolment = employeeId ? getTrainingEnrolment(employeeId) : undefined
  const productId = enrolment?.product_id ?? 'intacct'
  return {
    products: listProducts(),
    enrolment,
    productId,
    product: productById(productId),
    paths: pathsFor(productId),
    milestones: employeeId ? getEmployeeMilestones(employeeId) : [],
    overall: employeeId
      ? getEmployeeOverallProgress(employeeId)
      : { done: 0, total: 0, percent: 0 },
    stage: billableStage({
      getting_started_done: Boolean(enrolment?.getting_started_done),
      ilt_done: Boolean(enrolment?.ilt_done),
      certified: Boolean(enrolment?.certified),
    }),
    loading: false,
    error: null,
    saving: false,
    setProduct,
    setIltDate,
    setFlag,
    setModule,
  }
}

// ── Team controller (manager/admin roll-up) ───────────────────────────────────

export interface TrainingTeamController {
  rows: BillableSummaryRow[]
  loading: boolean
  error: string | null
}

const ROSTER_COLUMNS =
  'id,display_name,job_title,avatar_initials,avatar_color,department,status,start_date'

export function useTrainingTeam(): TrainingTeamController {
  const [live, setLive] = useState<TrainingTeamController>(() => ({
    rows: [],
    loading: LIVE,
    error: null,
  }))

  useEffect(() => {
    if (!LIVE) return
    let active = true
    Promise.all([
      getJson<RosterEmployee[]>(`/api/rest/employees?select=${ROSTER_COLUMNS}`),
      getJson<TrainingStatusRow[]>('/api/rest/training_status?select=*'),
      getJson<Product[]>('/api/rest/products?order=id'),
    ])
      .then(([roster, statuses, products]) => {
        if (!active) return
        setLive({
          rows: composeBillableSummary(roster, statuses, products),
          loading: false,
          error: null,
        })
      })
      .catch((e: unknown) => {
        if (active) {
          setLive({
            rows: [],
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load',
          })
        }
      })
    return () => {
      active = false
    }
  }, [])

  if (!LIVE) return { rows: getBillableSummary(), loading: false, error: null }
  return live
}
