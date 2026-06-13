import type { Key, ReactNode } from 'react'

export interface DataTableColumn<T> {
  /** Stable column key. */
  key: string
  /** Header label (rendered uppercase). */
  header: ReactNode
  /** Cell renderer for a row. */
  render: (row: T, index: number) => ReactNode
  /** Optional cell alignment. */
  align?: 'left' | 'center' | 'right'
  /** Optional fixed/min width applied to the cell. */
  className?: string
}

export type DataTableHeaderTone = 'dark' | 'red'

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Derives a stable React key per row. Defaults to the array index. */
  rowKey?: (row: T, index: number) => Key
  /** Header background tone. `dark` = sidebar, `red` = jera-red. Defaults to dark. */
  headerTone?: DataTableHeaderTone
  /** Optional click handler per row. */
  onRowClick?: (row: T, index: number) => void
  /** Accessible label for an interactive row (used with `onRowClick`). Falls back to "Row {index+1}". */
  rowLabel?: (row: T, index: number) => string
  /** Rendered (spanning all columns) when there are no rows. */
  emptyMessage?: ReactNode
  className?: string
}

const ALIGN_CLASS: Record<NonNullable<DataTableColumn<unknown>['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * Generic table with a dark/red uppercase header (rounded outer header cells),
 * alternating row backgrounds, and 13px body text.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  headerTone = 'dark',
  onRowClick,
  rowLabel,
  emptyMessage = 'No records to display.',
  className = '',
}: DataTableProps<T>) {
  const headerBg = headerTone === 'red' ? 'bg-jera-red' : 'bg-surface-sidebar'

  return (
    <table className={`w-full border-separate border-spacing-0 ${className}`}>
      <thead>
        <tr>
          {columns.map((col, i) => {
            const first = i === 0
            const last = i === columns.length - 1
            return (
              <th
                key={col.key}
                className={`${headerBg} px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-white ${
                  ALIGN_CLASS[col.align ?? 'left']
                } ${first ? 'rounded-l-btn' : ''} ${last ? 'rounded-r-btn' : ''}`}
              >
                {col.header}
              </th>
            )
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              className="px-4 py-8 text-center text-[13px] text-text-muted"
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, rIdx) => (
            <tr
              key={rowKey ? rowKey(row, rIdx) : rIdx}
              onClick={onRowClick ? () => onRowClick(row, rIdx) : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row, rIdx)
                      }
                    }
                  : undefined
              }
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={
                onRowClick ? (rowLabel ? rowLabel(row, rIdx) : `Row ${rIdx + 1}`) : undefined
              }
              className={`${rIdx % 2 === 1 ? '[&>td]:bg-surface' : ''} ${
                onRowClick ? 'cursor-pointer hover:[&>td]:bg-jera-blue-light' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`border-b border-surface-border-light px-4 py-3 align-middle text-[13px] text-text ${
                    ALIGN_CLASS[col.align ?? 'left']
                  } ${col.className ?? ''}`}
                >
                  {col.render(row, rIdx)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

export default DataTable
