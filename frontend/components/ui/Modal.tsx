'use client'

import { useEffect, type ReactNode } from 'react'

export type ModalMaxWidth = 'sm' | 'md' | 'lg'

const MAX_WIDTH_CLASS: Record<ModalMaxWidth, string> = {
  sm: 'max-w-[420px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[680px]',
}

export interface ModalProps {
  /** Whether the modal is mounted/visible. */
  open: boolean
  /** Called on ESC, overlay click, or close-button click. */
  onClose: () => void
  /** Modal heading. */
  title?: ReactNode
  /** Optional uppercase eyebrow above the title. */
  eyebrow?: ReactNode
  /** Body content. */
  children: ReactNode
  /** Optional footer (e.g. action buttons). */
  footer?: ReactNode
  /** Max width of the card. Defaults to md (520px). */
  maxWidth?: ModalMaxWidth
  className?: string
}

/**
 * Centered modal dialog over a blurred dark overlay. Closes on ESC and overlay click.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  maxWidth = 'md',
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`animate-fade-up w-full overflow-hidden rounded-card bg-surface-card shadow-card-lg ${MAX_WIDTH_CLASS[maxWidth]} ${className}`}
      >
        {(title || eyebrow) ? (
          <div className="flex items-start justify-between gap-4 px-7 pt-6">
            <div>
              {eyebrow ? (
                <div className="mb-[6px] text-[11px] uppercase tracking-[2px] text-text-muted">
                  {eyebrow}
                </div>
              ) : null}
              {title ? <h2 className="text-xl font-extrabold text-text">{title}</h2> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 flex-shrink-0 text-2xl leading-none text-text-muted transition-colors hover:text-text"
            >
              &times;
            </button>
          </div>
        ) : null}
        <div className="px-7 py-6">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-3 border-t border-surface-border px-7 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Modal
