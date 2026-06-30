// Authenticated PostgREST proxy. The browser never talks to PostgREST directly
// (it's bound to 127.0.0.1 on the box) and never holds the data token: every
// request is authenticated against the Auth.js session here, server-side, and
// forwarded to the internal data API with THIS user's freshly-minted token.
// Row-Level Security — not this proxy — decides which rows come back.
//
// Reads only (GET). Writes will be added per-feature with their own validation.
import { auth } from '@/auth'
import { parseTable, buildUpstreamUrl } from '@/lib/data/rest-proxy'

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function GET(
  req: Request,
  ctx: { params: { path?: string[] } },
): Promise<Response> {
  const table = parseTable(ctx.params.path)
  if (!table) return json({ error: 'Not found' }, 404)

  const session = await auth()
  if (!session?.employee || !session?.pulseToken) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const base = process.env.PULSE_POSTGREST_URL
  if (!base) return json({ error: 'Data API not configured' }, 500)

  const search = new URL(req.url).search
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.pulseToken}`,
    Accept: 'application/json',
  }
  const prefer = req.headers.get('prefer')
  if (prefer) headers.Prefer = prefer

  let upstream: Response
  try {
    upstream = await fetch(buildUpstreamUrl(base, table, search), {
      headers,
      cache: 'no-store',
    })
  } catch {
    return json({ error: 'Data API unreachable' }, 502)
  }

  const body = await upstream.text()
  const out: Record<string, string> = { 'Content-Type': 'application/json' }
  const range = upstream.headers.get('content-range')
  if (range) out['Content-Range'] = range
  return new Response(body, { status: upstream.status, headers: out })
}
