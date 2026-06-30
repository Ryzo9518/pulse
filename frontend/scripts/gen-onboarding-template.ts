// Generates database/migrations/007_seed_onboarding_template.sql from the
// canonical onboarding template in lib/mock/onboarding.ts. The base seed (003)
// shipped only a 5-task subset; this loads the full phases + tasks so a real
// onboarding workflow generates the proper list. Idempotent. Re-run with:
//   bun run scripts/gen-onboarding-template.ts
import { writeFileSync } from 'node:fs'
import { onboardingPhases, onboardingTasks } from '../lib/mock/onboarding'

function lit(s: string | null | undefined): string {
  return s == null ? 'null' : "'" + s.replace(/'/g, "''") + "'"
}

const phases = onboardingPhases
  .map(
    (p) =>
      `insert into onboarding_phases (id, name, icon, days_label, visibility, sort_order) values (${lit(p.id)}, ${lit(p.name)}, ${lit(p.icon)}, ${lit(p.days_label)}, ${lit(p.visibility)}, ${p.sort_order})\n` +
      `  on conflict (id) do update set name=excluded.name, icon=excluded.icon, days_label=excluded.days_label, visibility=excluded.visibility, sort_order=excluded.sort_order;`,
  )
  .join('\n')

const tasks = onboardingTasks
  .map(
    (t) =>
      `insert into onboarding_tasks (id, phase_id, title, default_owner, priority, system, days_offset, visibility, manager_hidden, sort_order) values (` +
      `${lit(t.id)}, ${lit(t.phase_id)}, ${lit(t.title)}, ${lit(t.default_owner)}, ${lit(t.priority)}, ${lit(t.system)}, ${t.days_offset}, ${lit(t.visibility)}, ${t.manager_hidden ? 'true' : 'false'}, ${t.sort_order})\n` +
      `  on conflict (id) do update set phase_id=excluded.phase_id, title=excluded.title, default_owner=excluded.default_owner, priority=excluded.priority, system=excluded.system, days_offset=excluded.days_offset, visibility=excluded.visibility, manager_hidden=excluded.manager_hidden, sort_order=excluded.sort_order;`,
  )
  .join('\n')

const sql = `-- 007_seed_onboarding_template.sql
-- Seeds the full onboarding task template (phases + tasks). The base seed (003)
-- shipped only a 5-task subset; this loads the complete template so a real
-- onboarding workflow generates the proper task list. Idempotent upserts.
-- GENERATED from frontend/lib/mock/onboarding.ts by scripts/gen-onboarding-template.ts
begin;
${phases}
${tasks}
commit;
`

const out = new URL('../../database/migrations/007_seed_onboarding_template.sql', import.meta.url)
writeFileSync(out, sql)
console.log(`Wrote ${onboardingPhases.length} phases + ${onboardingTasks.length} tasks`)
