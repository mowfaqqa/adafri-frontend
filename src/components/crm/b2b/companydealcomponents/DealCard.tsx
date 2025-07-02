import React from 'react';
import { MoreHorizontal, DollarSign, Calendar, User, TrendingUp } from 'lucide-react';

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

interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Prospecting': 'bg-yellow-100 text-yellow-800',
      'Qualification': 'bg-blue-100 text-blue-800',
      'Proposal': 'bg-purple-100 text-purple-800',
      'Negotiation': 'bg-orange-100 text-orange-800',
      'Closed Won': 'bg-green-100 text-green-800',
      'Closed Lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-green-600';
    if (probability >= 50) return 'text-yellow-600';
    if (probability >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {deal.probability}%
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {deal.title}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {deal.company}
              </p>
            </div>
          </div>
          
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(deal.stage)}`}>
                {deal.stage}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-green-600 font-medium">
              <DollarSign className="w-3 h-3" />
              <span>${deal.value.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span className={`font-medium ${getProbabilityColor(deal.probability)}`}>
                {deal.probability}% probability
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Close: {formatDate(deal.expectedCloseDate)}</span>
            </div>
            
            {deal.contactPerson && deal.contactPerson !== 'Unknown' && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <User className="w-3 h-3" />
                <span className="truncate">{deal.contactPerson}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{deal.lastActivity}</span>
          </div>
        </div>
        
        <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0 ml-2">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default DealCard;