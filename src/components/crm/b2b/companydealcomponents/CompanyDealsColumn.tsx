import React, { useState } from 'react';
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Move, Building, DollarSign, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CompanyCard from './CompanyCard';
import DealCard from './DealCard';

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

interface CompanyDealsColumnProps {
  column: StageColumn;
  companies: Company[];
  deals: Deal[];
  viewType: 'company' | 'deal';
  activityType: 'B2B' | 'B2B2C' | 'B2G';
  onItemMove: (itemId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

// Drag and Drop Item Selector Component
const DragDropItemSelector = ({ 
  companies,
  deals,
  viewType,
  currentColumnId, 
  onItemMove 
}: { 
  companies: Company[],
  deals: Deal[],
  viewType: 'company' | 'deal',
  currentColumnId: string,
  onItemMove: (itemId: string, targetColumnId: string) => void 
}) => {
  // Get items from other columns that can be moved
  let availableItems: (Company | Deal)[] = [];
  
  if (viewType === 'company') {
    // Map column ID to company status for filtering
    const statusMap: Record<string, Company['status']> = {
      'prospect': 'Prospect',
      'active': 'Active',
      'partner': 'Partner',
      'inactive': 'Inactive'
    };
    
    const currentStatus = statusMap[currentColumnId];
    availableItems = companies.filter(company => company.status !== currentStatus);
  } else {
    // Map column ID to deal stage for filtering
    const stageMap: Record<string, Deal['stage']> = {
      'prospecting': 'Prospecting',
      'qualification': 'Qualification',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed-won': 'Closed Won',
      'closed-lost': 'Closed Lost'
    };
    
    const currentStage = stageMap[currentColumnId];
    availableItems = deals.filter(deal => deal.stage !== currentStage);
  }
  
  if (availableItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {viewType === 'company' ? <Building className="w-8 h-8 mx-auto mb-2 opacity-50" /> : <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />}
        <p className="text-sm">No {viewType === 'company' ? 'companies' : 'deals'} available to move</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-3 px-2">
        Select {viewType === 'company' ? 'companies' : 'deals'} to move here:
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {availableItems.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
            onClick={() => {
              onItemMove(item.id, currentColumnId);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    From: {viewType === 'company' ? (item as Company).status : (item as Deal).stage}
                  </div>
                  {((viewType === 'company' && (item as Company).dealValue > 50000) || 
                    (viewType === 'deal' && (item as Deal).value > 50000)) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {viewType === 'company' ? (item as Company).name : (item as Deal).title}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {viewType === 'company' ? (item as Company).industry : (item as Deal).company}
                </p>
                {viewType === 'deal' && (
                  <p className="text-xs text-green-600 font-medium">
                    ${(item as Deal).value.toLocaleString()} • {(item as Deal).probability}%
                  </p>
                )}
              </div>
              <Move className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 px-2 mt-2">
        Click on any {viewType === 'company' ? 'company' : 'deal'} to move it to this column
      </div>
    </div>
  );
};

const CompanyDealsColumn: React.FC<CompanyDealsColumnProps> = ({
  column,
  companies,
  deals,
  viewType,
  activityType,
  onItemMove,
  onRemoveCustomSegment
}) => {
  const [showDragDropSelector, setShowDragDropSelector] = useState(false);

  // Get items for this column
  const getItemsInColumn = () => {
    if (viewType === 'company') {
      // Map column ID to company status for filtering
      const statusMap: Record<string, Company['status']> = {
        'prospect': 'Prospect',
        'active': 'Active',
        'partner': 'Partner',
        'inactive': 'Inactive'
      };
      
      const targetStatus = statusMap[column.id];
      return companies.filter(company => company.status === targetStatus);
    } else {
      // Map column ID to deal stage for filtering
      const stageMap: Record<string, Deal['stage']> = {
        'prospecting': 'Prospecting',
        'qualification': 'Qualification',
        'proposal': 'Proposal',
        'negotiation': 'Negotiation',
        'closed-won': 'Closed Won',
        'closed-lost': 'Closed Lost'
      };
      
      const targetStage = stageMap[column.id];
      return deals.filter(deal => deal.stage === targetStage);
    }
  };

  const itemsInColumn = getItemsInColumn();

  // Handle item move
  const handleItemMove = (itemId: string, targetColumnId: string) => {
    onItemMove(itemId, targetColumnId);
    setShowDragDropSelector(false);
  };

  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="w-72 flex-shrink-0 rounded-2xl p-2 relative"
          style={{ backgroundColor: '#ebecf0' }}
        >
          <div className={`transition-all duration-300 ${
            snapshot.isDraggingOver ? "bg-blue-50/80 border-blue-400" : ""
          }`}>
            {/* Column Header - Trello Style */}
            <div className="flex justify-between items-center mb-2 px-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {column.icon && (
                      <span className="text-sm">{column.icon}</span>
                    )}
                    <h3 
                      className="text-sm font-semibold text-gray-700 font-sans"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                    >
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {itemsInColumn.length}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {column.isCustom && (
                  <button
                    onClick={() => onRemoveCustomSegment(column.title)}
                    className="p-1 hover:bg-gray-100 rounded text-red-500"
                    title="Remove custom segment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Items Container - Trello style */}
            <ol className="space-y-2">
              {itemsInColumn.length > 0 ? (
                itemsInColumn.map((item, index) => (
                  <li key={item.id}>
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`transform hover:scale-[1.02] transition-transform duration-200 ${
                            snapshot.isDragging ? "shadow-lg opacity-80" : ""
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            animationDelay: `${index * 100}ms`,
                            animation: 'fadeInUp 0.5s ease-out forwards'
                          }}
                        >
                          <div className="relative rounded-lg border hover:shadow-md hover:border-blue-500 hover:border-2 transition-all cursor-pointer group overflow-hidden border-gray-200 shadow-sm bg-white"
                            style={{ 
                              boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                              borderRadius: '10px',
                              minHeight: '60px',
                            }}
                          >
                            {viewType === 'company' ? (
                              <CompanyCard company={item as Company} />
                            ) : (
                              <DealCard deal={item as Deal} />
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  </li>
                ))
              ) : (
                <div className="rounded-xl border-2 border-dashed border-transparent" />
              )}
              {provided.placeholder}
            </ol>

            {/* Drag and Drop Item Button - Trello Style */}
            <div className={itemsInColumn.length > 0 ? "mt-2" : "mt-1"}>
              {!showDragDropSelector ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
                  onClick={() => setShowDragDropSelector(true)}
                >
                  <Move className="w-4 h-4 mr-1" />
                  Drag & drop {viewType === 'company' ? 'company' : 'deal'}
                </Button>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Move {viewType === 'company' ? 'companies' : 'deals'} here
                    </h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowDragDropSelector(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <DragDropItemSelector
                    companies={companies}
                    deals={deals}
                    viewType={viewType}
                    currentColumnId={column.id}
                    onItemMove={handleItemMove}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default CompanyDealsColumn;