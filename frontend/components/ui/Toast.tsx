'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'default' | 'success' | 'error'

export interface ToastOptions {
  /** Bold white title line. */
  title: string
  /** Optional grey body message. */
  message?: string
  /** Auto-dismiss delay in ms. Defaults to 5000. Pass 0 to disable auto-dismiss. */
  duration?: number
  /** Accent/border tone. `error` is also announced assertively. Defaults to `default`. */
  variant?: ToastVariant
}

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  default: 'border-l-jera-red',
  success: 'border-l-jera-green',
  error: 'border-l-jera-red',
}

interface ToastItem extends ToastOptions {
  id: number
}

interface ToastContextValue {
  /** Push a toast onto the top-right stack. Returns the toast id. */
  toast: (options: ToastOptions) => number
  /** Manually dismiss a toast by id. */
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 5000

export interface ToastProviderProps {
  children: ReactNode
}

/**
 * Provides the toast stack. Wrap the app once; consume via `useToast()`.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      idRef.current += 1
      const id = idRef.current
      const duration = options.duration ?? DEFAULT_DURATION
      setToasts((prev) => [...prev, { ...options, id }])
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[340px] flex-col gap-2">
        {toasts.map((t) => {
          const variant = t.variant ?? 'default'
          const isError = variant === 'error'
          return (
          <div
            key={t.id}
            className={`animate-notif-in pointer-events-auto flex items-start gap-[10px] rounded-[10px] border border-white/10 border-l-[3px] ${VARIANT_ACCENT[variant]} bg-surface-sidebar px-4 py-[14px] shadow-card-lg`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-[2px] text-xs font-bold text-white">{t.title}</div>
              {t.message ? (
                <div className="text-xs leading-[1.4] text-white/60">{t.message}</div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="flex-shrink-0 text-lg leading-none text-white/40 transition-colors hover:text-white/80"
            >
              &times;
            </button>
          </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Access the toast API. Must be called under a <ToastProvider>.
 * Usage: const { toast } = useToast(); toast({ title, message })
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}

export default ToastProvider
