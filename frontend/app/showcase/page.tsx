'use client'

/**
 * Foundation checkpoint gallery — NOT a product screen.
 *
 * Renders every shared UI primitive (Unit 3) inside the real AppShell (Unit 2)
 * so the design system can be eyeballed against docs/pulse_v4_prototype.html
 * before the 12 feature screens are built on top of this foundation.
 *
 * TODO: safe to delete once screens exist; kept as a living component gallery.
 */

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  StatCard,
  ActionCard,
  Badge,
  Card,
  Button,
  Input,
  Select,
  ProgressBar,
  Avatar,
  Modal,
  DataTable,
  EmptyState,
  Tabs,
  useToast,
} from '@/components/ui'
import { AVATAR_COLOURS, SA_PROVINCES } from '@/lib/constants'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[2px] text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  )
}

interface DemoRow {
  name: string
  dept: string
  status: string
}

const DEMO_ROWS: DemoRow[] = [
  { name: 'Ryan de Kock', dept: 'Management', status: 'active' },
  { name: 'Sarah van der Berg', dept: 'Consulting', status: 'onboarding' },
  { name: 'Pieter Botha', dept: 'Finance', status: 'probation' },
]

export default function ShowcasePage() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <AppShell>
      <PageHeader
        title="Component Showcase"
        subtitle="Foundation checkpoint — every design-system primitive, rendered in the real shell. Not a product screen."
        actions={
          <Button onClick={() => toast({ title: 'Hello 👋', message: 'Toasts slide in here.' })}>
            Fire a toast
          </Button>
        }
      />

      <div className="px-10 py-6">
        <Section title="Stat cards">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard value={28} label="Total tasks" accent="red" />
            <StatCard value={12} label="Completed" accent="green" />
            <StatCard value={7} label="In progress" accent="amber" />
            <StatCard value={9} label="Pending" accent="blue" />
          </div>
        </Section>

        <Section title="Action cards">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ActionCard icon="📝" title="Complete your forms" description="5 onboarding forms to finish" onClick={() => toast({ title: 'Forms' })} />
            <ActionCard icon="📖" title="Acknowledge policies" description="0 of 20 acknowledged" onClick={() => toast({ title: 'Policies' })} />
            <ActionCard icon="💰" title="Submit an expense" description="Travel claimed at R1.50/km" onClick={() => toast({ title: 'Expenses' })} />
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-3">
            <Badge color="green">Approved</Badge>
            <Badge color="amber">Pending</Badge>
            <Badge color="red">Declined</Badge>
            <Badge color="blue">IT</Badge>
            <Badge color="pink">HR</Badge>
            <Badge color="grey">Draft</Badge>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </div>
        </Section>

        <Section title="Avatars">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name="Ryan de Kock" size="lg" color={AVATAR_COLOURS[0]} />
            <Avatar name="Sarah van der Berg" size="md" color={AVATAR_COLOURS[1]} />
            <Avatar name="Pieter Botha" size="md" color={AVATAR_COLOURS[3]} />
            <Avatar name="Thandiwe Nkosi" size="sm" color={AVATAR_COLOURS[2]} />
          </div>
        </Section>

        <Section title="Progress">
          <Card className="max-w-md">
            <ProgressBar value={13} max={20} label="13/20" />
            <div className="h-3" />
            <ProgressBar percent={60} />
          </Card>
        </Section>

        <Section title="Form inputs">
          <Card className="grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Full name" placeholder="Jane Doe" />
            <Input label="Work email" placeholder="jane@jera.co.za" type="email" />
            <Select label="Province" placeholder="Select a province" options={SA_PROVINCES.map((p) => ({ value: p, label: p }))} />
            <Input label="With error" placeholder="Invalid" error="This field is required" />
          </Card>
        </Section>

        <Section title="Tabs">
          <Tabs
            tabs={[
              { value: 'a', label: 'Overview', content: <Card className="mt-3">Overview panel content.</Card> },
              { value: 'b', label: 'Details', content: <Card className="mt-3">Details panel content.</Card> },
              { value: 'c', label: 'Activity', content: <Card className="mt-3">Activity panel content.</Card> },
            ]}
          />
        </Section>

        <Section title="Data table">
          <DataTable<DemoRow>
            columns={[
              { key: 'name', header: 'Name', render: (r) => r.name },
              { key: 'dept', header: 'Department', render: (r) => r.dept },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge color={r.status === 'active' ? 'green' : r.status === 'onboarding' ? 'amber' : 'blue'}>
                    {r.status}
                  </Badge>
                ),
              },
            ]}
            rows={DEMO_ROWS}
            rowKey={(r) => r.name}
          />
        </Section>

        <Section title="Empty state">
          <Card padded={false}>
            <EmptyState
              icon="📭"
              title="Nothing here yet"
              description="Empty states use this pattern across the app."
              action={<Button variant="secondary">Take an action</Button>}
            />
          </Card>
        </Section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
        <p className="text-sm text-text-secondary">
          Modals overlay the app with a centered card. Press ESC or click the backdrop to close.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setModalOpen(false)
              toast({ title: 'Confirmed', message: 'Modal action fired a toast.' })
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
