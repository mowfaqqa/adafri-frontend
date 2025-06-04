"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  X, 
  ArrowRight, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Loader2, 
  Shield,
  Info
} from "lucide-react";

interface MobilePaymentProvider {
  id: string;
  name: string;
  logoSrc: string;
  flutterwaveCode: string;
  color: string;
  supportedCountries: string[];
}

interface MobileMoneySectionProps {
  providers?: MobilePaymentProvider[];
  className?: string;
  publicKey: string;
  currency?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentInitiated?: (data: any) => void;
}

interface NotificationProps {
  message: string;
  type: "success" | "info" | "warning" | "error";
  onClose: () => void;
}

interface FormData {
  selectedProvider: string;
  amount: string;
  phoneNumber: string;
  email: string;
  fullName: string;
}

interface FormErrors {
  selectedProvider?: string;
  amount?: string;
  phoneNumber?: string;
  email?: string;
  fullName?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up max-w-sm">
      <div className={`rounded-lg shadow-lg p-4 flex items-start space-x-3 border ${getNotificationStyles()}`}>
        <div className={`flex-shrink-0 ${getIconColor()}`}>
          {type === "success" ? (
            <Check className="w-5 h-5" />
          ) : type === "error" ? (
            <AlertCircle className="w-5 h-5" />
          ) : type === "warning" ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <Info className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const MobileMoneySection: React.FC<MobileMoneySectionProps> = ({
  providers = [
    { 
      id: "orange-money", 
      name: "Orange Money", 
      logoSrc: "/icons/orangemoney.png", 
      flutterwaveCode: "orange",
      color: "bg-orange-500",
      supportedCountries: ["CI", "SN", "ML", "BF", "NE"]
    },
    { 
      id: "moov", 
      name: "Moov Money", 
      logoSrc: "/icons/wave.png", 
      flutterwaveCode: "moov",
      color: "bg-blue-500",
      supportedCountries: ["CI", "BF", "TG", "BJ"]
    },
    { 
      id: "mtn", 
      name: "MTN Mobile Money", 
      logoSrc: "/icons/mtn.png", 
      flutterwaveCode: "mtn",
      color: "bg-yellow-500",
      supportedCountries: ["GH", "UG", "RW", "ZM", "CI"]
    },
    { 
      id: "mpesa", 
      name: "M-PESA", 
      logoSrc: "/icons/mipesa.png", 
      flutterwaveCode: "mpesa",
      color: "bg-green-600",
      supportedCountries: ["KE", "TZ", "MZ", "DRC"]
    },
  ],
  className = "",
  publicKey,
  currency = "USD",
  onPaymentSuccess,
  onPaymentError,
  onPaymentInitiated
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  
  const [formData, setFormData] = useState<FormData>({
    selectedProvider: "",
    amount: "",
    phoneNumber: "",
    email: "",
    fullName: ""
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info" | "warning" | "error";
  }>({ show: false, message: "", type: "success" });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!formData.selectedProvider) {
      errors.selectedProvider = "Please select a payment provider";
    }
    
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!formData.amount.trim()) {
      errors.amount = "Amount is required";
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = "Please enter a valid amount";
      } else if (amount < 1) {
        errors.amount = "Minimum amount is $1.00";
      } else if (amount > 10000) {
        errors.amount = "Maximum amount is $10,000.00";
      }
    }
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[\d\s\-\(\)]{8,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = "Please enter a valid phone number";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showNotification = (message: string, type: "success" | "info" | "warning" | "error") => {
    setNotification({ show: true, message, type });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const generateTransactionRef = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `txn_${timestamp}_${random}`;
  };

  const calculateTotal = (): number => {
    const amount = parseFloat(formData.amount) || 0;
    const processingFee = amount * 0.015; // 1.5% processing fee
    return amount + processingFee;
  };

  const getSelectedProvider = () => {
    return providers.find(p => p.flutterwaveCode === formData.selectedProvider);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setStep('form');
  };

  const handleCloseModal = () => {
    if (isProcessing) return; // Prevent closing during processing
    
    setIsModalOpen(false);
    setIsProcessing(false);
    setStep('form');
    
    // Reset form data after animation
    setTimeout(() => {
      setFormData({
        selectedProvider: "",
        amount: "",
        phoneNumber: "",
        email: "",
        fullName: ""
      });
      setFormErrors({});
    }, 300);
  };

  const initiateFlutterwavePayment = async (): Promise<any> => {
    const selectedProviderData = getSelectedProvider();
    
    const paymentData = {
      public_key: publicKey,
      tx_ref: generateTransactionRef(),
      amount: parseFloat(formData.amount),
      currency: currency,
      payment_options: "mobilemoney",
      customer: {
        email: formData.email,
        phone_number: formData.phoneNumber,
        name: formData.fullName,
      },
      customizations: {
        title: "Mobile Money Payment",
        description: `Payment via ${selectedProviderData?.name || 'Mobile Money'}`,
        logo: selectedProviderData?.logoSrc,
      },
      meta: {
        mobile_money_provider: formData.selectedProvider,
        amount: formData.amount,
        currency: currency
      },
    };

    // Call your API endpoint
    const response = await fetch('/api/flutterwave/initiate-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicKey}`
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showNotification("Please correct the errors in the form", "error");
      return;
    }

    setIsProcessing(true);
    setStep('processing');

    try {
      const result = await initiateFlutterwavePayment();

      if (result.status === 'success') {
        // Dispatch event to update balance
        const paymentSuccessEvent = new CustomEvent('paymentSuccess', {
          detail: { 
            amount: parseFloat(formData.amount),
            provider: formData.selectedProvider,
            transactionRef: result.data?.tx_ref
          }
        });
        window.dispatchEvent(paymentSuccessEvent);

        // Handle payment link
        if (result.data?.link) {
          window.open(result.data.link, '_blank');
        }

        setStep('success');
        showNotification(
          `Payment initiated successfully via ${getSelectedProvider()?.name || 'Mobile Money'}`, 
          "success"
        );

        // Call success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }

        // Call initiated callback
        if (onPaymentInitiated) {
          onPaymentInitiated({
            amount: parseFloat(formData.amount),
            provider: formData.selectedProvider,
            transactionRef: result.data?.tx_ref
          });
        }

        // Auto close after success
        setTimeout(() => {
          handleCloseModal();
        }, 3000);

      } else {
        throw new Error(result.message || 'Payment initiation failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('form');
      
      const errorMessage = error.message || 'Payment failed. Please try again.';
      showNotification(errorMessage, "error");
      
      if (onPaymentError) {
        onPaymentError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div 
        className={`bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group ${className}`}
        onClick={handleOpenModal}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-600 font-medium text-sm">Mobile Money Payment</h3>
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        
        {/* <p className="text-gray-600 text-sm mb-6">
          Pay securely using your mobile money account from supported providers
        </p> */}
        
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-grow">
            {providers.map((provider) => (
              <div 
                key={provider.id} 
                className="flex flex-col items-center group-hover:scale-105 transition-transform duration-200"
              >
                <div className={`w-12 h-12 rounded-xl ${provider.color} bg-opacity-10 flex items-center justify-center mb-2 border border-gray-100`}>
                  <Image
                    src={provider.logoSrc}
                    alt={provider.name}
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {provider.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* <div className="text-blue-600 ml-6 group-hover:translate-x-1 transition-transform duration-200">
            <ArrowRight className="w-6 h-6" />
          </div> */}
        </div>
      </div>

      {/* Enhanced Payment Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isProcessing) handleCloseModal();
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-modal-enter" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {step === 'processing' ? 'Processing Payment' : 
                   step === 'success' ? 'Payment Successful' : 
                   'Mobile Money Payment'}
                </h3>
                {step === 'form' && (
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your details to proceed
                  </p>
                )}
              </div>
              {!isProcessing && step !== 'success' && (
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {step === 'processing' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Processing your payment...
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Please wait while we initiate your mobile money transaction
                  </p>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Payment Initiated!
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Your mobile money payment has been initiated successfully.
                  </p>
                  <p className="text-xs text-gray-500">
                    This window will close automatically
                  </p>
                </div>
              )}

              {step === 'form' && (
                <form onSubmit={handlePaymentSubmit} className="space-y-5">
                  {/* Provider Selection */}
                  <div>
                    <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Provider *
                    </label>
                    <select
                      id="provider"
                      value={formData.selectedProvider}
                      onChange={(e) => handleInputChange('selectedProvider', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.selectedProvider ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Choose your mobile money provider</option>
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.flutterwaveCode}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.selectedProvider && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.selectedProvider}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                      required
                    />
                    {formErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                      required
                    />
                    {formErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                      Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-medium">
                        {currency === 'USD' ? '$' : currency}
                      </span>
                      <input
                        type="number"
                        id="amount"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          formErrors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                        min="1"
                        max="10000"
                        step="0.01"
                        required
                      />
                    </div>
                    {formErrors.amount && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.amount}</p>
                    )}
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                        formErrors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter your mobile money number"
                      required
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Use the phone number registered with your mobile money account
                    </p>
                  </div>
                  
                  {/* Cost Breakdown */}
                  {formData.amount && !formErrors.amount && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{currency === 'USD' ? '$' : currency}{parseFloat(formData.amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Processing Fee (1.5%):</span>
                        <span className="font-medium">
                          {currency === 'USD' ? '$' : currency}{(parseFloat(formData.amount) * 0.015).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">Total:</span>
                          <span className="font-bold text-lg">
                            {currency === 'USD' ? '$' : currency}{calculateTotal().toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium transition-colors"
                  >
                    <span>Initiate Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
            
            {/* Modal Footer */}
            {step === 'form' && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secured by Flutterwave</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Enhanced Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-modal-enter {
          animation: modalEnter 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

















































// "use client";
// import React, { useState } from "react";
// import Image from "next/image";
// import { MoreHorizontal, X, ArrowRight, CreditCard, Check, AlertCircle } from "lucide-react";

// interface MobilePaymentProvider {
//   id: string;
//   name: string;
//   logoSrc: string;
// }

// interface MobileMoneySectionProps {
//   providers?: MobilePaymentProvider[];
//   className?: string;
// }

// interface NotificationProps {
//   message: string;
//   type: "success" | "info" | "warning" | "error";
//   onClose: () => void;
// }

// const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
//   return (
//     <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
//       <div className={`
//         rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md
//         ${type === "success" ? "bg-green-50 border border-green-200" : 
//            type === "error" ? "bg-red-50 border border-red-200" : 
//            "bg-blue-50 border border-blue-200"}
//       `}>
//         <div className={`
//           rounded-full p-1 flex items-center justify-center
//           ${type === "success" ? "bg-green-100 text-green-600" : 
//              type === "error" ? "bg-red-100 text-red-600" : 
//              "bg-blue-100 text-blue-600"}
//         `}>
//           {type === "success" ? (
//             <Check className="w-4 h-4" />
//           ) : (
//             <AlertCircle className="w-4 h-4" />
//           )}
//         </div>
//         <div className="flex-1">
//           <p className="text-sm font-medium text-gray-800">{message}</p>
//         </div>
//         <button 
//           onClick={onClose}
//           className="text-gray-400 hover:text-gray-600"
//         >
//           <X className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// };

// export const MobileMoneySection: React.FC<MobileMoneySectionProps> = ({
//   providers = [
//     { id: "orange-money", name: "Orange Money", logoSrc: "/icons/orangemoney.png" },
//     { id: "moov", name: "Moov", logoSrc: "/icons/wave.png" },
//     { id: "mtn", name: "MTN", logoSrc: "/icons/mtn.png" },
//     { id: "mpesa", name: "M-PESA", logoSrc: "/icons/mipesa.png" },
//   ],
//   className = ""
// }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
//   const [selectedProvider, setSelectedProvider] = useState<MobilePaymentProvider | null>(null);
//   const [amount, setAmount] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [notification, setNotification] = useState<{
//     show: boolean;
//     message: string;
//     type: "success" | "info" | "warning" | "error";
//   }>({ show: false, message: "", type: "success" });
  
//   const handleProviderClick = (provider: MobilePaymentProvider) => {
//     setSelectedProvider(provider);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     // Reset form data when closing modal
//     setTimeout(() => {
//       setSelectedProvider(null);
//       setAmount("");
//       setPhoneNumber("");
//     }, 300);
//   };

//   const showNotification = (message: string, type: "success" | "info" | "warning" | "error") => {
//     setNotification({ show: true, message, type });
    
//     // Auto-hide notification after 4 seconds
//     setTimeout(() => {
//       setNotification(prev => ({ ...prev, show: false }));
//     }, 4000);
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Here you would handle the actual payment processing
//     console.log("Processing payment:", {
//       provider: selectedProvider?.name,
//       amount,
//       phoneNumber
//     });
    
//     // Show success notification
//     handleCloseModal();
//     showNotification(`Payment request sent to ${selectedProvider?.name}`, "success");
//   };
  
//   const handleMoreOptions = () => {
//     // Open options modal instead of showing alert
//     setIsOptionsModalOpen(true);
//   };

//   return (
//     <>
//       <div className={`bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm ${className}`}>
//         <h3 className="text-gray-900 font-medium mb-4">Charge your card by Mobile Money</h3>
        
//         <div className="flex flex-wrap items-center justify-between">
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-grow">
//             {providers.map((provider) => (
//               <div 
//                 key={provider.id} 
//                 className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
//                 onClick={() => handleProviderClick(provider)}
//               >
//                 <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1">
//                   <Image
//                     src={provider.logoSrc}
//                     alt={provider.name}
//                     width={24}
//                     height={24}
//                     className="object-contain"
//                   />
//                 </div>
//                 <span className="text-xs text-gray-600 text-center">{provider.name}</span>
//               </div>
//             ))}
//           </div>
          
//           <button 
//             className="text-gray-400 hover:text-gray-600 ml-2"
//             onClick={handleMoreOptions}
//           >
//             <MoreHorizontal className="w-5 h-5" />
//           </button>
//         </div>
//       </div>

//       {/* Mobile Money Payment Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
//              role="dialog" 
//              aria-modal="true"
//              onClick={(e) => {
//                if (e.target === e.currentTarget) handleCloseModal();
//              }}>
//           <div className="bg-white rounded-lg shadow-lg max-w-md w-full animate-fade-in" 
//                onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <div className="flex items-center space-x-3">
//                 {selectedProvider && (
//                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
//                     <Image
//                       src={selectedProvider.logoSrc}
//                       alt={selectedProvider.name}
//                       width={16}
//                       height={16}
//                       className="object-contain"
//                     />
//                   </div>
//                 )}
//                 <h3 className="font-medium text-gray-900">
//                   {selectedProvider?.name} Payment
//                 </h3>
//               </div>
//               <button 
//                 onClick={handleCloseModal}
//                 className="text-gray-400 hover:text-gray-600"
//                 aria-label="Close"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
            
//             <form onSubmit={handleSubmit} className="p-4">
//               <div className="mb-4">
//                 <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
//                   Amount
//                 </label>
//                 <div className="relative">
//                   <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
//                   <input
//                     type="text"
//                     id="amount"
//                     value={amount}
//                     onChange={(e) => setAmount(e.target.value)}
//                     className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//                     placeholder="0.00"
//                     required
//                   />
//                 </div>
//               </div>
              
//               <div className="mb-6">
//                 <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
//                   Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   id="phoneNumber"
//                   value={phoneNumber}
//                   onChange={(e) => setPhoneNumber(e.target.value)}
//                   className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//                   placeholder="Enter your phone number"
//                   required
//                 />
//                 <p className="mt-1 text-xs text-gray-500">
//                   Enter the phone number connected to your {selectedProvider?.name} account
//                 </p>
//               </div>
              
//               <div className="p-4 bg-gray-50 rounded-md mb-4">
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600">Service Fee:</span>
//                   <span className="text-sm font-medium">$0.50</span>
//                 </div>
//                 <div className="flex justify-between items-center mt-1">
//                   <span className="text-sm text-gray-600">You'll Pay:</span>
//                   <span className="text-sm font-medium">
//                     ${amount ? (parseFloat(amount) + 0.5).toFixed(2) : "0.50"}
//                   </span>
//                 </div>
//               </div>
              
//               <button
//                 type="submit"
//                 className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
//               >
//                 <span>Proceed to Payment</span>
//                 <ArrowRight className="w-4 h-4" />
//               </button>
//             </form>
            
//             <div className="p-4 border-t border-gray-200 flex items-center justify-center space-x-2">
//               <CreditCard className="w-4 h-4 text-gray-500" />
//               <span className="text-sm text-gray-500">Secure payment processed by {selectedProvider?.name}</span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* More Options Modal */}
//       {isOptionsModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
//              role="dialog"
//              aria-modal="true"
//              onClick={(e) => {
//                if (e.target === e.currentTarget) setIsOptionsModalOpen(false);
//              }}>
//           <div className="bg-white rounded-lg shadow-lg max-w-md w-full animate-fade-in"
//                onClick={(e) => e.stopPropagation()}>
//             <div className="flex items-center justify-between p-4 border-b border-gray-200">
//               <h3 className="font-medium text-gray-900">More Payment Options</h3>
//               <button 
//                 onClick={() => setIsOptionsModalOpen(false)}
//                 className="text-gray-400 hover:text-gray-600"
//                 aria-label="Close"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>
            
//             <div className="p-4">
//               <p className="text-gray-600 mb-4">Additional payment methods are coming soon!</p>
//               <div className="flex justify-center text-gray-400 space-x-3">
//                 <CreditCard className="w-8 h-8" />
//                 <CreditCard className="w-8 h-8" />
//                 <CreditCard className="w-8 h-8" />
//               </div>
//               <p className="text-center text-sm text-gray-500 mt-4">We're working on integrating more payment options to serve you better.</p>
//             </div>
            
//             <div className="p-4 border-t border-gray-200">
//               <button
//                 onClick={() => setIsOptionsModalOpen(false)}
//                 className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Notification */}
//       {notification.show && (
//         <Notification 
//           message={notification.message}
//           type={notification.type}
//           onClose={() => setNotification(prev => ({ ...prev, show: false }))}
//         />
//       )}

//       {/* Add animations to your global CSS or tailwind config */}
//       <style jsx global>{`
//         @keyframes slideUp {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }
        
//         @keyframes fadeIn {
//           from {
//             opacity: 0;
//           }
//           to {
//             opacity: 1;
//           }
//         }
        
//         .animate-slide-up {
//           animation: slideUp 0.3s ease-out forwards;
//         }
        
//         .animate-fade-in {
//           animation: fadeIn 0.2s ease-out forwards;
//         }
//       `}</style>
//     </>
//   );
// };