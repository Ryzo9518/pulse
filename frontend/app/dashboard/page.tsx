import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/layout/PageHeader'

// TODO: replaced by Unit 5 (real Dashboard). Minimal placeholder so the shell is
// viewable at /dashboard during the foundation checkpoint.
export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Dashboard" title="Dashboard" />
      <div className="px-10 py-8">
        <p className="text-sm text-text-muted">
          Screen coming soon — foundation checkpoint. Use the dev view switch
          (top-right) to flip between the employee and admin sidebars.
        </p>
      </div>
    </AppShell>
  )
}
