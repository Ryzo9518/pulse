import type { ReactNode } from 'react'

export interface AuthCardProps {
  /** Logo glyph rendered inside the red square (e.g. 'P', an emoji, or a node). */
  glyph: ReactNode
  title: string
  subtitle: string
  children: ReactNode
}

/**
 * White auth card shell shared across login / 2FA / forgot screens.
 * Matches the prototype `.auth-card` + `.auth-logo` markup: 420px max width,
 * 20px radius, generous padding, red logo square with a white glyph.
 */
export function AuthCard({ glyph, title, subtitle, children }: AuthCardProps) {
  return (
    <div className="animate-fade-up relative z-[1] w-full max-w-[420px] rounded-[20px] bg-white px-10 py-11 shadow-[0_20px_60px_#00000030]">
      <div className="mb-8 text-center">
        <div className="mb-[14px] inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-jera-red shadow-[0_4px_20px_#91143140]">
          <span className="text-2xl font-black text-white">{glyph}</span>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-text">{title}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

export default AuthCard
