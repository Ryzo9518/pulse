'use server'

// WS-7: persist the onboarding forms. Each form saves the signed-in employee's
// own satellite row(s) via PostgREST (RLS: self-or-admin; managers never read
// these). POPIA-sensitive text columns (ID, banking, medical, contact PII) are
// encrypted at rest with the app key — the DB stores only ciphertext.
import { auth } from '@/auth'
import { encryptOptional, decryptOptional } from '@/lib/crypto/field-encryption'

type Values = Record<string, string>
export interface FormResult {
  ok: boolean
  error?: string
}

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

function headers(token: string, prefer: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  }
}

async function upsert(
  c: Ctx,
  table: string,
  onConflict: string,
  rows: Array<Record<string, unknown>>,
): Promise<boolean> {
  const res = await fetch(
    `${c.base}/${table}?on_conflict=${onConflict}`,
    {
      method: 'POST',
      headers: headers(c.token, 'resolution=merge-duplicates,return=minimal'),
      cache: 'no-store',
      body: JSON.stringify(rows),
    },
  )
  return res.ok
}

async function getRows(c: Ctx, table: string, query: string): Promise<Values[]> {
  const res = await fetch(`${c.base}/${table}?${query}`, {
    headers: { Authorization: `Bearer ${c.token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  return (await res.json()) as Values[]
}

const E = encryptOptional
const D = decryptOptional
const v = (values: Values, k: string) => values[k]?.trim() || null

// ── Save ────────────────────────────────────────────────────────────────────

export async function saveForm(key: string, values: Values): Promise<FormResult> {
  const c = await ctx()
  if ('error' in c) return { ok: false, error: c.error }
  const now = new Date().toISOString()

  try {
    if (key === 'personal') {
      const ok = await upsert(c, 'employee_personal_info', 'employee_id', [
        {
          employee_id: c.employeeId,
          id_number: E(v(values, 'idNumber')),
          date_of_birth: v(values, 'dob'),
          gender: v(values, 'gender'),
          nationality: v(values, 'nationality'),
          home_language: v(values, 'language'),
          home_address: E(v(values, 'address')),
          city: v(values, 'city'),
          province: v(values, 'province'),
          postal_code: v(values, 'postal'),
          cell_phone: E(v(values, 'cell')),
          personal_email: E(v(values, 'email')),
        },
      ])
      return ok ? { ok: true } : { ok: false, error: 'Could not save your details' }
    }

    if (key === 'tax') {
      const ok = await upsert(c, 'employee_tax_banking', 'employee_id', [
        {
          employee_id: c.employeeId,
          tax_ref_number: E(v(values, 'taxRef')),
          tax_status: v(values, 'taxStatus'),
          bank_name: v(values, 'bankName'),
          account_holder: E(v(values, 'accountHolder')),
          account_number: E(v(values, 'accountNumber')),
          branch_code: E(v(values, 'branchCode')),
          account_type: v(values, 'accountType'),
          consent_given: true,
          consent_date: now,
        },
      ])
      return ok ? { ok: true } : { ok: false, error: 'Could not save your tax & banking details' }
    }

    if (key === 'emergency') {
      const contacts = [1, 2]
        .map((n) => ({
          employee_id: c.employeeId,
          contact_order: n,
          full_name: E(v(values, `contact${n}Name`)),
          relationship: v(values, `contact${n}Rel`),
          cell_phone: E(v(values, `contact${n}Cell`)),
          home_phone: E(v(values, `contact${n}Home`)),
          address: E(v(values, `contact${n}Address`)),
        }))
        .filter((row) => row.full_name !== null)
      const okC =
        contacts.length === 0 ||
        (await upsert(c, 'emergency_contacts', 'employee_id,contact_order', contacts))
      const okM = await upsert(c, 'employee_medical_info', 'employee_id', [
        {
          employee_id: c.employeeId,
          doctor_name: E(v(values, 'doctorName')),
          doctor_phone: E(v(values, 'doctorPhone')),
          medical_aid: E(v(values, 'medicalAid')),
          medical_aid_number: E(v(values, 'medicalAidNumber')),
          allergies: E(v(values, 'allergies')),
          consent_given: true,
          consent_date: now,
        },
      ])
      return okC && okM
        ? { ok: true }
        : { ok: false, error: 'Could not save your emergency & medical details' }
    }

    if (key === 'goals') {
      // Replace the goal set: delete existing, insert the non-empty ones.
      await fetch(
        `${c.base}/employee_goals?employee_id=eq.${c.employeeId}`,
        { method: 'DELETE', headers: headers(c.token, 'return=minimal'), cache: 'no-store' },
      )
      const rows: Array<Record<string, unknown>> = []
      for (const period of ['30', '60', '90']) {
        for (const n of [1, 2, 3]) {
          const text = v(values, `goal${period}_${n}`)
          if (text) {
            rows.push({
              employee_id: c.employeeId,
              period,
              goal_number: n,
              goal_text: text,
            })
          }
        }
      }
      if (rows.length === 0) return { ok: true }
      const res = await fetch(`${c.base}/employee_goals`, {
        method: 'POST',
        headers: headers(c.token, 'return=minimal'),
        cache: 'no-store',
        body: JSON.stringify(rows),
      })
      return res.ok ? { ok: true } : { ok: false, error: 'Could not save your goals' }
    }

    return { ok: false, error: 'Unknown form' }
  } catch {
    return { ok: false, error: 'Could not reach the data service' }
  }
}

// ── Load (prefill) ────────────────────────────────────────────────────────────

export async function loadForm(key: string): Promise<Values> {
  const c = await ctx()
  if ('error' in c) return {}

  if (key === 'personal') {
    const [r] = await getRows(c, 'employee_personal_info', `employee_id=eq.${c.employeeId}&limit=1`)
    if (!r) return {}
    return clean({
      idNumber: D(r.id_number),
      dob: r.date_of_birth,
      gender: r.gender,
      nationality: r.nationality,
      language: r.home_language,
      address: D(r.home_address),
      city: r.city,
      province: r.province,
      postal: r.postal_code,
      cell: D(r.cell_phone),
      email: D(r.personal_email),
    })
  }

  if (key === 'tax') {
    const [r] = await getRows(c, 'employee_tax_banking', `employee_id=eq.${c.employeeId}&limit=1`)
    if (!r) return {}
    return clean({
      taxRef: D(r.tax_ref_number),
      taxStatus: r.tax_status,
      bankName: r.bank_name,
      accountHolder: D(r.account_holder),
      accountNumber: D(r.account_number),
      branchCode: D(r.branch_code),
      accountType: r.account_type,
    })
  }

  if (key === 'emergency') {
    const contacts = await getRows(c, 'emergency_contacts', `employee_id=eq.${c.employeeId}&order=contact_order`)
    const [med] = await getRows(c, 'employee_medical_info', `employee_id=eq.${c.employeeId}&limit=1`)
    const out: Values = {}
    for (const ct of contacts) {
      const n = ct.contact_order
      Object.assign(out, clean({
        [`contact${n}Name`]: D(ct.full_name),
        [`contact${n}Rel`]: ct.relationship,
        [`contact${n}Cell`]: D(ct.cell_phone),
        [`contact${n}Home`]: D(ct.home_phone),
        [`contact${n}Address`]: D(ct.address),
      }))
    }
    if (med) {
      Object.assign(out, clean({
        doctorName: D(med.doctor_name),
        doctorPhone: D(med.doctor_phone),
        medicalAid: D(med.medical_aid),
        medicalAidNumber: D(med.medical_aid_number),
        allergies: D(med.allergies),
      }))
    }
    return out
  }

  if (key === 'goals') {
    const rows = await getRows(c, 'employee_goals', `employee_id=eq.${c.employeeId}`)
    const out: Values = {}
    for (const g of rows) out[`goal${g.period}_${g.goal_number}`] = (g.goal_text as string) ?? ''
    return out
  }

  return {}
}

/** Drop null/undefined so callers get a clean Record<string,string>. */
function clean(obj: Record<string, unknown>): Values {
  const out: Values = {}
  for (const [k, val] of Object.entries(obj)) {
    if (val != null) out[k] = String(val)
  }
  return out
}
