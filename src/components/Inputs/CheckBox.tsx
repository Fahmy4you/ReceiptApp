import React, { useId } from 'react';
import { LuCheck  } from 'react-icons/lu';

interface CheckboxProps {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked = false,
  onChange,
  disabled = false,
  className = "",
}) => {
  const id = useId();

  const handleToggle = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-start gap-3 group ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Input tersembunyi untuk aksesibilitas */}
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
        />
        
        {/* Kotak Visual Checkbox */}
        <div
          onClick={handleToggle}
          className={`
            w-6 h-6 rounded-md border-2 transition-all duration-200 cursor-pointer flex items-center justify-center
            /* Light Mode Styles */
            ${disabled ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' : ''}
            ${!disabled && checked ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200/50' : 'bg-white border-slate-300 hover:border-indigo-400'}
            
            /* Dark Mode Styles */
            dark:disabled:bg-slate-800 dark:disabled:border-slate-700
            ${!disabled && checked 
              ? 'dark:bg-indigo-500 dark:border-indigo-500 dark:shadow-indigo-900/40' 
              : 'dark:bg-slate-900 dark:border-slate-700 dark:hover:border-indigo-400'}
            
            ${!disabled && !checked ? 'group-hover:border-indigo-400' : ''}
          `}
        >
          {checked && (
            <LuCheck 
              size={16} 
              strokeWidth={3} 
              className="text-white animate-in zoom-in-50 duration-200" 
            />
          )}
        </div>
      </div>

      {/* Label dan Deskripsi */}
      <div className="flex flex-col select-none">
        <label
          htmlFor={id}
          className={`font-medium transition-colors cursor-pointer 
            ${disabled 
              ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed' 
              : 'text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
        >
          {label}
        </label>
        {description && (
          <p className={`text-sm 
            ${disabled 
              ? 'text-slate-300 dark:text-slate-700' 
              : 'text-slate-500 dark:text-slate-400'
            }`}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};