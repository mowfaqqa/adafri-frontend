"use client";
import { useState, useContext, useEffect, useCallback } from 'react';
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { AuthContext } from "@/lib/context/auth";
import { Plus, MoreHorizontal, Pencil, X } from 'lucide-react';
import { toast } from "sonner";
import dynamic from 'next/dynamic';

// Dynamically import the board component to avoid SSR issues with drag and drop
const DealsBoard = dynamic(() => import('./DealsBoard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )
});

// Import error boundary
import ErrorBoundary from './ErrorBoundary';

interface DealsViewProps {
  onReconfigure: () => void;
  contactsFromContactView?: Contact[];
}

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

export function DealsView({ onReconfigure, contactsFromContactView = [] }: DealsViewProps) {
  const { token, user } = useContext(AuthContext);
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customSegments, setCustomSegments] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [columns, setColumns] = useState<DealColumn[]>([
    { id: "prospection", title: "Prospection", icon: "🎯", gradient: "from-yellow-500 to-orange-500" },
    { id: "active-client", title: "Active Client", icon: "✅", gradient: "from-green-500 to-emerald-500" },
    { id: "negotiation", title: "Negotiation", icon: "🤝", gradient: "from-blue-500 to-cyan-500" },
    { id: "closed", title: "Closed", icon: "🎉", gradient: "from-purple-500 to-pink-500" }
  ]);

  // Convert contacts to deals based on their status with validation
  const convertContactsToDeals = useCallback((contacts: Contact[]): Deal[] => {
    try {
      return contacts
        .filter(contact => contact.status !== 'Supplier')
        .map(contact => ({
          id: contact.id,
          clientName: contact.name || 'Unknown Client',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          website: contact.website || '',
          role: contact.company || 'Client',
          avatar: '/api/placeholder/32/32',
          stage: contact.status === 'Add Segment' ? (contact.customSegment || 'New Segment') : contact.status,
          lastActivity: contact.lastActivity || 'No activity'
        }));
    } catch (error) {
      console.error('Error converting contacts to deals:', error);
      return [];
    }
  }, []);

  // Update deals when contacts change
  useEffect(() => {
    const newDeals = convertContactsToDeals(contactsFromContactView);
    setDeals(newDeals);
    
    // Extract custom segments
    const segments = contactsFromContactView
      .filter(contact => contact.status === 'Add Segment' && contact.customSegment)
      .map(contact => contact.customSegment!)
      .filter((segment, index, array) => array.indexOf(segment) === index);
    
    setCustomSegments(segments);
  }, [contactsFromContactView, convertContactsToDeals]);

  // Update columns when custom segments change
  useEffect(() => {
    const baseColumns = [
      { id: "prospection", title: "Prospection", icon: "🎯", gradient: "from-yellow-500 to-orange-500" },
      { id: "active-client", title: "Active Client", icon: "✅", gradient: "from-green-500 to-emerald-500" },
      { id: "negotiation", title: "Negotiation", icon: "🤝", gradient: "from-blue-500 to-cyan-500" },
      { id: "closed", title: "Closed", icon: "🎉", gradient: "from-purple-500 to-pink-500" }
    ];

    const customColumns: DealColumn[] = customSegments.map(segment => ({
      id: segment.toLowerCase().replace(/\s+/g, '-'),
      title: segment,
      icon: "📁",
      gradient: "from-indigo-500 to-purple-500",
      isCustom: true
    }));
    
    setColumns([...baseColumns, ...customColumns]);
  }, [customSegments]);

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
    const dealId = draggableId;
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;

    if (sourceColumnId === destinationColumnId && source.index === destination.index) {
      return;
    }

    setDeals(prevDeals => {
      const updatedDeals = prevDeals.map(deal => {
        if (deal.id === dealId) {
          // Map column ID to stage
          const stageMap: Record<string, string> = {
            'prospection': 'Prospection',
            'active-client': 'Active Client',
            'negotiation': 'Negotiation',
            'closed': 'Closed'
          };
          
          const newStage = stageMap[destinationColumnId] || 
                          customSegments.find(segment => segment.toLowerCase().replace(/\s+/g, '-') === destinationColumnId) ||
                          destinationColumnId;
          
          return { ...deal, stage: newStage };
        }
        return deal;
      });

      return updatedDeals;
    });

    const destinationColumn = columns.find(col => col.id === destinationColumnId);
    toast.success(`Deal moved to ${destinationColumn?.title || destinationColumnId}`);
  };

  // Handle deal move via selector
  const handleDealMove = (dealId: string, targetColumnId: string) => {
    setDeals(prevDeals => {
      const updatedDeals = prevDeals.map(deal => {
        if (deal.id === dealId) {
          const stageMap: Record<string, string> = {
            'prospection': 'Prospection',
            'active-client': 'Active Client',
            'negotiation': 'Negotiation',
            'closed': 'Closed'
          };
          
          const newStage = stageMap[targetColumnId] || 
                          customSegments.find(segment => segment.toLowerCase().replace(/\s+/g, '-') === targetColumnId) ||
                          targetColumnId;
          
          return { ...deal, stage: newStage };
        }
        return deal;
      });
      return updatedDeals;
    });

    const targetColumn = columns.find(col => col.id === targetColumnId);
    toast.success(`Deal moved to ${targetColumn?.title || targetColumnId}`);
  };

  const removeCustomSegment = useCallback((segmentName: string) => {
    // Remove the custom segment and move deals back to Prospection
    setDeals(prevDeals => 
      prevDeals.map(deal => 
        deal.stage === segmentName 
          ? { ...deal, stage: 'Prospection' }
          : deal
      )
    );
    setCustomSegments(prev => prev.filter(segment => segment !== segmentName));
    toast.success(`Removed custom segment: ${segmentName}`);
  }, []);

  // Empty state when no deals
  if (deals.length === 0) {
    return (
      <div className="bg-white min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-6">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pencil className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
            <p className="text-gray-500 text-sm max-w-md">
              Start by adding contacts in the Contact tab. Contacts with status "Prospection", "Active Client", or custom segments will appear here as deals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div 
        className="bg-white min-h-[calc(100vh-200px)]"
        style={{ 
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}
      >
        {/* Header Section - Compact for tab view */}
        <div className="mb-6 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Pencil className="w-5 h-5" />
                <span>Deals Pipeline</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">{deals.length} deals in pipeline</p>
            </div>
          </div>
        </div>

        {/* Deals Board Container with horizontal scroll */}
        <div className="board-container px-4 sm:px-6">
          <ErrorBoundary>
            <DealsBoard
              columns={columns}
              deals={deals}
              onDealMove={handleDealMove}
              onRemoveCustomSegment={removeCustomSegment}
            />
          </ErrorBoundary>
        </div>

        {/* Add Deal Button - Positioned for tab view */}
        <div className="fixed bottom-8 right-8 z-40">
          <button className="bg-orange-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-orange-700 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add Deal</span>
          </button>
        </div>

        {/* Trello-style custom scrollbar */}
        <style jsx>{`
          .board-container {
            position: relative;
            margin-top: 20px;
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
// import { Plus, MoreHorizontal, Pencil, X } from 'lucide-react';

// interface DealsViewProps {
//   onReconfigure: () => void;
//   contactsFromContactView?: Contact[]; // Contacts passed from ContactsView
// }

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

// interface Deal {
//   id: string;
//   clientName: string;
//   email: string;
//   phone: string;
//   company: string;
//   website: string;
//   role: string;
//   avatar: string;
//   stage: string;
//   lastActivity: string;
// }

// interface Stage {
//   title: string;
//   deals: Deal[];
//   isCustom?: boolean;
// }

// export function DealsView({ onReconfigure, contactsFromContactView = [] }: DealsViewProps) {
//   const { token, user } = useContext(AuthContext);
  
//   // Convert contacts to deals based on their status
//   const convertContactsToDeals = (contacts: Contact[]): Deal[] => {
//     return contacts
//       .filter(contact => contact.status !== 'Supplier') // Exclude suppliers from deals
//       .map(contact => ({
//         id: contact.id,
//         clientName: contact.name,
//         email: contact.email,
//         phone: contact.phone,
//         company: contact.company,
//         website: contact.website,
//         role: contact.company || 'Client', // Use company as role or default to Client
//         avatar: '/api/placeholder/32/32',
//         stage: contact.status === 'Add Segment' ? (contact.customSegment || 'New Segment') : contact.status,
//         lastActivity: contact.lastActivity
//       }));
//   };

//   // Initialize deals from contacts
//   const [deals, setDeals] = useState<Deal[]>([]);
//   const [customSegments, setCustomSegments] = useState<string[]>([]);

//   // Update deals when contacts change
//   useEffect(() => {
//     const newDeals = convertContactsToDeals(contactsFromContactView);
//     setDeals(newDeals);
    
//     // Extract custom segments
//     const segments = contactsFromContactView
//       .filter(contact => contact.status === 'Add Segment' && contact.customSegment)
//       .map(contact => contact.customSegment!)
//       .filter((segment, index, array) => array.indexOf(segment) === index); // Remove duplicates
    
//     setCustomSegments(segments);
//   }, [contactsFromContactView]);

//   // Define default stages
//   const defaultStages = ['Prospection', 'Active Client'];
  
//   // Combine default stages with custom segments
//   const allStageNames = [...defaultStages, ...customSegments];
  
//   const stages: Stage[] = allStageNames.map(stageName => ({
//     title: stageName,
//     deals: deals.filter(d => d.stage === stageName),
//     isCustom: !defaultStages.includes(stageName)
//   }));

//   const getInitials = (name: string) => {
//     return name.split(' ').map(n => n[0]).join('').toUpperCase();
//   };

//   const removeCustomSegment = (segmentName: string) => {
//     // Remove the custom segment and move deals back to Prospection
//     setDeals(prevDeals => 
//       prevDeals.map(deal => 
//         deal.stage === segmentName 
//           ? { ...deal, stage: 'Prospection' }
//           : deal
//       )
//     );
//     setCustomSegments(prev => prev.filter(segment => segment !== segmentName));
//   };

//   // Empty state when no deals
//   if (deals.length === 0) {
//     return (
//       <div className="p-4 sm:p-6 bg-white min-h-screen">
//         <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
//           <div className="mb-6">
//             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Pencil className="w-10 h-10 text-gray-400" />
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
//             <p className="text-gray-500 text-sm max-w-md">
//               Start by adding contacts in the Contacts section. Contacts with status "Prospection", "Active Client", or custom segments will appear here as deals.
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white min-h-screen">
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
//                     {stage.deals.length}
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

//             {/* Mobile Deal Cards */}
//             <div className="p-4 space-y-3">
//               {stage.deals.map((deal) => (
//                 <div
//                   key={deal.id}
//                   className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                 >
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1 min-w-0">
//                       <h4 className="font-medium text-gray-900 text-sm truncate">
//                         {deal.clientName}
//                       </h4>
//                       <p className="text-xs text-gray-500 mt-1 truncate">
//                         {deal.email}
//                       </p>
//                       {deal.phone && (
//                         <p className="text-xs text-gray-500 truncate">
//                           {deal.phone}
//                         </p>
//                       )}
//                     </div>
//                     <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
//                       <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                     </button>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div className="flex-1 min-w-0">
//                       <span className="text-xs text-gray-600 block truncate">
//                         {deal.company || deal.role}
//                       </span>
//                       {deal.website && (
//                         <span className="text-xs text-blue-500 block truncate">
//                           {deal.website}
//                         </span>
//                       )}
//                       <span className="text-xs text-gray-400 block">
//                         {deal.lastActivity}
//                       </span>
//                     </div>
//                     <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
//                       <span className="text-white text-xs font-medium">
//                         {getInitials(deal.clientName)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               ))}

//               {stage.deals.length === 0 && (
//                 <div className="text-center py-8 text-gray-400">
//                   <p className="text-sm">No deals in this stage</p>
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
//                       {stage.deals.length}
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

//               {/* Desktop Deal Cards */}
//               <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
//                 {stage.deals.map((deal) => (
//                   <div
//                     key={deal.id}
//                     className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
//                   >
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex-1 min-w-0">
//                         <h4 className="font-medium text-gray-900 text-sm truncate">
//                           {deal.clientName}
//                         </h4>
//                         <p className="text-xs text-gray-500 mt-1 truncate">
//                           {deal.email}
//                         </p>
//                         {deal.phone && (
//                           <p className="text-xs text-gray-500 truncate">
//                             {deal.phone}
//                           </p>
//                         )}
//                       </div>
//                       <button className="p-1 hover:bg-gray-100 rounded flex-shrink-0">
//                         <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                       </button>
//                     </div>

//                     <div className="flex items-end justify-between">
//                       <div className="flex-1 min-w-0">
//                         <span className="text-xs text-gray-600 block truncate">
//                           {deal.company || deal.role}
//                         </span>
//                         {deal.website && (
//                           <span className="text-xs text-blue-500 block truncate">
//                             {deal.website}
//                           </span>
//                         )}
//                         <span className="text-xs text-gray-400 block mt-1">
//                           {deal.lastActivity}
//                         </span>
//                       </div>
//                       <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
//                         <span className="text-white text-xs font-medium">
//                           {getInitials(deal.clientName)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}

//                 {stage.deals.length === 0 && (
//                   <div className="text-center py-8 text-gray-400">
//                     <p className="text-sm">No deals in this stage</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Add Deal Button */}
//       <div className="fixed bottom-8 right-8">
//         <button className="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
//           <Pencil className="w-5 h-5" />
//           <span className="hidden sm:inline">Add Deal</span>
//         </button>
//       </div>
//     </div>
//   );
// }










































// // "use client";
// // import { useState, useContext } from 'react';
// // import { AuthContext } from "@/lib/context/auth";
// // import { Plus, MoreHorizontal, Pencil } from 'lucide-react';

// // interface DealsViewProps {
// //   onReconfigure: () => void;
// // }

// // interface Deal {
// //   id: string;
// //   clientName: string;
// //   email: string;
// //   role: string;
// //   avatar: string;
// //   stage: 'Prospection' | 'Active Clients' | 'New Segment';
// // }

// // export function DealsView({ onReconfigure }: DealsViewProps) {
// //   const { token, user } = useContext(AuthContext);

// //   // Sample deals data
// //   const deals: Deal[] = [
// //     {
// //       id: '1',
// //       clientName: 'Olivia Anderson',
// //       email: 'oliviaanderson@gmail.com',
// //       role: 'UX Designer',
// //       avatar: '/api/placeholder/32/32',
// //       stage: 'Prospection'
// //     },
// //     {
// //       id: '2',
// //       clientName: 'Olivia Anderson',
// //       email: 'oliviaanderson@gmail.com',
// //       role: 'UX Designer',
// //       avatar: '/api/placeholder/32/32',
// //       stage: 'Prospection'
// //     },
// //     {
// //       id: '3',
// //       clientName: 'Olivia Anderson',
// //       email: 'oliviaanderson@gmail.com',
// //       role: 'UX Designer',
// //       avatar: '/api/placeholder/32/32',
// //       stage: 'Active Clients'
// //     },
// //     {
// //       id: '4',
// //       clientName: 'Olivia Anderson',
// //       email: 'oliviaanderson@gmail.com',
// //       role: 'UX Designer',
// //       avatar: '/api/placeholder/32/32',
// //       stage: 'New Segment'
// //     }
// //   ];

// //   const stages = [
// //     { title: 'Prospection', deals: deals.filter(d => d.stage === 'Prospection') },
// //     { title: 'Active Clients', deals: deals.filter(d => d.stage === 'Active Clients') },
// //     { title: 'New Segment', deals: deals.filter(d => d.stage === 'New Segment') }
// //   ];

// //   const getInitials = (name: string) => {
// //     return name.split(' ').map(n => n[0]).join('').toUpperCase();
// //   };

// //   return (
// //     <div className="p-6 bg-white min-h-screen">
// //       {/* Kanban Board */}
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //         {stages.map((stage) => (
// //           <div key={stage.title} className="bg-white rounded-lg">
// //             {/* Column Header */}
// //             <div className="p-4 border-b border-gray-200">
// //               <div className="flex items-center justify-between">
// //                 <h3 className="font-medium text-gray-900">{stage.title}</h3>
// //                 <button className="p-1 hover:bg-gray-100 rounded">
// //                   <Plus className="w-4 h-4 text-gray-500" />
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Deal Cards */}
// //             <div className="p-4 space-y-3">
// //               {stage.deals.map((deal) => (
// //                 <div
// //                   key={deal.id}
// //                   className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
// //                 >
// //                   <div className="flex items-start justify-between mb-3">
// //                     <div className="flex-1">
// //                       <h4 className="font-medium text-gray-900 text-sm">
// //                         {deal.clientName}
// //                       </h4>
// //                       <p className="text-xs text-gray-500 mt-1">
// //                         {deal.email}
// //                       </p>
// //                     </div>
// //                     <button className="p-1 hover:bg-gray-100 rounded">
// //                       <MoreHorizontal className="w-4 h-4 text-gray-400" />
// //                     </button>
// //                   </div>

// //                   <div className="flex items-center justify-between">
// //                     <span className="text-xs text-gray-600">{deal.role}</span>
// //                     <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
// //                       <span className="text-white text-xs font-medium">
// //                         {getInitials(deal.clientName)}
// //                       </span>
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}

// //               {/* Empty state for columns with no deals */}
// //               {stage.deals.length === 0 && (
// //                 <div className="text-center py-8 text-gray-400">
// //                   <p className="text-sm">No deals in this stage</p>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Add Deal Button */}
// //       <div className="fixed bottom-8 right-8">
// //         <button className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
// //           <Pencil className="w-5 h-5" />
// //           <span>Add Deal</span>
// //         </button>
// //       </div>
// //     </div>
// //   );
// // }