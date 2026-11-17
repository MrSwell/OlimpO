import type { ReactNode } from 'react'
import { Table as astryxTable, type TableColumn } from '@astryxdesign/core'
import { cn } from '@/lib/cn'

const astryxComponents = { table: astryxTable }

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  align?: 'left' | 'right'
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  rows: T[]
  getRowKey: (row: T) => string | number
  className?: string
}

type TableRow = Record<string, unknown>

/**
 * Astryx Table provides the table semantics, column alignment and responsive
 * scroll wrapper; the v4 rules (1px lines, no fills) stay in our class names.
 */
export const dataTable = <T,>({ columns, rows, getRowKey, className }: DataTableProps<T>) => {
  const tableData = rows as unknown as TableRow[]
  const tableColumns = columns.map((column) => ({
    key: column.key,
    header: column.header,
    align: column.align === 'right' ? 'end' : 'start',
    renderCell: column.render as (row: TableRow) => ReactNode,
  })) as Array<TableColumn<TableRow>>

  return (
    <astryxComponents.table
      data={tableData}
      columns={tableColumns}
      idKey={getRowKey as (row: TableRow) => string | number}
      density="compact"
      dividers="rows"
      className={cn(
        'w-full border-collapse bg-transparent text-[13px] tabular-nums',
        '[&_th]:border-b [&_th]:border-line [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-[0.05em] [&_th]:text-faint',
        '[&_td]:border-b [&_td]:border-line [&_td]:py-3.5 [&_td]:align-baseline [&_td]:text-[13px]',
        '[&_tbody_tr:last-child_td]:border-b-0',
        className,
      )}
    />
  )
}
