"use client";
import React from "react";
import { FileText } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  receipt: string;
  price: string;
}

interface RecentTransactionsSectionProps {
  transactions?: Transaction[];
  className?: string;
}

export const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({
  transactions = [
    { id: "1", date: "04/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$300" },
    { id: "2", date: "01/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$100" },
    { id: "3", date: "27/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$340" },
    { id: "4", date: "04/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$300" },
    { id: "5", date: "01/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$100" },
  ],
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      <h3 className="text-gray-900 font-medium text-lg mb-4">Recent transactions</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Receipt</th>
              <th className="pb-3 font-medium">Price</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-gray-200">
                <td className="py-3 text-sm text-gray-700">{transaction.date}</td>
                <td className="py-3 text-sm text-gray-700">{transaction.receipt}</td>
                <td className="py-3 text-sm text-gray-700">{transaction.price}</td>
                <td className="py-3 text-right">
                  <button className="text-gray-600 hover:text-gray-900">
                    <FileText className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};








































// "use client";
// import React from "react";
// import { FileText } from "lucide-react";

// interface Transaction {
//   id: string;
//   date: string;
//   receipt: string;
//   price: string;
// }

// interface RecentTransactionsSectionProps {
//   transactions?: Transaction[];
// }

// export const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({
//   transactions = [
//     { id: "1", date: "04/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$300" },
//     { id: "2", date: "01/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$100" },
//     { id: "3", date: "27/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$340" },
//     { id: "4", date: "04/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$300" },
//     { id: "5", date: "01/12/24", receipt: "#zf32aecoaR3RSnZ", price: "$100" },
//   ]
// }) => {
//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
//       <h3 className="text-gray-900 font-medium text-lg mb-4">Recent transactions</h3>
      
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="text-left text-sm text-gray-600">
//               <th className="pb-3 font-medium">Date</th>
//               <th className="pb-3 font-medium">Receipt</th>
//               <th className="pb-3 font-medium">Price</th>
//               <th className="pb-3 font-medium"></th>
//             </tr>
//           </thead>
//           <tbody>
//             {transactions.map((transaction) => (
//               <tr key={transaction.id} className="border-t border-gray-200">
//                 <td className="py-3 text-sm text-gray-700">{transaction.date}</td>
//                 <td className="py-3 text-sm text-gray-700">{transaction.receipt}</td>
//                 <td className="py-3 text-sm text-gray-700">{transaction.price}</td>
//                 <td className="py-3 text-right">
//                   <button className="text-gray-600 hover:text-gray-900">
//                     <FileText className="w-5 h-5" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };