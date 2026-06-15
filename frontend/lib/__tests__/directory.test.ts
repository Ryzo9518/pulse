import { describe, expect, it } from 'vitest'
import { filterDirectory, matchesDirectorySearch } from '../directory'
import { listEmployees } from '@/lib/mock'
import type { Employee } from '@/types/database'

const roster = listEmployees()

describe('matchesDirectorySearch', () => {
  const person = roster[0]

  it('matches everyone when the query is empty or whitespace', () => {
    expect(matchesDirectorySearch(person, '')).toBe(true)
    expect(matchesDirectorySearch(person, '   ')).toBe(true)
  })

  it('matches on name (case-insensitive)', () => {
    const firstName = person.display_name.split(' ')[0]
    expect(matchesDirectorySearch(person, firstName.toUpperCase())).toBe(true)
  })

  it('matches on department', () => {
    const withDept = roster.find((e) => e.department) as Employee
    expect(matchesDirectorySearch(withDept, withDept.department!)).toBe(true)
  })

  it('does not match an unrelated query', () => {
    expect(matchesDirectorySearch(person, 'zzz-no-such-token')).toBe(false)
  })
})

describe('filterDirectory', () => {
  it('returns the full roster for an empty query', () => {
    expect(filterDirectory(roster, '')).toHaveLength(roster.length)
  })

  it('filters by name', () => {
    const target = roster[0]
    const result = filterDirectory(roster, target.display_name)
    expect(result.some((e) => e.id === target.id)).toBe(true)
    expect(result.length).toBeLessThanOrEqual(roster.length)
  })

  it('filters by department, returning all members of that department', () => {
    // 'Development' is a clean department token — it is not a substring of any
    // seeded name or job title, so a department query returns exactly its members.
    const dept = 'Development'
    const expected = roster.filter((e) => e.department === dept)
    expect(expected.length).toBeGreaterThan(0)
    const result = filterDirectory(roster, dept)
    expect(result.map((e) => e.id).sort()).toEqual(
      expected.map((e) => e.id).sort(),
    )
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterDirectory(roster, 'definitely-not-a-real-person')).toEqual([])
  })
})
