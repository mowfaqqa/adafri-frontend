// components/modals/TwoFactorModal.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  operation?: string;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error = null,
  operation = "complete this action",
}) => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCode(["", "", "", "", "", ""]);
      setIsSubmitting(false);
      // Focus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newCode = [...code];

    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(fullCode);
    } catch (error) {
      // Error will be handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const fullCode = code.join("");
  const isComplete = fullCode.length === 6;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
                <p className="text-blue-100 text-sm">
                  Security verification required
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting || loading}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-2">
              Enter the 6-digit verification code from your authenticator app to{" "}
              {operation}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code input */}
            <div className="flex justify-center space-x-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el: any) => (inputRefs.current[index]! = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={cn(
                    "w-12 h-12 text-center text-xl font-bold border-2 rounded-xl",
                    "focus:outline-none focus:ring-0 transition-all duration-200",
                    digit
                      ? "border-blue-500 bg-blue-50 text-blue-900"
                      : "border-gray-300 hover:border-gray-400 focus:border-blue-500",
                    error && "border-red-300 bg-red-50"
                  )}
                  disabled={isSubmitting || loading}
                />
              ))}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!isComplete || isSubmitting || loading}
              className={cn(
                "w-full py-4 rounded-2xl font-semibold text-white transition-all duration-300 relative overflow-hidden",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "transform hover:scale-[1.02] active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                "shadow-lg hover:shadow-xl"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                {isSubmitting || loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    <span>Verify & Continue</span>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Help text */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Can't access your authenticator app?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  // Handle backup codes or support contact
                  console.log("Request backup method");
                }}
              >
                Use backup method
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorModal;
