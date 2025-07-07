import React, { useState, useMemo } from 'react';
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Move, Pencil, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

// Dynamically import card component to avoid SSR issues
const DealCard = dynamic(() => import('./DealCard'), { ssr: false });

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

interface DealColumnProps {
  column: DealColumn;
  deals: Deal[];
  onDealMove: (dealId: string, targetColumnId: string) => void;
  onRemoveCustomSegment: (segmentName: string) => void;
}

// Drag and Drop Deal Selector Component
const DragDropDealSelector = ({ 
  deals, 
  currentColumnId, 
  onDealMove 
}: { 
  deals: Deal[], 
  currentColumnId: string,
  onDealMove: (dealId: string, targetColumnId: string) => void 
}) => {
  // Map column ID to stage for filtering
  const stageMap: Record<string, string> = {
    'prospection': 'Prospection',
    'active-client': 'Active Client',
    'negotiation': 'Negotiation',
    'closed': 'Closed'
  };

  const currentStage = stageMap[currentColumnId] || currentColumnId;
  
  // Get deals from other columns that can be moved
  const availableDeals = deals.filter(deal => deal.stage !== currentStage);
  
  if (availableDeals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Pencil className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No deals available to move</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-3 px-2">
        Select deals to move here:
      </div>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {availableDeals.map((deal) => (
          <div
            key={deal.id}
            className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
            onClick={() => {
              onDealMove(deal.id, currentColumnId);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    From: {deal.stage}
                  </div>
                </div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {deal.clientName}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {deal.company || deal.role}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {deal.email}
                </p>
              </div>
              <Move className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 px-2 mt-2">
        Click on any deal to move it to this column
      </div>
    </div>
  );
};

const DealColumn: React.FC<DealColumnProps> = ({
  column,
  deals,
  onDealMove,
  onRemoveCustomSegment
}) => {
  const [showDragDropSelector, setShowDragDropSelector] = useState(false);

  // Get deals for this column
  const getDealsInColumn = useMemo(() => {
    // Map column ID to stage for filtering
    const stageMap: Record<string, string> = {
      'prospection': 'Prospection',
      'active-client': 'Active Client',
      'negotiation': 'Negotiation',
      'closed': 'Closed'
    };
    
    const targetStage = stageMap[column.id] || column.title;
    return deals.filter(deal => deal.stage === targetStage);
  }, [deals, column.id, column.title]);

  const dealsInColumn = getDealsInColumn;

  // Handle deal move
  const handleDealMove = (dealId: string, targetColumnId: string) => {
    onDealMove(dealId, targetColumnId);
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
                    {dealsInColumn.length}
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

            {/* Deals Container - Trello style */}
            <ol className="space-y-2">
              {dealsInColumn.length > 0 ? (
                dealsInColumn.map((deal, index) => (
                  <li key={deal.id}>
                    <Draggable key={deal.id} draggableId={deal.id} index={index}>
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
                            <DealCard deal={deal} />
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

            {/* Drag and Drop Deal Button - Trello Style */}
            <div className={dealsInColumn.length > 0 ? "mt-2" : "mt-1"}>
              {!showDragDropSelector ? (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 hover:text-gray-800 hover:!bg-gray-400 transition-colors rounded-sm py-1.5 px-2 text-sm font-normal h-auto"
                  onClick={() => setShowDragDropSelector(true)}
                >
                  <Move className="w-4 h-4 mr-1" />
                  Drag & drop deal
                </Button>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Move deals here
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
                  <DragDropDealSelector
                    deals={deals}
                    currentColumnId={column.id}
                    onDealMove={handleDealMove}
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

export default DealColumn;