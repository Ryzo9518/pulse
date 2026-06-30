// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest'
import { randomBytes } from 'node:crypto'

const KEY = randomBytes(32).toString('base64')

beforeAll(() => {
  process.env.PULSE_FIELD_KEY = KEY
})

async function mod() {
  return import('../field-encryption')
}

describe('field-encryption', () => {
  it('round-trips a value', async () => {
    const { encryptField, decryptField } = await mod()
    const plain = 'SA-ID 9001015800087 · Acc 62001234567'
    const token = encryptField(plain)
    expect(token.startsWith('v1:')).toBe(true)
    expect(token).not.toContain(plain)
    expect(decryptField(token)).toBe(plain)
  })

  it('produces different ciphertext each time (random IV)', async () => {
    const { encryptField } = await mod()
    expect(encryptField('x')).not.toBe(encryptField('x'))
  })

  it('detects tampering', async () => {
    const { encryptField, decryptField } = await mod()
    const token = encryptField('secret')
    const parts = token.split(':')
    const enc = Buffer.from(parts[3], 'base64')
    enc[0] ^= 0xff
    parts[3] = enc.toString('base64')
    await expect(async () => decryptField(parts.join(':'))).rejects.toThrow()
  })

  it('fails to decrypt under a different key', async () => {
    const { encryptField } = await mod()
    const token = encryptField('secret')
    process.env.PULSE_FIELD_KEY = randomBytes(32).toString('base64')
    const { decryptField } = await import('../field-encryption')
    await expect(async () => decryptField(token)).rejects.toThrow()
    process.env.PULSE_FIELD_KEY = KEY
  })

  it('passes null/empty through for optional helpers', async () => {
    const { encryptOptional, decryptOptional } = await mod()
    expect(encryptOptional(null)).toBeNull()
    expect(encryptOptional('')).toBeNull()
    expect(decryptOptional(null)).toBeNull()
    const { encryptField } = await mod()
    expect(decryptOptional(encryptField('hi'))).toBe('hi')
  })

  it('throws a clear error when the key is missing or wrong length', async () => {
    const prev = process.env.PULSE_FIELD_KEY
    delete process.env.PULSE_FIELD_KEY
    const { encryptField } = await import('../field-encryption')
    expect(() => encryptField('x')).toThrow(/PULSE_FIELD_KEY/)
    process.env.PULSE_FIELD_KEY = Buffer.from('short').toString('base64')
    expect(() => encryptField('x')).toThrow(/32 bytes/)
    process.env.PULSE_FIELD_KEY = prev
  })
})
