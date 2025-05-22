"use client";
import React, { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthContext } from "@/lib/context/auth";
import { BalanceCard } from "@/components/Transactions/BalanceCard";
import { RecentTransactionsSection } from "@/components/Transactions/RecentTransactionsSection";
import { InformationCard } from "@/components/Transactions/InformationCard";
import { SecurityCard } from "@/components/Transactions/SecurityCard";
import { PaymentMethodsCard } from "@/components/Transactions/PaymentMethodsCard";
import { MobileMoneySection } from "@/components/Transactions/MobileMoneySection";

const TransactionsPage: React.FC = () => {
    const router = useRouter();
    const { user: userInfo } = useContext(AuthContext);

    return (
        <div className="p-4 sm:p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
            {/* App Title */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Transaction History</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Section - Balance, Information, Security */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Balance Card */}
                    <BalanceCard />

                    {/* Information Card */}
                    <InformationCard />

                    {/* Security Card */}
                    <SecurityCard />
                </div>

                {/* Middle Section - Recent Transactions, Mobile Money */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Recent Transactions Section */}
                    <RecentTransactionsSection className="h-[375px]" />
                    {/* Mobile Money Section */}
                    <MobileMoneySection/>
                </div>

                {/* Right Section - Payment Methods */}
                <div className="space-y-4 sm:space-y-6 sm:col-span-2 lg:col-span-1">
                    {/* Mercury Wire Transfer Card */}
                    <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col items-center justify-center h-[150px]">
                        <Image
                            src="/icons/mercury.png"
                            alt="Mercury"
                            width={180}
                            height={50}
                            className="object-contain mb-4"
                        />
                        <p className="text-xs lg:text-lg text-white">Wire Transfer</p>
                    </div>

                    {/* Card Payment Methods */}
                    <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6 h-[210px] flex items-center justify-center">
                        <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-start space-x-4 sm:space-x-0 sm:space-y-4">
                            <Image
                                src="/icons/visa.png"
                                alt="Visa"
                                width={60}
                                height={30}
                                className="object-contain"
                            />
                            <Image
                                src="/icons/mastercard.png"
                                alt="Mastercard"
                                width={50}
                                height={30}
                                className="object-contain"
                            />
                            <Image
                                src="/icons/americanexpress.png"
                                alt="American Express"
                                width={50}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                    </div>

                    {/* PayPal Section */}
                    <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6 h-[150px] flex items-center justify-center">
                        <div className="flex justify-center">
                            <Image
                                src="/icons/paypal.png"
                                alt="PayPal"
                                width={80}
                                height={2}
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionsPage;










































// "use client";
// import React, { useState, useEffect, useContext } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
// import { AuthContext } from "@/lib/context/auth";
// import { BalanceCard } from "@/components/Transactions/BalanceCard";
// import { RecentTransactionsSection } from "@/components/Transactions/RecentTransactionsSection";
// import { InformationCard } from "@/components/Transactions/InformationCard";
// import { SecurityCard } from "@/components/Transactions/SecurityCard";
// import { PaymentMethodsCard } from "@/components/Transactions/PaymentMethodsCard";
// import { MobileMoneySection } from "@/components/Transactions/MobileMoneySection";

// const TransactionsPage: React.FC = () => {
//     const router = useRouter();
//     const { user: userInfo } = useContext(AuthContext);

//     return (
//         <div className="p-4 sm:p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
//             {/* App Title */}
//             <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Transaction History</h1>

//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
//                 {/* Left Section - Balance, Information, Security */}
//                 <div className="space-y-4 sm:space-y-6">
//                     {/* Balance Card */}
//                     <BalanceCard />

//                     {/* Information Card */}
//                     <InformationCard />

//                     {/* Security Card */}
//                     <SecurityCard />
//                 </div>

//                 {/* Middle Section - Recent Transactions, Mobile Money */}
//                 <div className="space-y-4 sm:space-y-6">
//                     {/* Recent Transactions Section */}
//                         <RecentTransactionsSection className="h-[407px]" />
//                     {/* Mobile Money Section */}
//                     <MobileMoneySection />
//                 </div>

//                 {/* Right Section - Payment Methods */}
//                 <div className="space-y-4 sm:space-y-6 sm:col-span-2 lg:col-span-1">
//                     {/* Mercury Wire Transfer Card */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6 flex flex-col items-center justify-center">
//                         <Image
//                             src="/icons/mercury.png"
//                             alt="Mercury"
//                             width={180}
//                             height={50}
//                             className="object-contain mb-4"
//                         />
//                         <p className="text-xs lg:text-lg text-gray-600">Wire Transfer</p>
//                     </div>

//                     {/* Card Payment Methods */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6">
//                         <div className="flex flex-row sm:flex-col items-center justify-center sm:justify-start space-x-4 sm:space-x-0 sm:space-y-4">
//                             <Image
//                                 src="/icons/visa.png"
//                                 alt="Visa"
//                                 width={60}
//                                 height={30}
//                                 className="object-contain"
//                             />
//                             <Image
//                                 src="/icons/mastercard.png"
//                                 alt="Mastercard"
//                                 width={50}
//                                 height={40}
//                                 className="object-contain"
//                             />
//                             <Image
//                                 src="/icons/americanexpress.png"
//                                 alt="American Express"
//                                 width={50}
//                                 height={40}
//                                 className="object-contain"
//                             />
//                         </div>
//                     </div>

//                     {/* PayPal Section */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 sm:p-6 h-40 flex items-center justify-center">
//                         <div className="flex justify-center">
//                             <Image
//                                 src="/icons/paypal.png"
//                                 alt="PayPal"
//                                 width={80}
//                                 height={70}
//                                 className="object-contain"
//                             />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TransactionsPage;











































// "use client"
// import React, { useContext } from "react";
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { AuthContext } from "@/lib/context/auth";
// import { BalanceCard } from "@/components/Transactions/BalanceCard";
// import { RecentTransactionsSection } from "@/components/Transactions/RecentTransactionsSection";
// import { InformationCard } from "@/components/Transactions/InformationCard";
// import { SecurityCard } from "@/components/Transactions/SecurityCard";
// import { MobileMoneySection } from "@/components/Transactions/MobileMoneySection";

// const TransactionsPage: React.FC = () => {
//     const router = useRouter();
//     const { user: userInfo } = useContext(AuthContext);

//     return (
//         <div className="p-4 sm:p-6 min-h-screen bg-white overflow-hidden overflow-y-auto">
//             {/* App Title */}
//             <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Transaction History</h1>

//             <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6">
//                 {/* Left Section - Balance and Information */}
//                 <div className="space-y-4 sm:space-y-6 lg:col-span-3">
//                     {/* Balance Card */}
//                     <BalanceCard />

//                     {/* Information Card */}
//                     <div className="h-64">
//                         <InformationCard />
//                     </div>
//                 </div>

//                 {/* Middle Section - Recent Transactions (taller to match left section height) */}
//                 <div className="lg:col-span-4">
//                     {/* Recent Transactions Section - Height matches BalanceCard + InformationCard */}
//                     <div className="h-full">
//                         <RecentTransactionsSection />
//                     </div>
//                 </div>

//                 {/* Right Section - Payment Methods */}
//                 <div className="space-y-4 sm:space-y-6 lg:col-span-3">
//                     {/* Mercury Wire Transfer Card */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 h-32 flex flex-col items-center justify-center">
//                         <Image
//                             src="/icons/mercury.png"
//                             alt="Mercury"
//                             width={150}
//                             height={40}
//                             className="object-contain mb-4"
//                         />
//                         <p className="text-xs lg:text-lg text-white">Wire Transfer</p>
//                     </div>

//                     {/* Card Payment Methods */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 h-32 flex items-center justify-center">
//                         <div className="grid grid-cols-3 gap-4 items-center justify-items-center">
//                             <Image
//                                 src="/icons/visa.png"
//                                 alt="Visa"
//                                 width={60}
//                                 height={30}
//                                 className="object-contain"
//                             />
//                             <Image
//                                 src="/icons/mastercard.png"
//                                 alt="Mastercard"
//                                 width={50}
//                                 height={40}
//                                 className="object-contain"
//                             />
//                             <Image
//                                 src="/icons/americanexpress.png"
//                                 alt="American Express"
//                                 width={50}
//                                 height={40}
//                                 className="object-contain"
//                             />
//                         </div>
//                     </div>

//                     {/* PayPal Section */}
//                     <div className="bg-blue-500 rounded-lg shadow-sm p-4 h-32 flex items-center justify-center">
//                         <Image
//                             src="/icons/paypal.png"
//                             alt="PayPal"
//                             width={80}
//                             height={70}
//                             className="object-contain"
//                         />
//                     </div>
//                 </div>
//             </div>

//             {/* Second row with SecurityCard and MobileMoneySection side by side */}
//             <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-6 mt-4 sm:mt-6">
//                 {/* SecurityCard - matching width with left section above */}
//                 <div className="lg:col-span-3">
//                     <div className="h-64">
//                         <SecurityCard />
//                     </div>
//                 </div>

//                 {/* MobileMoneySection - matching width with middle section above */}
//                 <div className="lg:col-span-7">
//                     <div className="h-64">
//                         <MobileMoneySection />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TransactionsPage;






















































