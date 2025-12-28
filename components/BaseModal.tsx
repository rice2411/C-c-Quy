import React from 'react';
import { X } from 'lucide-react';
import { useFadeAnimation } from '@/hooks/useFadeAnimation';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isFadeAnimation?: boolean;
}

const BaseModal: React.FC<BaseModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  size = 'md',
  isFadeAnimation = false
}) => {
  const { show, isAnimating } = useFadeAnimation(isOpen, isFadeAnimation);

  if (!show && !isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
        
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            isFadeAnimation 
              ? (isAnimating ? 'opacity-100' : 'opacity-0')
              : (isOpen ? 'opacity-100' : 'opacity-0')
          }`}
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal Panel */}
        <div 
          className={`relative transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all duration-300 ease-out sm:my-8 w-full ${sizeClasses[size]} ${
            isFadeAnimation
              ? (isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95')
              : (isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95')
          }`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white" id="modal-title">
              {title}
            </h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 bg-white dark:bg-slate-800">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;