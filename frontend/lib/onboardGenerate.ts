// ── New-starter onboarding helpers ────────────────────────────────────────────
// Pure helpers for the admin "New Employee / Schedule Onboarding" screen
// (frontend/app/admin/onboard). Kept out of the page module so the email
// auto-derivation has its own unit tests (Next.js forbids arbitrary named exports
// from page files).
//
// The per-phase task generation plan and its total live in the mock seam
// (getOnboardingGenerationPlan / getOnboardingGenerationTaskTotal) so screens read
// generation data through the one accessor layer.

/**
 * Resolve a new starter's work email. Email is optional on the form: when the
 * admin leaves it blank we auto-derive `{first}@jera.co.za` from the full name,
 * mirroring the prototype's newEmployeeData(). A supplied (non-blank) email wins.
 * Returns '' only when both the supplied email and the name are blank.
 */
export function deriveWorkEmail(supplied: string, fullName: string): string {
  const trimmed = supplied.trim()
  if (trimmed) return trimmed
  const first = fullName.trim().split(/\s+/).filter(Boolean)[0]
  if (!first) return ''
  return `${first.toLowerCase()}@jera.co.za`
}
