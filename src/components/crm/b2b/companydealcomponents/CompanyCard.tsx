import React from 'react';
import { MoreHorizontal, Building, Users, Mail, Globe, Phone } from 'lucide-react';

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

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Prospect': 'bg-yellow-100 text-yellow-800',
      'Partner': 'bg-blue-100 text-blue-800',
      'Inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {getInitials(company.name)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-gray-900 text-sm truncate">
                {company.name}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {company.industry}
              </p>
            </div>
          </div>
          
          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(company.status)}`}>
                {company.status}
              </span>
              <span className="text-xs text-gray-500">
                {company.size}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Users className="w-3 h-3" />
              <span>{company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}</span>
            </div>
            
            {company.email && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Mail className="w-3 h-3" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
            
            {company.website && (
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <Globe className="w-3 h-3" />
                <span className="truncate">{company.website}</span>
              </div>
            )}
            
            {company.phone && (
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <Phone className="w-3 h-3" />
                <span className="truncate">{company.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{company.lastActivity}</span>
            {company.dealValue > 0 && (
              <span className="text-green-600 font-medium">
                ${company.dealValue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0 ml-2">
          <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};

export default CompanyCard;