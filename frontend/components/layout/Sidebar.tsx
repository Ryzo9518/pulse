'use client'

// ── Sidebar ──────────────────────────────────────────────────────────────────
// The persistent 260px dark navigation rail. Mirrors the prototype's
// <aside id="sidebar"> block (docs/pulse_v4_prototype.html ~499-560) and the
// nav structure in docs/FEATURE_SPEC.md "Sidebar Navigation". Managers get a
// "My team" section; admins get the full "Admin" section — both keyed off the
// active view role. Active highlight follows the current route via usePathname
// (sub-routes highlight their parent).

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { Avatar } from '@/components/ui'
import { useSession } from '@/lib/mock/session'
import { roleLabel } from '@/lib/capabilities'
import {
  getPolicyAckState,
  listMessages,
  listTasks,
  getTaskStatus,
} from '@/lib/mock'
import { TOTAL_FORMS } from '@/lib/constants'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

/**
 * Is `pathname` within `href`'s route subtree? Exact match, or a path segment
 * boundary match (so /forms matches /forms/personal but /forms-archive would
 * not, and /admin/onboard does not light up /admin/employees).
 */
function isActiveRoute(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentEmployee, role, signOut } = useSession()

  // ── Derive badge counts from the accessor layer ──
  const tasks = listTasks(role)
  const pendingTasks = tasks.filter((t) => {
    const status = getTaskStatus(t.id)?.status ?? 'pending'
    return status === 'pending'
  }).length

  // Dynamic total: badge always reflects the real number of policies, so adding
  // a policy raises the denominator and the gate can never read as complete early.
  const { acknowledgedCount, total: totalPolicies } = getPolicyAckState()
  const policiesBadge = `${acknowledgedCount}/${totalPolicies}`

  // Incomplete onboarding forms — static for this phase (no per-form completion
  // accessor yet); show the full set as outstanding.
  const incompleteForms = TOTAL_FORMS

  // Unread chat — static for now.
  const unreadChat = listMessages('general').length > 0 ? 3 : 0

  const sections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { href: '/dashboard', icon: '◎', label: 'Dashboard' },
        {
          href: '/workflow',
          icon: '▦',
          label: 'Workflow',
          badge: pendingTasks > 0 ? String(pendingTasks) : undefined,
        },
        { href: '/sop', icon: '◈', label: 'SOPs' },
        {
          href: '/forms',
          icon: '📝',
          label: 'My Forms',
          badge: incompleteForms > 0 ? String(incompleteForms) : undefined,
        },
        { href: '/policies', icon: '📖', label: 'Policies', badge: policiesBadge },
      ],
    },
    {
      label: 'People',
      items: [{ href: '/people', icon: '◉', label: 'Directory' }],
    },
    {
      label: 'Development',
      items: [
        { href: '/training', icon: '🎓', label: 'Cert Tracker' },
        { href: '/certifications', icon: '🏅', label: 'Certifications' },
      ],
    },
    {
      label: 'Finance',
      items: [{ href: '/expenses', icon: '💰', label: 'Expenses' }],
    },
    {
      label: 'Resources',
      items: [{ href: '/documents', icon: '📂', label: 'Documents' }],
    },
    {
      label: 'Comms',
      items: [
        {
          href: '/chat',
          icon: '💬',
          label: 'Chat',
          badge: unreadChat > 0 ? String(unreadChat) : undefined,
        },
      ],
    },
  ]

  // Manager: work-related team oversight only (no payroll/POPIA/contract).
  if (role === 'manager') {
    sections.push({
      label: 'My team',
      items: [
        { href: '/admin/employees', icon: '👥', label: 'My Team' },
        { href: '/admin/onboard', icon: '➕', label: 'Schedule Onboarding' },
      ],
    })
  }

  if (role === 'admin') {
    sections.push({
      label: 'Admin',
      items: [
        { href: '/admin/employees', icon: '👥', label: 'All Employees' },
        { href: '/admin/onboard', icon: '➕', label: 'New Employee' },
        { href: '/admin/passwords', icon: '🔑', label: 'Passwords' },
        { href: '/admin/notify', icon: '📣', label: 'Notify All' },
      ],
    })
  }

  // Employees show their job title; manager/admin show the active view role.
  const userCardLabel =
    role === 'employee' ? currentEmployee?.job_title : roleLabel(role)

  function handleSignOut() {
    signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-[260px] flex-shrink-0 flex-col overflow-y-auto bg-surface-sidebar max-[700px]:w-[64px]">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] px-[22px] pb-5 pt-6 max-[700px]:justify-center max-[700px]:px-0">
        <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-jera-red shadow-red-glow">
          <span className="font-display text-lg font-black text-white">P</span>
        </div>
        <div className="flex flex-col max-[700px]:hidden">
          <span className="font-display text-[17px] font-extrabold tracking-[2px] text-white">
            PULSE
          </span>
          <span className="mt-px text-[10px] font-medium tracking-[0.5px] text-white/40">
            The heartbeat of your team
          </span>
        </div>
      </div>

      {/* Nav sections */}
      <div className="flex flex-col pt-3">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1 pt-4 max-[700px]:hidden">
              <div className="px-[10px] text-[10px] font-bold uppercase tracking-[2px] text-white/25">
                {section.label}
              </div>
            </div>
            <nav className="flex flex-col gap-[2px] px-3">
              {section.items.map((item) => {
                const active = isActiveRoute(pathname, item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-[10px] rounded-btn border border-transparent px-3 py-[9px] text-[13.5px] transition-all duration-150 max-[700px]:justify-center max-[700px]:px-0 ${
                      active
                        ? 'bg-jera-red font-semibold text-white shadow-red-glow'
                        : 'font-medium text-white/70 hover:bg-surface-sidebar-hover hover:text-white'
                    }`}
                  >
                    <span className="w-[22px] flex-shrink-0 text-center text-base">
                      {item.icon}
                    </span>
                    <span className="max-[700px]:hidden">{item.label}</span>
                    {item.badge ? (
                      <span
                        className={`ml-auto rounded-[4px] px-[7px] py-px text-[11px] font-semibold max-[700px]:hidden ${
                          active
                            ? 'bg-white/25 text-white'
                            : 'bg-white/[0.08] text-white/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom user card + sign out */}
      <div className="mt-auto border-t border-white/[0.04]">
        <div className="px-4 py-3 max-[700px]:px-2">
          <div className="flex items-center gap-[10px] rounded-[10px] bg-white/[0.03] p-3 max-[700px]:justify-center max-[700px]:p-2">
            <Avatar
              name={currentEmployee?.display_name}
              initials={currentEmployee?.avatar_initials}
              color={currentEmployee?.avatar_color}
              size="sm"
            />
            <div className="min-w-0 flex-1 max-[700px]:hidden">
              <div className="truncate text-[13px] font-semibold text-white">
                {currentEmployee?.display_name ?? 'Signed out'}
              </div>
              <div className="truncate text-[11px] text-white/40">
                {userCardLabel ?? ''}
              </div>
            </div>
          </div>
        </div>
        <div className="flex px-4 pb-[14px] pt-2 max-[700px]:px-2">
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="w-full rounded-btn border border-white/10 bg-white/[0.03] px-2 py-2 text-center font-display text-xs font-semibold text-white/50 transition-all duration-150 hover:border-white/20 hover:bg-white/[0.08] hover:text-white/70"
          >
            <span className="max-[700px]:hidden">Sign Out</span>
            <span className="hidden max-[700px]:inline" aria-hidden="true">
              ⏻
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
