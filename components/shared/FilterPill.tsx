/**
 * FilterPill — dropdown select dạng pill cho filter.
 * Click toàn bộ label/chip đều mở dropdown (qua <label> wrap).
 */
import React from 'react';

interface FilterPillProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, value, options, onChange }) => {
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;
  const isAll = value === 'all' || value === '';

  return (
    <label
      className={`group relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs shadow-sm transition-colors ${
        isAll
          ? 'border-slate-200 bg-white hover:border-primary-300 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-primary-500'
          : 'border-primary-300 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/30'
      }`}
    >
      <span className="font-medium text-slate-500 dark:text-slate-400">{label}:</span>
      <span
        className={`font-semibold ${
          isAll ? 'text-slate-700 dark:text-slate-200' : 'text-primary-700 dark:text-primary-300'
        }`}
      >
        {currentLabel}
      </span>
      <svg
        className="h-3 w-3 text-slate-400 transition-transform group-hover:text-slate-600 dark:text-slate-500"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent opacity-0 dark:[color-scheme:dark]"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default FilterPill;
