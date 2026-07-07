import { describe, it, expect } from 'vitest'
import { parseTable, buildUpstreamUrl, isWriteAllowed } from '../rest-proxy'

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

describe('isWriteAllowed', () => {
  it('allows the configured methods for an allow-listed table', () => {
    expect(isWriteAllowed('hr_policy_acknowledgements', 'POST')).toBe(true)
    expect(isWriteAllowed('hr_policy_acknowledgements', 'PATCH')).toBe(true)
  })

  it('allows certification writes (WS-5: self-upload + admin manage/delete)', () => {
    expect(isWriteAllowed('certifications', 'POST')).toBe(true)
    expect(isWriteAllowed('certifications', 'PATCH')).toBe(true)
    expect(isWriteAllowed('certifications', 'DELETE')).toBe(true)
  })

  it('denies methods not configured for the table', () => {
    expect(isWriteAllowed('hr_policy_acknowledgements', 'DELETE')).toBe(false)
    expect(isWriteAllowed('hr_policy_acknowledgements', 'GET')).toBe(false)
    expect(isWriteAllowed('certifications', 'GET')).toBe(false)
    expect(isWriteAllowed('certifications', 'PUT')).toBe(false)
  })

  it('denies writes to tables not on the allowlist', () => {
    expect(isWriteAllowed('employees', 'POST')).toBe(false)
    expect(isWriteAllowed('audit_log', 'POST')).toBe(false)
    expect(isWriteAllowed('employee_tax_banking', 'PATCH')).toBe(false)
    expect(isWriteAllowed(null, 'POST')).toBe(false)
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
