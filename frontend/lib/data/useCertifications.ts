'use client'

// Certifications data controller (WS-5). Behind NEXT_PUBLIC_PULSE_DATA=live it
// reads the signed-in user's visible certificates via the proxy (RLS-scoped:
// self + admin-all + manager-team-read) and writes create/edit/delete back
// through it (cert_ins/cert_upd/cert_del: self-or-admin). Otherwise it delegates
// to the mock seam, preserving current behaviour. Exposes the same shapes the
// Certifications screen already consumes so the rendering is unchanged.
//
// File storage note: the certificate FILE itself is deferred to SharePoint
// (WS-10/B5) — `file_ref` holds link/metadata only for now, per the plan.
import { useCallback, useEffect, useState } from 'react'

import {
  deleteCertification as mockDelete,
  listCertifications as mockList,
  saveCertification as mockSave,
  type CertificationInput,
} from '@/lib/mock'
import type { Certification, UserRole } from '@/types/database'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

/**
 * Normalise a certificate draft into a row payload that satisfies the DB
 * `cert_class_fields` check constraint (001_schema.sql): product certs carry
 * vendor/product/expiry and NO nqf_level; qualifications carry nqf_level and NO
 * vendor/product/expiry. Mirrors the mock seam's saveCertification normalisation
 * so both modes accept the same drafts. Returns null when the required fields
 * (name, employee_id) are missing — callers validate before submitting.
 */
export function normalizeCertInput(
  input: CertificationInput,
): Record<string, unknown> | null {
  const name = input.name.trim()
  if (!name || !input.employee_id) return null
  const isProduct = input.cclass === 'product'
  return {
    employee_id: input.employee_id,
    cclass: input.cclass,
    vendor: isProduct ? (input.vendor ?? null) : null,
    product: isProduct ? (input.product ?? null) : null,
    name,
    nqf_level: isProduct ? null : (input.nqf_level ?? null),
    issued: input.issued || null,
    expiry: isProduct ? (input.expiry || null) : null,
    // SharePoint link / filename metadata only (file upload is WS-10/B5).
    file_ref: input.file_ref?.trim() || null,
  }
}

/**
 * Plan the live write for a create (POST) or edit (PATCH ?id=eq.<id>) — pure so
 * the request shape is unit-testable. Returns null for an invalid draft.
 */
export function certWritePlan(
  input: CertificationInput,
  id?: string | null,
): { path: string; method: 'POST' | 'PATCH'; payload: Record<string, unknown> } | null {
  const payload = normalizeCertInput(input)
  if (!payload) return null
  if (id) {
    return {
      path: `/api/rest/certifications?id=eq.${encodeURIComponent(id)}`,
      method: 'PATCH',
      payload,
    }
  }
  return { path: '/api/rest/certifications', method: 'POST', payload }
}

export interface CertificationsController {
  /** Certificates visible to the signed-in user (RLS-scoped in live mode). */
  certifications: Certification[]
  loading: boolean
  error: string | null
  /**
   * Create (no id) or update (id) a certificate. Resolves to the saved row, or
   * null when the write affected zero rows (RLS default-deny — the prior view
   * stays unchanged, per the outcome contract's silent MSG-DENY-RLS). Rejects
   * on transport/validation failure (callers surface MSG-ERR-GENERIC).
   */
  save: (input: CertificationInput, id?: string | null) => Promise<Certification | null>
  /** Delete a certificate. Resolves true when a row was removed, false when RLS denied. */
  remove: (id: string) => Promise<boolean>
  /** Force a re-read. */
  reload: () => void
}

export function useCertifications(
  role: UserRole | undefined,
  employeeId?: string,
): CertificationsController {
  const [tick, setTick] = useState(0)
  const [live, setLive] = useState<{
    rows: Certification[]
    loading: boolean
    error: string | null
  }>(() => ({ rows: [], loading: LIVE, error: null }))

  useEffect(() => {
    if (!LIVE) return
    let active = true
    setLive((s) => ({ ...s, loading: true, error: null }))
    fetch('/api/rest/certifications?select=*&order=created_at.desc', {
      cache: 'no-store',
    })
      .then((r) => {
        if (!r.ok) throw new Error(`certifications (${r.status})`)
        return r.json() as Promise<Certification[]>
      })
      .then((rows) => {
        if (active) setLive({ rows, loading: false, error: null })
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
  }, [tick])

  const save = useCallback(
    async (input: CertificationInput, id?: string | null) => {
      if (!LIVE) {
        const saved = mockSave(input, id)
        setTick((t) => t + 1)
        return saved
      }
      const plan = certWritePlan(input, id)
      if (!plan) throw new Error('Certificate name and person are required')
      const res = await fetch(plan.path, {
        method: plan.method,
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(plan.payload),
      })
      if (!res.ok) throw new Error(`Could not save (${res.status})`)
      const rows = (await res.json()) as Certification[]
      setTick((t) => t + 1)
      // Empty representation on PATCH = zero rows matched → RLS denied.
      return rows[0] ?? null
    },
    [],
  )

  const remove = useCallback(async (id: string) => {
    if (!LIVE) {
      mockDelete(id)
      setTick((t) => t + 1)
      return true
    }
    const res = await fetch(
      `/api/rest/certifications?id=eq.${encodeURIComponent(id)}`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    )
    if (!res.ok) throw new Error(`Could not delete (${res.status})`)
    const rows = (await res.json()) as Certification[]
    setTick((t) => t + 1)
    return rows.length > 0
  }, [])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  if (LIVE) {
    return {
      certifications: live.rows,
      loading: live.loading,
      error: live.error,
      save,
      remove,
      reload,
    }
  }

  // Mock mode: re-read the (mutable) mock seam on each tick. Manager scope uses
  // the signed-in person's id as the managerId, matching the screen's existing
  // behaviour.
  void tick
  return {
    certifications:
      role && employeeId ? mockList(role, employeeId, employeeId) : [],
    loading: false,
    error: null,
    save,
    remove,
    reload,
  }
}
