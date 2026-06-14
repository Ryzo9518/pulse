import { redirect } from 'next/navigation'

// Root route. The mock session defaults to active in-memory (the seeded
// onboarding employee), so we land the user straight on the dashboard. Auth
// screens (/login) are a later unit; redirecting here avoids a 404 and gives the
// foundation checkpoint a useful landing screen.
export default function RootPage() {
  redirect('/dashboard')
}
