import React from "react";
import { X } from "lucide-react";
import { useSlideAnimation } from "@/hooks/useSlideAnimation";

interface BaseSlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3/4" | "full";
  headerContent?: React.ReactNode;
  footer?: React.ReactNode;
}

const BaseSlidePanel: React.FC<BaseSlidePanelProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "xl",
  headerContent,
  footer,
}) => {
  const { show, isClosing } = useSlideAnimation(isOpen);

  if (!show && !isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3/4": "w-3/4",
    full: "w-full",
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      style={{ marginTop: 0 }}
    >
      <div
        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`absolute inset-y-0 right-0 ${
          maxWidth === "full" || maxWidth === "3/4"
            ? maxWidthClasses[maxWidth]
            : `${maxWidthClasses[maxWidth]} w-full`
        } flex pointer-events-none`}
      >
        <div
          className={`w-full h-full bg-white dark:bg-slate-800 shadow-2xl flex flex-col pointer-events-auto transition-colors duration-200 ${
            isClosing ? "animate-slide-out-right" : "animate-slide-in-right"
          }`}
        >
          {(title || headerContent) && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 flex-shrink-0">
              {headerContent || (
                <>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
                    aria-label="Close panel"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">{children}</div>

          {footer && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseSlidePanel;
