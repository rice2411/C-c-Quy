import React from 'react';
import Label from '@/components/ui/Label';
import { twMerge } from 'tailwind-merge';

export interface FieldProps {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, htmlFor, required = false, hint, error, className, children }) => {
  const wrapperClassName = twMerge(['space-y-1', className ?? ''].filter(Boolean).join(' '));

  return (
    <div className={wrapperClassName}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? ' *' : ''}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
};

export default Field;
