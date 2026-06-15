'use client'

import { useMemo, useState } from 'react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, Avatar, Badge, Input, EmptyState } from '@/components/ui'
import type { BadgeColor } from '@/components/ui'
import { listEmployees } from '@/lib/mock'
import { filterDirectory } from '@/lib/directory'
import type { EmployeeStatus } from '@/types/database'

// People directory (Unit 11 + W9 search). A client component that reads the full
// roster from the mock accessor layer and filters it live by a single search box
// over name / job title / department — mirroring the prototype's `peopleData`
// (`${p.name} ${p.title} ${p.dept}`.includes(q)). Work fields only: name, title,
// department, status, email — no POPIA / personal fields are surfaced here.

// Colour-coded status presentation. Maps each EmployeeStatus to a Badge colour
// token (driving both the dot and the pill) plus a human label. Tokens only.
const STATUS_META: Record<EmployeeStatus, { label: string; color: BadgeColor }> = {
  active: { label: 'Active', color: 'green' },
  onboarding: { label: 'Onboarding', color: 'amber' },
  probation: { label: 'Probation', color: 'blue' },
  suspended: { label: 'Suspended', color: 'grey' },
  terminated: { label: 'Terminated', color: 'grey' },
}

// Dot colour per status, using the same Jera tokens the Badge palette uses so the
// indicator stays in sync with the pill.
const DOT_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-jera-green',
  amber: 'bg-jera-amber',
  blue: 'bg-jera-blue',
  red: 'bg-jera-red',
  pink: 'bg-jera-pink',
  teal: 'bg-jera-teal',
  grey: 'bg-text-muted',
}

export default function PeoplePage() {
  const employees = listEmployees()
  const [search, setSearch] = useState('')

  // Live filter over the work-only haystack (name + title + department), matching
  // the prototype's directory search. Empty query shows everyone.
  const filtered = useMemo(() => filterDirectory(employees, search), [employees, search])

  return (
    <AppShell>
      <PageHeader
        eyebrow="People"
        title="People Directory"
        subtitle="Everyone at Jera — find a colleague, their role, and how to reach them."
        actions={
          <div className="w-72 max-w-full">
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role, or team…"
              aria-label="Search the people directory"
            />
          </div>
        }
      />
      <div className="px-10 py-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matches"
            description={`No one matches "${search.trim()}". Try a different name, role, or team.`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((person) => {
              const status = STATUS_META[person.status]
              return (
                <Card key={person.id} className="flex flex-col items-center text-center">
                  <Avatar
                    size="lg"
                    initials={person.avatar_initials}
                    name={person.display_name}
                    color={person.avatar_color}
                    label={person.display_name}
                    className="mb-4"
                  />
                  <div className="font-display text-base font-bold text-text">
                    {person.display_name}
                  </div>
                  <div className="mt-0.5 text-[13px] text-text-secondary">
                    {person.job_title ?? '—'}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT_CLASSES[status.color]}`}
                      aria-hidden="true"
                    />
                    <Badge color={status.color}>{status.label}</Badge>
                  </div>

                  <div className="mt-3 text-[13px] text-text-muted">
                    {person.department ?? '—'}
                  </div>
                  <a
                    href={`mailto:${person.email}`}
                    className="mt-1 text-[12px] font-medium text-jera-blue hover:underline"
                  >
                    {person.email}
                  </a>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
