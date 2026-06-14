'use client'

import { useState } from 'react'

import { Button, Card, Input } from '@/components/ui'

import type { FormSubViewProps } from './PersonalForm'
import {
  validateForm,
  type FieldErrors,
  type FormValues,
} from './forms-config'

interface GoalBlock {
  /** Field-name prefix, e.g. "goal30". */
  prefix: string
  label: string
  description: string
  /** Left accent colour class. */
  accent: string
  placeholders: [string, string, string]
}

const BLOCKS: GoalBlock[] = [
  {
    prefix: 'goal30',
    label: 'First 30 Days — Learn & Absorb',
    description:
      'Focus on foundational knowledge, company culture, tools, and processes.',
    accent: 'border-l-jera-red',
    placeholders: [
      'e.g. Complete all Zoho SOPs and tool onboarding',
      'e.g. Understand team structure and project workflows',
      'e.g. Shadow senior team member on 2 client calls',
    ],
  },
  {
    prefix: 'goal60',
    label: 'Days 31–60 — Contribute',
    description:
      'Start contributing independently. Take on tasks with guidance.',
    accent: 'border-l-jera-blue',
    placeholders: [
      'e.g. Own and deliver first project task independently',
      'e.g. Log accurate time daily on Zoho Projects',
      'e.g. Build working relationships across departments',
    ],
  },
  {
    prefix: 'goal90',
    label: 'Days 61–90 — Perform',
    description:
      'Demonstrate competency and ownership. Work with less supervision.',
    accent: 'border-l-jera-green',
    placeholders: [
      'e.g. Manage a small project or client deliverable end-to-end',
      'e.g. Complete probation review with positive outcome',
      'e.g. Identify one process improvement and present to team',
    ],
  },
]

/** Form 5 of 5 — 30-60-90 Day Goals (3 goals per period). */
export function GoalsForm({ onComplete, onBack }: FormSubViewProps) {
  const [values, setValues] = useState<FormValues>({})
  const [errors, setErrors] = useState<FieldErrors>({})

  const set = (name: string) => (e: { target: { value: string } }) =>
    setValues((prev) => ({ ...prev, [name]: e.target.value }))

  const handleSave = () => {
    const found = validateForm('goals', values)
    setErrors(found)
    if (Object.keys(found).length === 0) onComplete()
  }

  return (
    <div className="flex flex-col gap-4">
      {BLOCKS.map((block) => (
        <Card key={block.prefix} className={`border-l-[3px] ${block.accent}`}>
          <div className="mb-[14px] text-[11px] font-bold uppercase tracking-[1.5px] text-text-muted">
            {block.label}
          </div>
          <p className="mb-3 text-[13px] text-text-muted">{block.description}</p>
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => {
              const name = `${block.prefix}_${n}`
              return (
                <Input
                  key={name}
                  label={`Goal ${n}`}
                  name={name}
                  placeholder={block.placeholders[n - 1]}
                  value={values[name] ?? ''}
                  onChange={set(name)}
                  error={errors[name]}
                />
              )
            })}
          </div>
        </Card>
      ))}

      <Card>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave}>
            Save Goals &amp; Complete Forms →
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default GoalsForm
