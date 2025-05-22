"use client";
import React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface BalanceCardProps {
  balance?: string;
  incoming?: string;
  outgoing?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance = "$ 7,610.00",
  incoming = "$ 2,319.00",
  outgoing = "$ 519.00"
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-gray-600 font-medium text-sm mb-2">Balance</h3>
      <div className="text-3xl font-bold text-gray-900 mb-4">{balance}</div>
      
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-6 h-6 mr-2">
            <ArrowUp className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm text-gray-700">{incoming}</span>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center justify-center w-6 h-6 mr-2">
            <ArrowDown className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm text-gray-700">{outgoing}</span>
        </div>
      </div>
    </div>
  );
};