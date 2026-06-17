import React, { useState, useRef, useEffect } from "react";
import { Search, Check } from "lucide-react";

export interface AutocompleteOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  maxResults?: number;
  filterFn?: (option: AutocompleteOption, searchValue: string) => boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  options,
  placeholder = "Search...",
  label,
  required = false,
  disabled = false,
  loading = false,
  className = "",
  maxResults = 5,
  filterFn,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectOption = (option: AutocompleteOption) => {
    onSelect(option);
    setShowDropdown(false);
  };

  const filteredOptions = options.filter((opt) => {
    if (!value.trim()) return true;
    if (filterFn) {
      return filterFn(opt, value);
    }
    return opt.label.toLowerCase().includes(value.toLowerCase());
  }).slice(0, maxResults);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          disabled={loading || disabled}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <ul className="py-1">
            {filteredOptions.map((option) => (
              <li
                key={option.id}
                onClick={() => handleSelectOption(option)}
                className="px-4 py-2 hover:bg-primary-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-400">
                      {option.label}
                    </p>
                    {option.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {option.subtitle}
                      </p>
                    )}
                  </div>
                  {option.label.toLowerCase() === value.toLowerCase() && (
                    <Check className="w-4 h-4 text-primary-500" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;

