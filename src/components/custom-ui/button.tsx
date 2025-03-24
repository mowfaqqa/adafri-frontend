import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  // Base classes
  const baseClasses =
    "relative flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Size-specific classes
  const sizeClasses = {
    sm: "text-sm px-3 py-1",
    md: "text-base px-4 py-2",
    lg: "text-lg px-6 py-3",
  };

  // Variant-specific classes
  const variantClasses = {
    primary:
      "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 disabled:bg-emerald-300",
    secondary:
      "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 disabled:bg-red-300",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-300",
  };

  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";

  // Disabled and loading states
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        ${baseClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${widthClasses}
        ${isDisabled ? "cursor-not-allowed" : ""}
        ${className || ""}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-5 w-5 animate-spin text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}

      <span className={isLoading ? "invisible" : "flex items-center gap-2"}>
        {leftIcon && <span>{leftIcon}</span>}
        {children}
        {rightIcon && <span>{rightIcon}</span>}
      </span>
    </button>
  );
};

export default Button;
