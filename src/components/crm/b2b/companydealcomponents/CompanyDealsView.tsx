"use client";
import { useState, useContext, useEffect } from 'react';
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { AuthContext } from "@/lib/context/auth";
import { Plus, MoreHorizontal, Pencil, X, Building, DollarSign } from 'lucide-react';
import { toast } from "sonner";
import CompanyDealsBoard from './CompanyDealsBoard';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  status: 'Active Client' | 'Prospection' | 'Supplier' | 'Add Segment' | string;
  lastActivity: string;
  isSelected?: boolean;
  customSegment?: string;
}

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

interface CompanyDealsViewProps {
  onReconfigure: () => void;
  viewType: 'company' | 'deal';
  activityType: 'B2B' | 'B2B2C' | 'B2G';
  contactsFromContactView?: Contact[];
  companiesFromCompanyView?: Company[];
  onCompanyAdded?: (company: Company) => void;
  onCompaniesUpdate?: (companies: Company[]) => void;
  onDealAdded?: (deal: Deal) => void;
  onDealsUpdate?: (deals: Deal[]) => void;
}

export function CompanyDealsView({ 
  onReconfigure, 
  viewType, 
  activityType,
  contactsFromContactView = [],
  companiesFromCompanyView = [],
  onCompanyAdded,
  onCompaniesUpdate,
  onDealAdded,
  onDealsUpdate
}: CompanyDealsViewProps) {
  const { token, user } = useContext(AuthContext);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customSegments, setCustomSegments] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [columns, setColumns] = useState<StageColumn[]>([]);

  // Get column configurations based on view type and activity type
  const getColumnConfig = () => {
    if (viewType === 'company') {
      const baseColumns = [
        { id: "prospect", title: "Prospect", icon: "🎯", gradient: "from-yellow-500 to-orange-500" },
        { id: "active", title: "Active", icon: "✅", gradient: "from-green-500 to-emerald-500" },
        { id: "partner", title: "Partner", icon: "🤝", gradient: "from-blue-500 to-cyan-500" },
        { id: "inactive", title: "Inactive", icon: "😴", gradient: "from-gray-500 to-slate-500" }
      ];

      // Add activity-specific columns
      if (activityType === 'B2G') {
        return [
          { id: "prospect", title: "Government Prospect", icon: "🏛️", gradient: "from-yellow-500 to-orange-500" },
          { id: "active", title: "Active Contract", icon: "📋", gradient: "from-green-500 to-emerald-500" },
          { id: "partner", title: "Strategic Partner", icon: "🤝", gradient: "from-blue-500 to-cyan-500" },
          { id: "inactive", title: "Inactive", icon: "😴", gradient: "from-gray-500 to-slate-500" }
        ];
      }

      return baseColumns;
    } else {
      // Deal columns
      return [
        { id: "prospecting", title: "Prospecting", icon: "🔍", gradient: "from-yellow-500 to-orange-500" },
        { id: "qualification", title: "Qualification", icon: "📋", gradient: "from-blue-500 to-cyan-500" },
        { id: "proposal", title: "Proposal", icon: "📄", gradient: "from-purple-500 to-pink-500" },
        { id: "negotiation", title: "Negotiation", icon: "🤝", gradient: "from-orange-500 to-red-500" },
        { id: "closed-won", title: "Closed Won", icon: "🎉", gradient: "from-green-500 to-emerald-500" },
        { id: "closed-lost", title: "Closed Lost", icon: "❌", gradient: "from-red-500 to-pink-500" }
      ];
    }
  };

  // Initialize columns
  useEffect(() => {
    const baseColumns = getColumnConfig();
    const customColumns = customSegments.map(segment => ({
      id: segment.toLowerCase().replace(/\s+/g, '-'),
      title: segment,
      icon: "📁",
      gradient: "from-indigo-500 to-purple-500",
      isCustom: true
    }));
    
    setColumns([...baseColumns, ...customColumns]);
  }, [viewType, activityType, customSegments]);

  // Convert contacts to companies based on their company field
  const convertContactsToCompanies = (contacts: Contact[]): Company[] => {
    const companyMap = new Map<string, Company>();
    
    contacts.forEach(contact => {
      if (contact.company) {
        const companyKey = contact.company.toLowerCase();
        if (!companyMap.has(companyKey)) {
          companyMap.set(companyKey, {
            id: `company-${Date.now()}-${Math.random()}`,
            name: contact.company,
            industry: 'Unknown',
            size: 'Unknown',
            website: contact.website || '',
            email: contact.email,
            phone: contact.phone,
            address: '',
            status: contact.status === 'Active Client' ? 'Active' : 
                   contact.status === 'Prospection' ? 'Prospect' : 
                   contact.status === 'Supplier' ? 'Partner' : 'Prospect',
            lastActivity: contact.lastActivity,
            contactCount: 1,
            dealValue: 0
          });
        } else {
          // Update existing company
          const existing = companyMap.get(companyKey)!;
          existing.contactCount += 1;
          if (!existing.email && contact.email) existing.email = contact.email;
          if (!existing.phone && contact.phone) existing.phone = contact.phone;
          if (!existing.website && contact.website) existing.website = contact.website;
        }
      }
    });
    
    return Array.from(companyMap.values());
  };

  // Convert contacts/companies to deals
  const convertToDeals = (contacts: Contact[], companies: Company[]): Deal[] => {
    const dealsFromContacts = contacts
      .filter(contact => contact.status !== 'Supplier')
      .map(contact => ({
        id: `deal-contact-${contact.id}`,
        title: `Deal with ${contact.name}`,
        company: contact.company || 'Unknown Company',
        value: Math.floor(Math.random() * 50000) + 5000,
        stage: contact.status === 'Active Client' ? 'Closed Won' as const :
               contact.status === 'Prospection' ? 'Prospecting' as const : 'Qualification' as const,
        probability: contact.status === 'Active Client' ? 100 : 
                    contact.status === 'Prospection' ? 25 : 50,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastActivity: contact.lastActivity,
        contactPerson: contact.name
      }));

    const dealsFromCompanies = companies.map(company => ({
      id: `deal-company-${company.id}`,
      title: `Partnership with ${company.name}`,
      company: company.name,
      value: company.dealValue || Math.floor(Math.random() * 100000) + 10000,
      stage: company.status === 'Active' ? 'Closed Won' as const :
             company.status === 'Prospect' ? 'Prospecting' as const :
             company.status === 'Partner' ? 'Negotiation' as const : 'Qualification' as const,
      probability: company.status === 'Active' ? 90 :
                  company.status === 'Partner' ? 75 : 40,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastActivity: company.lastActivity,
      contactPerson: 'Unknown'
    }));

    return [...dealsFromContacts, ...dealsFromCompanies];
  };

  // Update data when contacts change
  useEffect(() => {
    if (viewType === 'company') {
      const newCompanies = convertContactsToCompanies(contactsFromContactView);
      setCompanies(newCompanies);
      onCompaniesUpdate?.(newCompanies);
    } else if (viewType === 'deal') {
      const newDeals = convertToDeals(contactsFromContactView, companiesFromCompanyView);
      setDeals(newDeals);
      onDealsUpdate?.(newDeals);
    }

    // Extract custom segments
    const segments = contactsFromContactView
      .filter(contact => contact.status === 'Add Segment' && contact.customSegment)
      .map(contact => contact.customSegment!)
      .filter((segment, index, array) => array.indexOf(segment) === index);
    
    setCustomSegments(segments);
  }, [contactsFromContactView, companiesFromCompanyView, viewType, onCompaniesUpdate, onDealsUpdate]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);

    if (!result.destination) {
      return;
    }

    const { draggableId, source, destination } = result;
    const itemId = draggableId;
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;

    if (sourceColumnId === destinationColumnId && source.index === destination.index) {
      return;
    }

    if (viewType === 'company') {
      setCompanies(prevCompanies => {
        const updatedCompanies = prevCompanies.map(company => {
          if (company.id === itemId) {
            // Map column ID to company status
            const statusMap: Record<string, Company['status']> = {
              'prospect': 'Prospect',
              'active': 'Active',
              'partner': 'Partner',
              'inactive': 'Inactive'
            };
            
            const newStatus = statusMap[destinationColumnId] || 'Prospect';
            return { ...company, status: newStatus };
          }
          return company;
        });
        return updatedCompanies;
      });
    } else {
      setDeals(prevDeals => {
        const updatedDeals = prevDeals.map(deal => {
          if (deal.id === itemId) {
            // Map column ID to deal stage
            const stageMap: Record<string, Deal['stage']> = {
              'prospecting': 'Prospecting',
              'qualification': 'Qualification',
              'proposal': 'Proposal',
              'negotiation': 'Negotiation',
              'closed-won': 'Closed Won',
              'closed-lost': 'Closed Lost'
            };
            
            const newStage = stageMap[destinationColumnId] || 'Prospecting';
            return { ...deal, stage: newStage };
          }
          return deal;
        });
        return updatedDeals;
      });
    }

    const destinationColumn = columns.find(col => col.id === destinationColumnId);
    toast.success(`${viewType === 'company' ? 'Company' : 'Deal'} moved to ${destinationColumn?.title || destinationColumnId}`);
  };

  // Handle item move via selector
  const handleItemMove = (itemId: string, targetColumnId: string) => {
    if (viewType === 'company') {
      setCompanies(prevCompanies => {
        const updatedCompanies = prevCompanies.map(company => {
          if (company.id === itemId) {
            const statusMap: Record<string, Company['status']> = {
              'prospect': 'Prospect',
              'active': 'Active',
              'partner': 'Partner',
              'inactive': 'Inactive'
            };
            
            const newStatus = statusMap[targetColumnId] || 'Prospect';
            return { ...company, status: newStatus };
          }
          return company;
        });
        return updatedCompanies;
      });
    } else {
      setDeals(prevDeals => {
        const updatedDeals = prevDeals.map(deal => {
          if (deal.id === itemId) {
            const stageMap: Record<string, Deal['stage']> = {
              'prospecting': 'Prospecting',
              'qualification': 'Qualification',
              'proposal': 'Proposal',
              'negotiation': 'Negotiation',
              'closed-won': 'Closed Won',
              'closed-lost': 'Closed Lost'
            };
            
            const newStage = stageMap[targetColumnId] || 'Prospecting';
            return { ...deal, stage: newStage };
          }
          return deal;
        });
        return updatedDeals;
      });
    }

    const targetColumn = columns.find(col => col.id === targetColumnId);
    toast.success(`${viewType === 'company' ? 'Company' : 'Deal'} moved to ${targetColumn?.title || targetColumnId}`);
  };

  const removeCustomSegment = (segmentName: string) => {
    if (viewType === 'company') {
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.status === segmentName 
            ? { ...company, status: 'Prospect' }
            : company
        )
      );
    } else {
      setDeals(prevDeals => 
        prevDeals.map(deal => 
          deal.stage === segmentName 
            ? { ...deal, stage: 'Prospecting' }
            : deal
        )
      );
    }
    setCustomSegments(prev => prev.filter(segment => segment !== segmentName));
  };

  const getEmptyStateConfig = () => {
    if (viewType === 'company') {
      return {
        icon: activityType === 'B2G' ? Building : Building,
        title: `No ${activityType === 'B2G' ? 'government entities' : 'companies'} yet`,
        description: `Start by adding contacts in the Contacts section. Companies will be automatically created based on the company field in your contacts.`,
        buttonText: `Add ${activityType === 'B2G' ? 'Government Entity' : 'Company'}`
      };
    } else {
      return {
        icon: DollarSign,
        title: 'No deals yet',
        description: 'Start by adding contacts and companies. Deals will be automatically created based on your contacts and companies.',
        buttonText: 'Add Deal'
      };
    }
  };

  const emptyState = getEmptyStateConfig();

  // Empty state when no items
  if ((viewType === 'company' && companies.length === 0) || (viewType === 'deal' && deals.length === 0)) {
    return (
      <div className="p-4 sm:p-6 bg-white min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <emptyState.icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
            <p className="text-gray-500 text-sm max-w-md">
              {emptyState.description}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div 
        className="min-h-screen"
        style={{ 
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Header Section */}
        <div className="px-6 pt-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                {viewType === 'company' ? <Building className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                <span>{viewType === 'company' ? `${activityType} Companies` : `${activityType} Deals`}</span>
              </h1>
              <p className="text-gray-500 mt-1">
                {viewType === 'company' ? companies.length : deals.length} {viewType === 'company' ? 'companies' : 'deals'}
              </p>
            </div>
          </div>
        </div>

        {/* Board Container with horizontal scroll */}
        <div className="board-container mt-5">
          <CompanyDealsBoard
            columns={columns}
            companies={companies}
            deals={deals}
            viewType={viewType}
            activityType={activityType}
            onItemMove={handleItemMove}
            onRemoveCustomSegment={removeCustomSegment}
          />
        </div>

        {/* Add Button */}
        <div className="fixed bottom-8 right-8">
          <button className="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            {viewType === 'company' ? <Building className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            <span className="hidden sm:inline">{emptyState.buttonText}</span>
          </button>
        </div>

        {/* Trello-style custom scrollbar */}
        <style jsx>{`
          .board-container {
            position: relative;
          }

          .board-scroll::-webkit-scrollbar {
            height: 12px;
          }
          
          .board-scroll::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 6px;
          }
          
          .board-scroll::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.3);
            border-radius: 6px;
            border: 2px solid hsl(214,91.3%,95.5%);
          }
          
          .board-scroll::-webkit-scrollbar-thumb:hover {
            background-color: rgba(0,0,0,0.5);
          }

          .board-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.3) rgba(255, 255, 255, 0.3);
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .group:hover {
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    </DragDropContext>
  );
}


































// "use client";
// import { useState, useContext, useEffect } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { Plus, MoreHorizontal, Pencil, X, Building, DollarSign } from 'lucide-react';

// interface Contact {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   status: 'Active Client' | 'Prospection' | 'Supplier' | 'Add Segment' | string;
//   lastActivity: string;
//   isSelected?: boolean;
//   customSegment?: string;
// }

// interface Company {
//   id: string;
//   name: string;
//   industry: string;
//   size: string;
//   website: string;
//   email: string;
//   phone: string;
//   address: string;
//   status: 'Active' | 'Prospect' | 'Partner' | 'Inactive';
//   lastActivity: string;
//   contactCount: number;
//   dealValue: number;
// }

// interface Deal {
//   id: string;
//   title: string;
//   company: string;
//   value: number;
//   stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
//   probability: number;
//   expectedCloseDate: string;
//   lastActivity: string;
//   contactPerson: string;
// }

// interface Stage {
//   title: string;
//   items: (Company | Deal)[];
//   isCustom?: boolean;
// }

// interface CompanyDealsViewProps {
//   onReconfigure: () => void;
//   viewType: 'company' | 'deal';
//   activityType: 'B2B' | 'B2B2C' | 'B2G';
//   contactsFromContactView?: Contact[];
//   companiesFromCompanyView?: Company[];
//   onCompanyAdded?: (company: Company) => void;
//   onCompaniesUpdate?: (companies: Company[]) => void;
//   onDealAdded?: (deal: Deal) => void;
//   onDealsUpdate?: (deals: Deal[]) => void;
// }

// export function CompanyDealsView({ 
//   onReconfigure, 
//   viewType, 
//   activityType,
//   contactsFromContactView = [],
//   companiesFromCompanyView = [],
//   onCompanyAdded,
//   onCompaniesUpdate,
//   onDealAdded,
//   onDealsUpdate
// }: CompanyDealsViewProps) {
//   const { token, user } = useContext(AuthContext);
  
//   const [companies, setCompanies] = useState<Company[]>([]);
//   const [deals, setDeals] = useState<Deal[]>([]);
//   const [customSegments, setCustomSegments] = useState<string[]>([]);

//   // Convert contacts to companies based on their company field
//   const convertContactsToCompanies = (contacts: Contact[]): Company[] => {
//     const companyMap = new Map<string, Company>();
    
//     contacts.forEach(contact => {
//       if (contact.company) {
//         const companyKey = contact.company.toLowerCase();
//         if (!companyMap.has(companyKey)) {
//           companyMap.set(companyKey, {
//             id: `company-${Date.now()}-${Math.random()}`,
//             name: contact.company,
//             industry: 'Unknown',
//             size: 'Unknown',
//             website: contact.website || '',
//             email: contact.email,
//             phone: contact.phone,
//             address: '',
//             status: contact.status === 'Active Client' ? 'Active' : 
//                    contact.status === 'Prospection' ? 'Prospect' : 
//                    contact.status === 'Supplier' ? 'Partner' : 'Prospect',
//             lastActivity: contact.lastActivity,
//             contactCount: 1,
//             dealValue: 0
//           });
//         } else {
//           // Update existing company
//           const existing = companyMap.get(companyKey)!;
//           existing.contactCount += 1;
//           if (!existing.email && contact.email) existing.email = contact.email;
//           if (!existing.phone && contact.phone) existing.phone = contact.phone;
//           if (!existing.website && contact.website) existing.website = contact.website;
//         }
//       }
//     });
    
//     return Array.from(companyMap.values());
//   };

//   // Convert contacts/companies to deals
//   const convertToDeals = (contacts: Contact[], companies: Company[]): Deal[] => {
//     const dealsFromContacts = contacts
//       .filter(contact => contact.status !== 'Supplier')
//       .map(contact => ({
//         id: `deal-contact-${contact.id}`,
//         title: `Deal with ${contact.name}`,
//         company: contact.company || 'Unknown Company',
//         value: Math.floor(Math.random() * 50000) + 5000, // Random value for demo
//         stage: contact.status === 'Active Client' ? 'Closed Won' as const :
//                contact.status === 'Prospection' ? 'Prospecting' as const : 'Qualification' as const,
//         probability: contact.status === 'Active Client' ? 100 : 
//                     contact.status === 'Prospection' ? 25 : 50,
//         expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//         lastActivity: contact.lastActivity,
//         contactPerson: contact.name
//       }));

//     const dealsFromCompanies = companies.map(company => ({
//       id: `deal-company-${company.id}`,
//       title: `Partnership with ${company.name}`,
//       company: company.name,
//       value: company.dealValue || Math.floor(Math.random() * 100000) + 10000,
//       stage: company.status === 'Active' ? 'Closed Won' as const :
//              company.status === 'Prospect' ? 'Prospecting' as const :
//              company.status === 'Partner' ? 'Negotiation' as const : 'Qualification' as const,
//       probability: company.status === 'Active' ? 90 :
//                   company.status === 'Partner' ? 75 : 40,
//       expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//       lastActivity: company.lastActivity,
//       contactPerson: 'Unknown'
//     }));

//     return [...dealsFromContacts, ...dealsFromCompanies];
//   };

//   // Update data when contacts change
//   useEffect(() => {
//     if (viewType === 'company') {
//       const newCompanies = convertContactsToCompanies(contactsFromContactView);
//       setCompanies(newCompanies);
//       onCompaniesUpdate?.(newCompanies);
//     } else if (viewType === 'deal') {
//       const newDeals = convertToDeals(contactsFromContactView, companiesFromCompanyView);
//       setDeals(newDeals);
//       onDealsUpdate?.(newDeals);
//     }

//     // Extract custom segments
//     const segments = contactsFromContactView
//       .filter(contact => contact.status === 'Add Segment' && contact.customSegment)
//       .map(contact => contact.customSegment!)
//       .filter((segment, index, array) => array.indexOf(segment) === index);
    
//     setCustomSegments(segments);
//   }, [contactsFromContactView, companiesFromCompanyView, viewType, onCompaniesUpdate, onDealsUpdate]);

//   // Define stages based on view type
//   const getStages = (): Stage[] => {
//     if (viewType === 'company') {
//       const companyStages = ['Prospect', 'Active', 'Partner', 'Inactive'];
//       const allStageNames = [...companyStages, ...customSegments];
      
//       return allStageNames.map(stageName => ({
//         title: stageName,
//         items: companies.filter(c => c.status === stageName || 
//           (stageName === 'Prospect' && !companyStages.includes(c.status))),
//         isCustom: !companyStages.includes(stageName)
//       }));
//     } else {
//       const dealStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
//       const allStageNames = [...dealStages, ...customSegments];
      
//       return allStageNames.map(stageName => ({
//         title: stageName,
//         items: deals.filter(d => d.stage === stageName),
//         isCustom: !dealStages.includes(stageName)
//       }));
//     }
//   };

//   const stages = getStages();

//   const getInitials = (name: string) => {
//     return name.split(' ').map(n => n[0]).join('').toUpperCase();
//   };

//   const removeCustomSegment = (segmentName: string) => {
//     if (viewType === 'company') {
//       setCompanies(prevCompanies => 
//         prevCompanies.map(company => 
//           company.status === segmentName 
//             ? { ...company, status: 'Prospect' }
//             : company
//         )
//       );
//     } else {
//       setDeals(prevDeals => 
//         prevDeals.map(deal => 
//           deal.stage === segmentName 
//             ? { ...deal, stage: 'Prospecting' }
//             : deal
//         )
//       );
//     }
//     setCustomSegments(prev => prev.filter(segment => segment !== segmentName));
//   };

//   const getEmptyStateConfig = () => {
//     if (viewType === 'company') {
//       return {
//         icon: activityType === 'B2G' ? Building : Building,
//         title: `No ${activityType === 'B2G' ? 'government entities' : 'companies'} yet`,
//         description: `Start by adding contacts in the Contacts section. Companies will be automatically created based on the company field in your contacts.`,
//         buttonText: `Add ${activityType === 'B2G' ? 'Government Entity' : 'Company'}`
//       };
//     } else {
//       return {
//         icon: DollarSign,
//         title: 'No deals yet',
//         description: 'Start by adding contacts and companies. Deals will be automatically created based on your contacts and companies.',
//         buttonText: 'Add Deal'
//       };
//     }
//   };

//   const emptyState = getEmptyStateConfig();

//   // Empty state when no items
//   if ((viewType === 'company' && companies.length === 0) || (viewType === 'deal' && deals.length === 0)) {
//     return (
//       <div className="p-4 sm:p-6 bg-white min-h-screen">
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="mb-6">
//             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <emptyState.icon className="w-10 h-10 text-gray-400" />
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyState.title}</h3>
//             <p className="text-gray-500 text-sm max-w-md">
//               {emptyState.description}
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const renderCompanyCard = (company: Company) => (
//     <div
//       key={company.id}
//       className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex-1 min-w-0">
//           <h4 className="font-medium text-gray-900 text-sm truncate">
//             {company.name}
//           </h4>
//           <p className="text-xs text-gray-500 mt-1 truncate">
//             {company.industry} • {company.size}
//           </p>
//           <p className="text-xs text-gray-500 truncate">
//             {company.contactCount} contact{company.contactCount !== 1 ? 's' : ''}
//           </p>
//         </div>
//         <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
//           <MoreHorizontal className="w-4 h-4 text-gray-400" />
//         </button>
//       </div>

//       <div className="flex items-end justify-between">
//         <div className="flex-1 min-w-0">
//           {company.email && (
//             <span className="text-xs text-gray-600 block truncate">
//               {company.email}
//             </span>
//           )}
//           {company.website && (
//             <span className="text-xs text-blue-500 block truncate">
//               {company.website}
//             </span>
//           )}
//           <span className="text-xs text-gray-400 block mt-1">
//             {company.lastActivity}
//           </span>
//         </div>
//         <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
//           <span className="text-white text-xs font-medium">
//             {getInitials(company.name)}
//           </span>
//         </div>
//       </div>
//     </div>
//   );

//   const renderDealCard = (deal: Deal) => (
//     <div
//       key={deal.id}
//       className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
//     >
//       <div className="flex items-start justify-between mb-3">
//         <div className="flex-1 min-w-0">
//           <h4 className="font-medium text-gray-900 text-sm truncate">
//             {deal.title}
//           </h4>
//           <p className="text-xs text-gray-500 mt-1 truncate">
//             {deal.company}
//           </p>
//           <p className="text-xs text-green-600 font-medium">
//             ${deal.value.toLocaleString()}
//           </p>
//         </div>
//         <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
//           <MoreHorizontal className="w-4 h-4 text-gray-400" />
//         </button>
//       </div>

//       <div className="flex items-end justify-between">
//         <div className="flex-1 min-w-0">
//           <span className="text-xs text-gray-600 block">
//             {deal.probability}% • {deal.contactPerson}
//           </span>
//           <span className="text-xs text-gray-500 block">
//             Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
//           </span>
//           <span className="text-xs text-gray-400 block mt-1">
//             {deal.lastActivity}
//           </span>
//         </div>
//         <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
//           <span className="text-white text-xs font-medium">
//             {deal.probability}%
//           </span>
//         </div>
//       </div>
//     </div>
//   );

//   return (
//     <div className=" min-h-screen">
//       {/* Mobile View - Stack cards vertically */}
//       <div className="block md:hidden space-y-6">
//         {stages.map((stage) => (
//           <div key={stage.title} className="bg-gray-50 rounded-lg">
//             {/* Mobile Stage Header */}
//             <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center space-x-2">
//                   <h3 className="font-medium text-gray-900">{stage.title}</h3>
//                   <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
//                     {stage.items.length}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   {stage.isCustom && (
//                     <button
//                       onClick={() => removeCustomSegment(stage.title)}
//                       className="p-1 hover:bg-gray-100 rounded text-red-500"
//                       title="Remove custom segment"
//                     >
//                       <X className="w-4 h-4" />
//                     </button>
//                   )}
//                   <button className="p-1 hover:bg-gray-100 rounded">
//                     <Plus className="w-4 h-4 text-gray-500" />
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Mobile Cards */}
//             <div className="p-4 space-y-3">
//               {stage.items.map((item) => (
//                 viewType === 'company' 
//                   ? renderCompanyCard(item as Company)
//                   : renderDealCard(item as Deal)
//               ))}

//               {stage.items.length === 0 && (
//                 <div className="text-center py-8 text-gray-400">
//                   <p className="text-sm">No {viewType === 'company' ? 'companies' : 'deals'} in this stage</p>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Desktop View - Kanban Board */}
//       <div className="hidden md:block">
//         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
//           {stages.map((stage) => (
//             <div key={stage.title} className="bg-white rounded-lg border border-gray-200">
//               {/* Desktop Column Header */}
//               <div className="p-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-2">
//                     <h3 className="font-medium text-gray-900">{stage.title}</h3>
//                     <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
//                       {stage.items.length}
//                     </span>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     {stage.isCustom && (
//                       <button
//                         onClick={() => removeCustomSegment(stage.title)}
//                         className="p-1 hover:bg-gray-100 rounded text-red-500"
//                         title="Remove custom segment"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     )}
//                     <button className="p-1 hover:bg-gray-100 rounded">
//                       <Plus className="w-4 h-4 text-gray-500" />
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Desktop Cards */}
//               <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
//                 {stage.items.map((item) => (
//                   viewType === 'company' 
//                     ? renderCompanyCard(item as Company)
//                     : renderDealCard(item as Deal)
//                 ))}

//                 {stage.items.length === 0 && (
//                   <div className="text-center py-8 text-gray-400">
//                     <p className="text-sm">No {viewType === 'company' ? 'companies' : 'deals'} in this stage</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Add Button */}
//       <div className="fixed bottom-8 right-8">
//         <button className="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
//           {viewType === 'company' ? <Building className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
//           <span className="hidden sm:inline">{emptyState.buttonText}</span>
//         </button>
//       </div>
//     </div>
//   );
// }