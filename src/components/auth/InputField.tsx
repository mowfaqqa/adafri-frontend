import React from "react";

interface InputFieldProps {
  id?: string;  // Add id property
  type?: string;
  placeholder?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  text?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  pattern?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,  // Include id in destructured props
  type = "text",
  placeholder = "",
  name,
  value,
  onChange,
  text,
  className = "",
  error = "",
  disabled = false,
  maxLength,
  inputMode,
  pattern,
}) => {
  return (
    <div>
      {text && <label htmlFor={id} className="block mb-1 text-sm font-medium">{text}</label>}
      <input
        id={id}  // Add id to input element
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        className={`w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""} ${className}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputField;