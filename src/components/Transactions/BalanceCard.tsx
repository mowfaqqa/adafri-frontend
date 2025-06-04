"use client";
import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";

interface BalanceCardProps {
  balance?: number;
  incoming?: string;
  outgoing?: string;
  onBalanceUpdate?: (newBalance: number) => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance: initialBalance = 7610.00,
  incoming = "$ 2,319.00",
  outgoing = "$ 519.00",
  onBalanceUpdate
}) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true);

  // Function to add money to balance (called from MobileMoneySection)
  const addToBalance = (amount: number) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    if (onBalanceUpdate) {
      onBalanceUpdate(newBalance);
    }
  };

  // Expose the addToBalance function globally or through a ref
  useEffect(() => {
    // You can expose this function through a global event or context
    const handlePaymentSuccess = (event: CustomEvent) => {
      const { amount } = event.detail;
      if (amount && !isNaN(parseFloat(amount))) {
        addToBalance(parseFloat(amount));
      }
    };

    window.addEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
    
    return () => {
      window.removeEventListener('paymentSuccess', handlePaymentSuccess as EventListener);
    };
  }, [balance]);

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const formatBalance = (amount: number): string => {
    return `$ ${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getMaskedBalance = (): string => {
    const balanceStr = formatBalance(balance);
    // Replace digits with asterisks, keep $ and decimal points
    return balanceStr.replace(/\d/g, '*');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-600 font-medium text-sm">Balance</h3>
        <button
          onClick={toggleBalanceVisibility}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
        >
          {isBalanceVisible ? (
            <Eye className="w-4 h-4 text-gray-500" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-500" />
          )}
        </button>
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-4">
        {isBalanceVisible ? formatBalance(balance) : getMaskedBalance()}
      </div>
             
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-6 h-6 mr-2">
            <ArrowUp className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm text-gray-700">
            {isBalanceVisible ? incoming : incoming.replace(/\d/g, '*')}
          </span>
        </div>
                 
        <div className="flex items-center">
          <div className="flex items-center justify-center w-6 h-6 mr-2">
            <ArrowDown className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm text-gray-700">
            {isBalanceVisible ? outgoing : outgoing.replace(/\d/g, '*')}
          </span>
        </div>
      </div>
    </div>
  );
};