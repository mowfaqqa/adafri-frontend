import React from 'react';
import CompanyDealsColumn from './CompanyDealsColumn';

interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Prospect' | 'Partner' | 'Inactive';
  lastActivity: string;
  contactCount: number;
  dealValue: number;
}

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  probability: number;
  expectedCloseDate: string;
  lastActivity: string;
  contactPerson: string;
}

interface StageColumn {
  id: string;
  title: string;
  icon: string;
  gradient: string;
  isCustom?: boolean;
}

interface CompanyDealsBoardProps {
  columns: StageColumn[];
  companies: Company[];
  deals: Deal[];
  viewType: 'company' | 'deal';
  activityType: 'B2B' | 'B2B2C' | 'B2G';
  onItemMove: (itemId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

const CompanyDealsBoard: React.FC<CompanyDealsBoardProps> = ({
  columns,
  companies,
  deals,
  viewType,
  activityType,
  onItemMove,
  onRemoveCustomSegment
}) => {
  
  return (
    <div className="custom-scrollbar-container flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {columns.map((column: StageColumn, index: number) => (
        <div
          key={column?.id}
          style={{
            animationDelay: `${index * 150}ms`,
            animation: 'slideInFromBottom 0.6s ease-out forwards'
          }}
        >
          <CompanyDealsColumn 
            column={column} 
            companies={companies}
            deals={deals}
            viewType={viewType}
            activityType={activityType}
            onItemMove={onItemMove}
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

export default CompanyDealsBoard;