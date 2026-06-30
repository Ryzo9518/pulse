import { describe, it, expect } from 'vitest'
import { parseTable, buildUpstreamUrl } from '../rest-proxy'

describe('parseTable', () => {
  it('accepts a single valid table/view name', () => {
    expect(parseTable(['employees'])).toBe('employees')
    expect(parseTable(['admin_onboarding_summary'])).toBe('admin_onboarding_summary')
    expect(parseTable(['_private'])).toBe('_private')
  })

  it('rejects nested paths (blocks /rpc/* and traversal)', () => {
    expect(parseTable(['rpc', 'dangerous_fn'])).toBeNull()
    expect(parseTable(['employees', 'extra'])).toBeNull()
    expect(parseTable(['..', 'etc'])).toBeNull()
  })

  it('rejects empty, missing, or malformed names', () => {
    expect(parseTable(undefined)).toBeNull()
    expect(parseTable([])).toBeNull()
    expect(parseTable(['Employees'])).toBeNull() // uppercase
    expect(parseTable(['employees;drop'])).toBeNull()
    expect(parseTable(['1table'])).toBeNull()
    expect(parseTable(['has space'])).toBeNull()
  })
})

describe('buildUpstreamUrl', () => {
  it('joins base + table + query, tolerating a trailing slash on base', () => {
    expect(buildUpstreamUrl('http://127.0.0.1:3001', 'employees', '?select=*')).toBe(
      'http://127.0.0.1:3001/employees?select=*',
    )
    expect(buildUpstreamUrl('http://127.0.0.1:3001/', 'employees', '')).toBe(
      'http://127.0.0.1:3001/employees',
    )
  })
})
