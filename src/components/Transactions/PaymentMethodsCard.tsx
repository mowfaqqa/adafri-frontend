"use client";
import React from "react";
import Image from "next/image";

interface PaymentMethod {
  id: string;
  name: string;
  logoSrc: string;
}

interface PaymentMethodsCardProps {
  methods?: PaymentMethod[];
  transferMethod?: {
    name: string;
    logoSrc: string;
  };
}

export const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({
  methods = [
    { id: "visa", name: "Visa", logoSrc: "/icons/visa.png" },
    { id: "mastercard", name: "Mastercard", logoSrc: "/icons/mastercard.png" },
    { id: "amex", name: "American Express", logoSrc: "/icons/americanexpress.png" },
  ],
  transferMethod = {
    name: "Mercury",
    logoSrc: "/icons/mercury.png"
  }
}) => {
  return (
    <div className="bg-white border-gray-200 rounded-lg shadow-sm">
      {/* Mercury Wire Transfer Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
              <Image
                src={transferMethod.logoSrc}
                alt={transferMethod.name}
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-800">{transferMethod.name}</h4>
              <p className="text-xs text-gray-600">Wire Transfer</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Payment Methods */}
      <div className="p-6">
        <div className="flex flex-wrap gap-4 justify-center sm:justify-between">
          {methods.map((method) => (
            <div key={method.id} className="flex items-center justify-center">
              <Image
                src={method.logoSrc}
                alt={method.name}
                width={50}
                height={30}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* PayPal Section */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex justify-center">
          <Image
            src="/icons/paypal.png"
            alt="PayPal"
            width={100}
            height={40}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
};