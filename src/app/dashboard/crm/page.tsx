"use client";
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from "@/lib/context/auth";
import { ConfigurationModal } from '@/components/crm/ConfigurationModal';
import { B2CFlowManager } from '@/components/crm/b2c/B2CFlowManager';
import { B2BFlowManager } from '@/components/crm/b2b/B2BFlowManager';

type ActivityType = 'B2C' | 'B2B' | 'B2B2C' | 'B2G';

// DEVELOPMENT MODE: Set to false for production
const DEVELOPMENT_MODE = true;

export default function CRMPage() {
  const [showConfiguration, setShowConfiguration] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const { token, user } = useContext(AuthContext);

  useEffect(() => {
    if (!DEVELOPMENT_MODE) {
      // PRODUCTION CODE: Check if user has already configured their dashboard
      const hasConfigured = localStorage.getItem('crm_configured');
      const savedActivity = localStorage.getItem('crm_activity_type') as ActivityType;
      
      if (hasConfigured && savedActivity) {
        setSelectedActivity(savedActivity);
        setShowConfiguration(false);
      } else {
        setShowConfiguration(true);
      }
    }
    // In development mode, always show configuration modal on load
  }, []); // Empty dependency array is now safe since DEVELOPMENT_MODE is a constant

  const handleActivitySelect = (activity: string) => {
    const activityType = activity as ActivityType;
    setSelectedActivity(activityType);
    
    if (!DEVELOPMENT_MODE) {
      // PRODUCTION CODE: Save configuration
      localStorage.setItem('crm_configured', 'true');
      localStorage.setItem('crm_activity_type', activity);
    }
    
    setShowConfiguration(false);
    console.log(`Selected activity: ${activity} - Dashboard loaded`);
  };

  const handleReconfigure = () => {
    if (!DEVELOPMENT_MODE) {
      // PRODUCTION CODE: Clear saved configuration
      localStorage.removeItem('crm_configured');
      localStorage.removeItem('crm_activity_type');
    }
    
    setSelectedActivity(null);
    setShowConfiguration(true);
  };

  const renderFlowManager = () => {
    if (!selectedActivity) return null;

    switch (selectedActivity) {
      case 'B2C':
        return <B2CFlowManager onReconfigure={handleReconfigure} />;
      case 'B2B':
      case 'B2B2C':
      case 'B2G':
        return (
          <B2BFlowManager 
            onReconfigure={handleReconfigure} 
            activityType={selectedActivity}
          />
        );
      default:
        return (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">
                {selectedActivity} Dashboard
              </h1>
              <p className="text-gray-600 mb-4">
                This activity type is not yet implemented.
              </p>
              <button
                onClick={handleReconfigure}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Reconfigure Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Development Mode Indicator */}
      {DEVELOPMENT_MODE && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm">
          <strong>Development Mode:</strong> Configuration persistence is disabled. You can switch between different activity types freely.
        </div>
      )}

      {/* Configuration Modal */}
      <ConfigurationModal 
        isOpen={showConfiguration}
        onClose={() => setShowConfiguration(false)}
        onActivitySelect={handleActivitySelect}
      />

      {/* Main CRM Content */}
      {!showConfiguration && selectedActivity && (
        <div className="min-h-screen">
          {renderFlowManager()}
        </div>
      )}

      {/* Loading State */}
      {!showConfiguration && !selectedActivity && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your CRM dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
}
































// "use client";
// import { useState, useEffect, useContext } from 'react';
// import { AuthContext } from "@/lib/context/auth";
// import { ConfigurationModal } from '@/components/crm/ConfigurationModal';
// import { B2CFlowManager } from '@/components/crm/b2c/B2CFlowManager';

// export default function CRMPage() {
//   const [showConfiguration, setShowConfiguration] = useState(true); // reset back to true for initial load
//   const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
//   const { token, user } = useContext(AuthContext);

//   useEffect(() => {
//     // Check if user has already configured their dashboard
//     const hasConfigured = localStorage.getItem('crm_configured');
//     if (!hasConfigured) {
//       setShowConfiguration(true);
//     }
//   }, []);

//   const handleActivitySelect = (activity: string) => {
//     setSelectedActivity(activity);
    
//     if (activity === 'B2C') {
//       // For B2C, show the contacts view (second image)
//       localStorage.setItem('crm_configured', 'true');
//       localStorage.setItem('crm_activity_type', activity);
//       setShowConfiguration(false); // reset back to true for initial load
//     } else {
//       // For B2B, B2B2C, B2G - redirect to another page (to be implemented later)
//       localStorage.setItem('crm_configured', 'true');
//       localStorage.setItem('crm_activity_type', activity);
//       setShowConfiguration(false);
//       // TODO: Navigate to the other page for B2B, B2B2C, B2G
//       console.log(`Selected activity: ${activity} - Navigate to other page`);
//     }
//   };

//   const handleReconfigure = () => {
//     setShowConfiguration(true);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Configuration Modal */}
//       <ConfigurationModal 
//         isOpen={showConfiguration}
//         onClose={() => setShowConfiguration(false)}
//         onActivitySelect={handleActivitySelect}
//       />

//       {/* Main CRM Content */}
//       {!showConfiguration && selectedActivity === 'B2C' && (
//         <B2CFlowManager onReconfigure={handleReconfigure} />
//       )}

//       {/* Placeholder for other activity types */}
//       {!showConfiguration && selectedActivity && selectedActivity !== 'B2C' && (
//         <div className="p-6">
//           <div className="max-w-4xl mx-auto">
//             <h1 className="text-2xl font-bold mb-4">
//               {selectedActivity} Dashboard
//             </h1>
//             <p className="text-gray-600 mb-4">
//               This is a placeholder for {selectedActivity} functionality.
//             </p>
//             <button
//               onClick={handleReconfigure}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Reconfigure Dashboard
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }