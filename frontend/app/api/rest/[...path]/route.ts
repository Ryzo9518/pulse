// Authenticated PostgREST proxy. The browser never talks to PostgREST directly
// (it's bound to 127.0.0.1 on the box) and never holds the data token: every
// request is authenticated against the Auth.js session here, server-side, and
// forwarded to the internal data API with THIS user's freshly-minted token.
// Row-Level Security — not this proxy — decides which rows come back / change.
//
// Reads: any table/view (RLS-scoped). Writes: only allow-listed tables/methods
// (defense-in-depth) — see WRITE_ALLOWLIST.
import { auth } from '@/auth'
import {
  parseTable,
  buildUpstreamUrl,
  isWriteAllowed,
} from '@/lib/data/rest-proxy'

type Ctx = { params: { path?: string[] } }

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function forward(
  req: Request,
  table: string,
  method: string,
): Promise<Response> {
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

  const init: RequestInit = { method, headers, cache: 'no-store' }
  if (method === 'POST' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json'
    init.body = await req.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(buildUpstreamUrl(base, table, search), init)
  } catch {
    return json({ error: 'Data API unreachable' }, 502)
  }

  const body = await upstream.text()
  const out: Record<string, string> = { 'Content-Type': 'application/json' }
  const range = upstream.headers.get('content-range')
  if (range) out['Content-Range'] = range
  return new Response(body, { status: upstream.status, headers: out })
}

export async function GET(req: Request, ctx: Ctx): Promise<Response> {
  const table = parseTable(ctx.params.path)
  if (!table) return json({ error: 'Not found' }, 404)
  return forward(req, table, 'GET')
}

async function write(req: Request, ctx: Ctx, method: string): Promise<Response> {
  const table = parseTable(ctx.params.path)
  if (!table) return json({ error: 'Not found' }, 404)
  if (!isWriteAllowed(table, method)) {
    return json({ error: 'Method not allowed' }, 405)
  }
  return forward(req, table, method)
}

export function POST(req: Request, ctx: Ctx): Promise<Response> {
  return write(req, ctx, 'POST')
}
export function PATCH(req: Request, ctx: Ctx): Promise<Response> {
  return write(req, ctx, 'PATCH')
}
export function DELETE(req: Request, ctx: Ctx): Promise<Response> {
  return write(req, ctx, 'DELETE')
}
