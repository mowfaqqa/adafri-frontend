import React from "react";

interface InputFieldProps {
  type?: string;
  placeholder?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  text?: string;
  className?: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  type = "text",
  placeholder = "",
  name,
  value,
  onChange,
  text,
  className = "",
  error = "",
}) => {
  return (
    <div>
      {text && <label className="block mb-1 text-sm font-medium">{text}</label>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:outline-none ${
          error ? "border-red-500" : "border-gray-300"
        } ${className}`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default InputField;