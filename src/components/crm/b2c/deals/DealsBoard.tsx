import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the column component to avoid SSR issues
const DealColumn = dynamic(() => import('./DealColumn'), {
  ssr: false
});

interface Deal {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  role: string;
  avatar: string;
  stage: string;
  lastActivity: string;
}

interface DealColumn {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  isCustom?: boolean;
}

interface DealsBoardProps {
  columns: DealColumn[];
  deals: Deal[];
  onDealMove: (dealId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

const DealsBoard: React.FC<DealsBoardProps> = ({
  columns,
  deals,
  onDealMove,
  onRemoveCustomSegment
}) => {
  
  return (
    <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 px-2">
      {columns.map((column: DealColumn, index: number) => (
        <div
          key={column?.id}
          style={{
            animationDelay: `${index * 150}ms`,
            animation: 'slideInFromBottom 0.6s ease-out forwards'
          }}
        >
          <DealColumn 
            column={column} 
            deals={deals}
            onDealMove={onDealMove}
            onRemoveCustomSegment={onRemoveCustomSegment}
          />
        </div>
      ))}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(40px);  
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-scrollbar-container {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar {
          height: 6px;
        }
        
        @media (min-width: 640px) {
          .custom-scrollbar-container::-webkit-scrollbar {
            height: 8px;
          }
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 4px;
          opacity: 0.7;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .custom-scrollbar-container::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default DealsBoard;