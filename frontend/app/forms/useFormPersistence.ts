'use client'

// Shared form load/save wiring for the onboarding forms. In live mode it
// prefills from the employee's saved (decrypted) data and persists via the
// server action (which encrypts sensitive fields); in mock mode it just signals
// completion, preserving the previous behaviour.
import { useEffect, useState } from 'react'

import { loadForm, saveForm } from './actions'
import type { FormValues } from './forms-config'

const LIVE = process.env.NEXT_PUBLIC_PULSE_DATA === 'live'

export function useFormPersistence(
  key: string,
  setValues: (updater: (prev: FormValues) => FormValues) => void,
) {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(LIVE)

  useEffect(() => {
    if (!LIVE) return
    let active = true
    loadForm(key)
      .then((vals) => {
        if (active && Object.keys(vals).length > 0) {
          setValues((prev) => ({ ...prev, ...vals }))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  async function persist(values: FormValues, onDone: () => void) {
    if (!LIVE) {
      onDone()
      return
    }
    setSaving(true)
    setSaveError(null)
    const res = await saveForm(key, values)
    setSaving(false)
    if (res.ok) onDone()
    else setSaveError(res.error ?? 'Could not save. Please try again.')
  }

  return { saving, saveError, loading, persist }
}
