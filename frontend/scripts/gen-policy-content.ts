// Generates database/migrations/005_seed_policy_content.sql from the canonical
// 24 policies in lib/mock/policies.ts. The DB seed (003) loads policy metadata
// only; this fills in icon/summary/full_text so the live Policies screen has
// real content. Idempotent (id-keyed UPDATEs). Re-run with:
//   bun run scripts/gen-policy-content.ts
import { writeFileSync } from 'node:fs'
import { hrPolicies } from '../lib/mock/policies'

function lit(s: string | null | undefined): string {
  if (s == null) return 'null'
  return "'" + s.replace(/'/g, "''") + "'"
}

const updates = hrPolicies
  .map(
    (p) =>
      `update hr_policies set icon=${lit(p.icon)}, summary=${lit(p.summary)}, full_text=${lit(p.full_text)} where id=${lit(p.id)};`,
  )
  .join('\n')

const sql = `-- 005_seed_policy_content.sql
-- Loads policy icon/summary/full_text for the canonical 24 policies. The base
-- seed (003) inserts policy metadata only; this fills in the body text so the
-- live Policies screen renders real content. Idempotent: id-keyed UPDATEs.
-- GENERATED from frontend/lib/mock/policies.ts by scripts/gen-policy-content.ts
-- — edit the source policies, not this file.
begin;
${updates}
commit;
`

const out = new URL('../../database/migrations/005_seed_policy_content.sql', import.meta.url)
writeFileSync(out, sql)
console.log(`Wrote ${hrPolicies.length} policy UPDATEs to ${out.pathname}`)
