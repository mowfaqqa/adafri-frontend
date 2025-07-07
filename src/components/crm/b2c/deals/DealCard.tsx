import React from 'react';
import { MoreHorizontal, Mail, Phone, Globe, Building, User } from 'lucide-react';

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

interface DealCardProps {
  deal: Deal;
}

const DealCard: React.FC<DealCardProps> = ({ deal }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'Prospection': 'bg-yellow-100 text-yellow-800',
      'Active Client': 'bg-green-100 text-green-800',
      'Negotiation': 'bg-blue-100 text-blue-800',
      'Closed': 'bg-purple-100 text-purple-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {getInitials(deal.clientName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {deal.clientName}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {deal.role || 'Client'}
              </p>
            </div>
          </div>
          
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(deal.stage)}`}>
                {deal.stage}
              </span>
            </div>
            
            {deal.email && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{deal.email}</span>
              </div>
            )}
            
            {deal.phone && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span className="truncate">{deal.phone}</span>
              </div>
            )}
            
            {deal.company && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Building className="w-3 h-3" />
                <span className="truncate">{deal.company}</span>
              </div>
            )}
            
            {deal.website && (
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <Globe className="w-3 h-3" />
                <span className="truncate">{deal.website}</span>
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