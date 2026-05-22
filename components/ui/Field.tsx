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
          {required ? (
            <span
              aria-hidden="true"
              className="ml-0.5 text-red-500 dark:text-red-400"
            >
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      {hint && !error ? <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  );
};

export default Field;
