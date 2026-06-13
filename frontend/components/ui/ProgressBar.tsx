export interface ProgressBarProps {
  /** Current value (used with `max`). Ignored if `percent` is provided. */
  value?: number
  /** Maximum value. Defaults to 100. */
  max?: number
  /** Explicit 0-100 percentage; overrides value/max if set. */
  percent?: number
  /** Optional label, e.g. "12/20". Rendered to the right of the track. */
  label?: string
  /** Track height in px. Defaults to 8. */
  height?: number
  /** Accessible name for the progress bar (set as aria-label). */
  ariaLabel?: string
  className?: string
}

/**
 * Horizontal progress bar with a jera-red fill and smooth width transition.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  percent,
  label,
  height = 8,
  ariaLabel,
  className = '',
}: ProgressBarProps) {
  const raw = percent ?? (max > 0 ? (value / max) * 100 : 0)
  const pct = Math.max(0, Math.min(100, raw))

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 overflow-hidden rounded-full bg-surface-border-light"
        style={{ height }}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-jera-red transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? <span className="flex-shrink-0 text-[11px] text-text-muted">{label}</span> : null}
    </div>
  )
}

export default ProgressBar
