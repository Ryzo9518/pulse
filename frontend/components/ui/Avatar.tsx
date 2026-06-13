import { AVATAR_COLOURS } from '@/lib/constants'

export type AvatarSize = 'sm' | 'md' | 'lg'

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-[22px]',
}

export interface AvatarProps {
  /** Full name — used to derive initials when `initials` is absent, and a colour when `color` is absent. */
  name?: string
  /** Explicit initials (e.g. "RD"). Overrides name-derived initials. */
  initials?: string
  /** Background colour (hex, typically from AVATAR_COLOURS). Falls back to a name-derived palette colour. */
  color?: string
  size?: AvatarSize
  className?: string
}

function deriveInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function deriveColor(name?: string): string {
  if (!name) return AVATAR_COLOURS[0]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length]
}

/**
 * Circular initials avatar. Mono font, colour from prop or name-derived.
 */
export function Avatar({ name, initials, color, size = 'md', className = '' }: AvatarProps) {
  const text = initials ?? deriveInitials(name)
  const bg = color ?? deriveColor(name)
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-full font-mono font-bold text-white ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {text}
    </span>
  )
}

export default Avatar
