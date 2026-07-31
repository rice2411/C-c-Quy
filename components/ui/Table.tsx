import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

export interface TableSectionProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  backgroundClassName?: string;
  borderClassName?: string;
  layoutClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  borderClassName?: string;
  hoverClassName?: string;
  layoutClassName?: string;
  stateClassName?: string;
  textClassName?: string;
}

export interface TableCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  hoverClassName?: string;
  layoutClassName?: string;
  stateClassName?: string;
  textClassName?: string;
}

export interface TableDataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  layoutClassName?: string;
  textClassName?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, children, ...props }, ref) => {
  const classes = twMerge(['w-full border-collapse text-left text-sm', className ?? ''].filter(Boolean).join(' '));
  return (
    <table ref={ref} className={classes} {...props}>
      {children}
    </table>
  );
});

const TableHead = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(
  (
    {
      backgroundClassName,
      borderClassName,
      layoutClassName,
      shadowClassName,
      stateClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Chuẩn app (theo bảng product): header slate-50, in đậm uppercase, dính đầu khi cuộn.
    const classes = twMerge(
      [
        'sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
        layoutClassName ?? '',
        backgroundClassName ?? '',
        borderClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    return (
      <thead ref={ref} className={classes} {...props}>
        {children}
      </thead>
    );
  },
);

const TableBody = React.forwardRef<HTMLTableSectionElement, TableSectionProps>(
  (
    {
      backgroundClassName,
      borderClassName,
      layoutClassName,
      shadowClassName,
      stateClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    // Hover row chuẩn app (chỉ áp cho row trong body, không đụng header).
    const classes = twMerge(
      [
        'divide-y divide-slate-100 dark:divide-slate-700 [&_tr]:transition-colors [&_tr:hover]:bg-slate-50 dark:[&_tr:hover]:bg-slate-800/40',
        layoutClassName ?? '',
        backgroundClassName ?? '',
        borderClassName ?? '',
        shadowClassName ?? '',
        stateClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    return (
      <tbody ref={ref} className={classes} {...props}>
        {children}
      </tbody>
    );
  },
);

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  (
    { borderClassName, hoverClassName, layoutClassName, stateClassName, textClassName, className, children, ...props },
    ref,
  ) => {
    const classes = twMerge(
      [
        layoutClassName ?? '',
        borderClassName ?? '',
        textClassName ?? '',
        hoverClassName ?? '',
        stateClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    return (
      <tr ref={ref} className={classes} {...props}>
        {children}
      </tr>
    );
  },
);

const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ hoverClassName, layoutClassName, stateClassName, textClassName, className, children, ...props }, ref) => {
    // Padding gọn chuẩn app (thay px-6 py-3 rộng cũ) — module vẫn override qua layoutClassName.
    const classes = twMerge(
      [
        'px-3 py-2.5 text-left',
        layoutClassName ?? '',
        textClassName ?? '',
        hoverClassName ?? '',
        stateClassName ?? '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    );
    return (
      <th ref={ref} className={classes} {...props}>
        {children}
      </th>
    );
  },
);

const TableCell = React.forwardRef<HTMLTableCellElement, TableDataCellProps>(
  ({ layoutClassName, textClassName, className, children, ...props }, ref) => {
    // Padding gọn chuẩn app (thay px-6 py-4 rộng cũ) — module vẫn override qua layoutClassName.
    const classes = twMerge(
      ['px-3 py-2.5 align-middle', layoutClassName ?? '', textClassName ?? '', className ?? ''].filter(Boolean).join(' '),
    );
    return (
      <td ref={ref} className={classes} {...props}>
        {children}
      </td>
    );
  },
);

Table.displayName = 'Table';
TableHead.displayName = 'TableHead';
TableBody.displayName = 'TableBody';
TableRow.displayName = 'TableRow';
TableHeaderCell.displayName = 'TableHeaderCell';
TableCell.displayName = 'TableCell';

export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
