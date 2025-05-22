"use client";
import React, { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, X, ArrowRight, CreditCard, Check, AlertCircle } from "lucide-react";

interface MobilePaymentProvider {
  id: string;
  name: string;
  logoSrc: string;
}

interface MobileMoneySectionProps {
  providers?: MobilePaymentProvider[];
  className?: string;
}

interface NotificationProps {
  message: string;
  type: "success" | "info" | "warning" | "error";
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`
        rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-md
        ${type === "success" ? "bg-green-50 border border-green-200" : 
           type === "error" ? "bg-red-50 border border-red-200" : 
           "bg-blue-50 border border-blue-200"}
      `}>
        <div className={`
          rounded-full p-1 flex items-center justify-center
          ${type === "success" ? "bg-green-100 text-green-600" : 
             type === "error" ? "bg-red-100 text-red-600" : 
             "bg-blue-100 text-blue-600"}
        `}>
          {type === "success" ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const MobileMoneySection: React.FC<MobileMoneySectionProps> = ({
  providers = [
    { id: "orange-money", name: "Orange Money", logoSrc: "/icons/orangemoney.png" },
    { id: "moov", name: "Moov", logoSrc: "/icons/wave.png" },
    { id: "mtn", name: "MTN", logoSrc: "/icons/mtn.png" },
    { id: "mpesa", name: "M-PESA", logoSrc: "/icons/mipesa.png" },
  ],
  className = ""
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<MobilePaymentProvider | null>(null);
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "info" | "warning" | "error";
  }>({ show: false, message: "", type: "success" });
  
  const handleProviderClick = (provider: MobilePaymentProvider) => {
    setSelectedProvider(provider);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset form data when closing modal
    setTimeout(() => {
      setSelectedProvider(null);
      setAmount("");
      setPhoneNumber("");
    }, 300);
  };

  const showNotification = (message: string, type: "success" | "info" | "warning" | "error") => {
    setNotification({ show: true, message, type });
    
    // Auto-hide notification after 4 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would handle the actual payment processing
    console.log("Processing payment:", {
      provider: selectedProvider?.name,
      amount,
      phoneNumber
    });
    
    // Show success notification
    handleCloseModal();
    showNotification(`Payment request sent to ${selectedProvider?.name}`, "success");
  };
  
  const handleMoreOptions = () => {
    // Open options modal instead of showing alert
    setIsOptionsModalOpen(true);
  };

  return (
    <>
      <div className={`bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm ${className}`}>
        <h3 className="text-gray-900 font-medium mb-4">Charge your card by Mobile Money</h3>
        
        <div className="flex flex-wrap items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-grow">
            {providers.map((provider) => (
              <div 
                key={provider.id} 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleProviderClick(provider)}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-1">
                  <Image
                    src={provider.logoSrc}
                    alt={provider.name}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="text-xs text-gray-600 text-center">{provider.name}</span>
              </div>
            ))}
          </div>
          
          <button 
            className="text-gray-400 hover:text-gray-600 ml-2"
            onClick={handleMoreOptions}
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Money Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
             role="dialog" 
             aria-modal="true"
             onClick={(e) => {
               if (e.target === e.currentTarget) handleCloseModal();
             }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full animate-fade-in" 
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {selectedProvider && (
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <Image
                      src={selectedProvider.logoSrc}
                      alt={selectedProvider.name}
                      width={16}
                      height={16}
                      className="object-contain"
                    />
                  </div>
                )}
                <h3 className="font-medium text-gray-900">
                  {selectedProvider?.name} Payment
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="text"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="px-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the phone number connected to your {selectedProvider?.name} account
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Service Fee:</span>
                  <span className="text-sm font-medium">$0.50</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-gray-600">You'll Pay:</span>
                  <span className="text-sm font-medium">
                    ${amount ? (parseFloat(amount) + 0.5).toFixed(2) : "0.50"}
                  </span>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            
            <div className="p-4 border-t border-gray-200 flex items-center justify-center space-x-2">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Secure payment processed by {selectedProvider?.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* More Options Modal */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
             role="dialog"
             aria-modal="true"
             onClick={(e) => {
               if (e.target === e.currentTarget) setIsOptionsModalOpen(false);
             }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full animate-fade-in"
               onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">More Payment Options</h3>
              <button 
                onClick={() => setIsOptionsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <p className="text-gray-600 mb-4">Additional payment methods are coming soon!</p>
              <div className="flex justify-center text-gray-400 space-x-3">
                <CreditCard className="w-8 h-8" />
                <CreditCard className="w-8 h-8" />
                <CreditCard className="w-8 h-8" />
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">We're working on integrating more payment options to serve you better.</p>
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsOptionsModalOpen(false)}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <Notification 
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(prev => ({ ...prev, show: false }))}
        />
      )}

      {/* Add animations to your global CSS or tailwind config */}
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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </>
  );
};