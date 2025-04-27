"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

interface BuySMSProps {
  onSubmit: (data: any) => void;
  initialData: any;
}

interface BankDetail {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

const BuySMS: React.FC<BuySMSProps> = ({ onSubmit, initialData }) => {
  // State for active payment tab
  const [activeTab, setActiveTab] = useState<'cardPayment' | 'bankDeposit' | 'bankDetails'>('bankDeposit');
  
  // Card Payment specific fields
  const [smsUnits, setSmsUnits] = useState('');
  const [unitsPrice, setUnitsPrice] = useState('');
  const [interfaceValue, setInterfaceValue] = useState('');
  const [amountToPay, setAmountToPay] = useState('');
  const [totalPayment, setTotalPayment] = useState('');
  
  // Bank deposit specific fields
  const [bankPaidInto, setBankPaidInto] = useState('');
  const [typeOfPayment, setTypeOfPayment] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [depositName, setDepositName] = useState('');

  // Bank details
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([
    {
      id: 1,
      bankName: 'EcoBank',
      accountName: 'Abbuu C. Deng',
      accountNumber: '603 773 884'
    }
  ]);

  const [selectedBankId, setSelectedBankId] = useState<number>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'bankDeposit') {
      onSubmit({
        paymentMethod: activeTab,
        bankPaidInto,
        typeOfPayment,
        amountPaid,
        depositName
      });
    } else if (activeTab === 'cardPayment') {
      onSubmit({
        paymentMethod: activeTab,
        smsUnits,
        unitsPrice,
        interface: interfaceValue,
        amountToPay,
        totalPayment
      });
    } else {
      // Bank details tab
      onSubmit({
        paymentMethod: activeTab,
        selectedBankId
      });
    }
  };

  const addNewBank = () => {
    // In a real implementation, this would open a modal or form to add new bank details
    // For now, we'll just add a placeholder
    const newBank: BankDetail = {
      id: bankDetails.length + 1,
      bankName: 'New Bank',
      accountName: 'Account Holder',
      accountNumber: '000 000 000'
    };
    
    setBankDetails([...bankDetails, newBank]);
  };

  return (
    <div>
      {/* Payment Method Tabs */}
      <div className="flex mb-6">
        <button 
          className={`px-4 py-2 rounded-t-md text-sm ${activeTab === 'cardPayment' ? 'bg-white border-t border-l border-r border-gray-300' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('cardPayment')}
        >
          Card Payment
        </button>
        <button 
          className={`px-4 py-2 rounded-t-md text-sm ${activeTab === 'bankDeposit' ? 'bg-white border-t border-l border-r border-gray-300' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('bankDeposit')}
        >
          Bank Deposit / Transfer
        </button>
        <button 
          className={`px-4 py-2 rounded-t-md text-sm ${activeTab === 'bankDetails' ? 'bg-white border-t border-l border-r border-gray-300' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('bankDetails')}
        >
          Bank details
        </button>
      </div>
      
      <div className="border border-gray-300 rounded-md p-6">
        <form onSubmit={handleSubmit}>
          {/* Card Payment Tab Content */}
          {activeTab === 'cardPayment' && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-right pt-2">
                <label htmlFor="smsUnits" className="text-sm font-medium text-gray-700">
                  Number of SMS units
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="smsUnits"
                  value={smsUnits}
                  onChange={(e) => setSmsUnits(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="unitsPrice" className="text-sm font-medium text-gray-700">
                  Units Price
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="unitsPrice"
                  value={unitsPrice}
                  onChange={(e) => setUnitsPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="interface" className="text-sm font-medium text-gray-700">
                  Interface
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="interface"
                  value={interfaceValue}
                  onChange={(e) => setInterfaceValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="amountToPay" className="text-sm font-medium text-gray-700">
                  Amount to Pay
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="amountToPay"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="totalPayment" className="text-sm font-medium text-gray-700">
                  Total Payment
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="totalPayment"
                  value={totalPayment}
                  onChange={(e) => setTotalPayment(e.target.value)}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* Bank Deposit / Transfer Tab Content */}
          {activeTab === 'bankDeposit' && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-right pt-2">
                <label htmlFor="bankPaidInto" className="text-sm font-medium text-gray-700">
                  Bank Paid Into
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="bankPaidInto"
                  value={bankPaidInto}
                  onChange={(e) => setBankPaidInto(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="typeOfPayment" className="text-sm font-medium text-gray-700">
                  Type of Payment
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="typeOfPayment"
                  value={typeOfPayment}
                  onChange={(e) => setTypeOfPayment(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="amountPaid" className="text-sm font-medium text-gray-700">
                  Amount Paid
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="amountPaid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div className="text-right pt-2">
                <label htmlFor="depositName" className="text-sm font-medium text-gray-700">
                  Deposit Name
                </label>
              </div>
              <div className="col-span-3">
                <input
                  type="text"
                  id="depositName"
                  value={depositName}
                  onChange={(e) => setDepositName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
          
          {/* Bank Details Tab Content */}
          {activeTab === 'bankDetails' && (
            <div>
              <div className="flex justify-end mb-4">
                <Button 
                  type="button"
                  onClick={addNewBank}
                  variant="outline"
                  className="flex items-center text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Another Bank
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankDetails.map((bank) => (
                  <div 
                    key={bank.id} 
                    className={`border rounded-md p-4 cursor-pointer ${selectedBankId === bank.id ? 'border-teal-500 bg-teal-50' : 'border-gray-300'}`}
                    onClick={() => setSelectedBankId(bank.id)}
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-black rounded-md p-2 mr-4">
                        <div className="text-white font-bold">ECOBANK</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-gray-500 w-24">Bank:</span>
                        <span className="text-sm font-medium">{bank.bankName}</span>
                      </div>
                      
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-gray-500 w-24">Account Name:</span>
                        <span className="text-sm font-medium">{bank.accountName}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 w-24">Account Number:</span>
                        <span className="text-sm font-medium">{bank.accountNumber}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Buy Now Button */}
          <div className="flex justify-center mt-6">
            <Button
              type="submit"
              className="px-6 py-2 bg-teal-500 text-white hover:bg-teal-600 rounded-md"
            >
              Buy Now
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuySMS;