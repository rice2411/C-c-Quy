import React from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disableVariantHover?: boolean;
  disableVariantTextColor?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  baseClassName?: string;
  layoutClassName?: string;
  sizeClassName?: string;
  variantClassName?: string;
  backgroundClassName?: string;
  textClassName?: string;
  roundedClassName?: string;
  shadowClassName?: string;
  stateClassName?: string;
  iconClassName?: string;
  hoverClassName?: string;
  borderClassName?: string;
  focusClassName?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent bg-primary-500",
  secondary:
    "border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800",
  danger:
    "border border-transparent bg-red-600",
  ghost:
    "border border-transparent bg-transparent",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-slate-700 dark:text-slate-300",
  danger: "text-white",
  ghost: "text-slate-700 dark:text-slate-300",
};

const variantHoverClasses: Record<ButtonVariant, string> = {
  primary: "hover:bg-primary-600",
  secondary: "hover:bg-slate-50 dark:hover:bg-slate-700",
  danger: "hover:bg-red-700",
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-700",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      disableVariantHover = false,
      disableVariantTextColor = false,
      leftIcon,
      rightIcon,
      baseClassName,
      layoutClassName,
      sizeClassName,
      variantClassName,
      backgroundClassName,
      textClassName,
      roundedClassName,
      shadowClassName,
      stateClassName,
      iconClassName,
      hoverClassName,
      borderClassName,
      focusClassName,
      className,
      children,
      type = "button",
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = twMerge(
      [
      "inline-flex items-center justify-center transition-colors",
      "focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "font-medium",
      "rounded-lg",
      "shadow-sm",
      "gap-2",
      sizeClasses[size],
      variantClasses[variant],
      disableVariantTextColor ? "" : variantTextClasses[variant],
      disableVariantHover ? "" : variantHoverClasses[variant],
      baseClassName ?? "",
      layoutClassName ?? "",
      sizeClassName ?? "",
      variantClassName ?? "",
      backgroundClassName ?? "",
      textClassName ?? "",
      roundedClassName ?? "",
      shadowClassName ?? "",
      stateClassName ?? "",
      hoverClassName ?? "",
      borderClassName ?? "",
      focusClassName ?? "",
      fullWidth ? "w-full" : "",
      className ?? "",
      ]
        .filter(Boolean)
        .join(" "),
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={classes}
        {...props}
      >
        {leftIcon ? <span className={iconClassName}>{leftIcon}</span> : null}
        {children}
        {rightIcon ? <span className={iconClassName}>{rightIcon}</span> : null}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
