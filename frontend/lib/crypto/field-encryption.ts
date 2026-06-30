// Server-only field-level encryption for POPIA-sensitive data (ID, tax, banking,
// medical). App-layer AES-256-GCM: the database stores only ciphertext, the key
// lives in server env (`PULSE_FIELD_KEY`, never in the DB and never in the
// browser). So a database compromise alone does not reveal the data — an
// attacker also needs the app key. Authenticated encryption (GCM) also detects
// tampering on decrypt.
//
// Token format: `v1:<iv b64>:<tag b64>:<ciphertext b64>`.
import 'server-only'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const VERSION = 'v1'
const ALGO = 'aes-256-gcm'

function key(): Buffer {
  const b64 = process.env.PULSE_FIELD_KEY
  if (!b64) throw new Error('PULSE_FIELD_KEY is not set')
  const k = Buffer.from(b64, 'base64')
  if (k.length !== 32) {
    throw new Error('PULSE_FIELD_KEY must decode to 32 bytes (base64 of a 256-bit key)')
  }
  return k
}

/** Encrypt a non-empty string. Returns a self-describing token. */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    VERSION,
    iv.toString('base64'),
    tag.toString('base64'),
    enc.toString('base64'),
  ].join(':')
}

/** Decrypt a token produced by {@link encryptField}. Throws on tamper/wrong key. */
export function decryptField(token: string): string {
  const parts = token.split(':')
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('unrecognised encrypted field')
  }
  const [, ivB64, tagB64, encB64] = parts
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(encB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

/** Encrypt an optional value; null/empty passes through as null (nothing to hide). */
export function encryptOptional(value: string | null | undefined): string | null {
  return value == null || value === '' ? null : encryptField(value)
}

/** Decrypt an optional stored value; null/empty passes through as null. */
export function decryptOptional(value: string | null | undefined): string | null {
  return value == null || value === '' ? null : decryptField(value)
}
