// Generates database/migrations/006_seed_sop_content.sql from the canonical SOPs
// in lib/mock/sops.ts. The base seed (003) loads sops metadata only; this fills
// in the sop_steps content. Idempotent upserts. Re-run with:
//   bun run scripts/gen-sop-content.ts
import { writeFileSync } from 'node:fs'
import { sops, sopSteps } from '../lib/mock/sops'

function lit(s: string | null | undefined): string {
  return s == null ? 'null' : "'" + s.replace(/'/g, "''") + "'"
}

const sopUpserts = sops
  .map(
    (s) =>
      `insert into sops (key, name, icon, total_steps) values (${lit(s.key)}, ${lit(s.name)}, ${lit(s.icon)}, ${s.total_steps})\n` +
      `  on conflict (key) do update set name=excluded.name, icon=excluded.icon, total_steps=excluded.total_steps;`,
  )
  .join('\n')

const stepUpserts = sopSteps
  .map(
    (st) =>
      `insert into sop_steps (sop_key, step_number, icon, title, description, detail, action_text, tip_text) values (` +
      `${lit(st.sop_key)}, ${st.step_number}, ${lit(st.icon)}, ${lit(st.title)}, ${lit(st.description)}, ${lit(st.detail)}, ${lit(st.action_text)}, ${lit(st.tip_text)})\n` +
      `  on conflict (sop_key, step_number) do update set icon=excluded.icon, title=excluded.title, description=excluded.description, detail=excluded.detail, action_text=excluded.action_text, tip_text=excluded.tip_text;`,
  )
  .join('\n')

const sql = `-- 006_seed_sop_content.sql
-- Seeds the SOP step content for the 4 SOPs (base seed had sops metadata but no
-- sop_steps). Idempotent upserts keyed by (sop_key, step_number).
-- GENERATED from frontend/lib/mock/sops.ts by scripts/gen-sop-content.ts
-- — edit the source SOPs, not this file.
begin;
${sopUpserts}
${stepUpserts}
commit;
`

const out = new URL('../../database/migrations/006_seed_sop_content.sql', import.meta.url)
writeFileSync(out, sql)
console.log(`Wrote ${sopSteps.length} SOP step upserts to ${out.pathname}`)
