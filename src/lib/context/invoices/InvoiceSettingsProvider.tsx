// contexts/InvoiceSettingsContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { InvoiceTemplate } from '@/lib/types/invoice/types';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  region?: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', region: 'USA, Global reserve' },
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'Eurozone' },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'United Kingdom' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Japan' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', region: 'Nigeria' },
  { code: 'XOF', symbol: 'Fr', name: 'West African CFA Franc', region: 'West Africa' },
  { code: 'XAF', symbol: 'Fr', name: 'Central African CFA Franc', region: 'Central Africa' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', region: 'China' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', region: 'Switzerland' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', region: 'Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', region: 'Australia' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'India' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', region: 'South Korea' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', region: 'Singapore' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', region: 'Hong Kong' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', region: 'New Zealand' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', region: 'Sweden' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', region: 'Norway' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', region: 'Denmark' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', region: 'Brazil' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', region: 'Russia' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', region: 'Mexico' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', region: 'South Africa' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', region: 'Turkey' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: 'Saudi Arabia' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: 'UAE' },
  { code: 'ILS', symbol: '₪', name: 'Israeli New Shekel', region: 'Israel' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', region: 'Malaysia' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', region: 'Thailand' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', region: 'Indonesia' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound', region: 'Egypt' },
];

// Popular currencies that will be shown as buttons
export const POPULAR_CURRENCIES = CURRENCIES.slice(0, 8);

// Other currencies that will be in the dropdown
export const OTHER_CURRENCIES = CURRENCIES.slice(8);

interface InvoiceSettings {
  selectedTemplate: InvoiceTemplate;
  selectedCurrency: Currency;
  isConfigured: boolean;
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings;
  updateTemplate: (template: InvoiceTemplate) => void;
  updateCurrency: (currency: Currency) => void;
  resetSettings: () => void;
  formatCurrency: (amount: number) => string;
}

const defaultSettings: InvoiceSettings = {
  selectedTemplate: 'modern',
  selectedCurrency: CURRENCIES[0], // USD as default
  isConfigured: false,
};

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

export function InvoiceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('invoiceSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          selectedTemplate: parsed.selectedTemplate || defaultSettings.selectedTemplate,
          selectedCurrency: parsed.selectedCurrency || defaultSettings.selectedCurrency,
          isConfigured: parsed.isConfigured || false,
        });
      }
    } catch (error) {
      console.error('Failed to load invoice settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('invoiceSettings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save invoice settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateTemplate = (template: InvoiceTemplate) => {
    setSettings(prev => ({
      ...prev,
      selectedTemplate: template,
      isConfigured: true,
    }));
  };

  const updateCurrency = (currency: Currency) => {
    setSettings(prev => ({
      ...prev,
      selectedCurrency: currency,
      isConfigured: true,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('invoiceSettings');
  };

  const formatCurrency = (amount: number): string => {
    const { symbol, code } = settings.selectedCurrency;
    
    // Handle different currency formatting - All currencies display symbol before amount
    switch (code) {
      case 'JPY':
      case 'KRW':
        // No decimal places for JPY and KRW
        return `${symbol}${Math.round(amount).toLocaleString()}`;
      default:
        // All other currencies display symbol before amount with 2 decimal places
        return `${symbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <InvoiceSettingsContext.Provider
      value={{
        settings,
        updateTemplate,
        updateCurrency,
        resetSettings,
        formatCurrency,
      }}
    >
      {children}
    </InvoiceSettingsContext.Provider>
  );
}

export function useInvoiceSettings() {
  const context = useContext(InvoiceSettingsContext);
  if (context === undefined) {
    throw new Error('useInvoiceSettings must be used within an InvoiceSettingsProvider');
  }
  return context;
}



































// 7/4/2025
// // contexts/InvoiceSettingsContext.tsx
// 'use client';
// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import type { InvoiceTemplate } from '@/lib/types/invoice/types';

// export interface Currency {
//   code: string;
//   symbol: string;
//   name: string;
// }

// export const CURRENCIES: Currency[] = [
//   { code: 'USD', symbol: '$', name: 'US Dollar' },
//   { code: 'EUR', symbol: '€', name: 'Euro' },
//   { code: 'GBP', symbol: '£', name: 'British Pound' },
//   { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
//   { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
//   { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
//   { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
//   { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
// ];

// interface InvoiceSettings {
//   selectedTemplate: InvoiceTemplate;
//   selectedCurrency: Currency;
//   isConfigured: boolean;
// }

// interface InvoiceSettingsContextType {
//   settings: InvoiceSettings;
//   updateTemplate: (template: InvoiceTemplate) => void;
//   updateCurrency: (currency: Currency) => void;
//   resetSettings: () => void;
//   formatCurrency: (amount: number) => string;
// }

// const defaultSettings: InvoiceSettings = {
//   selectedTemplate: 'modern',
//   selectedCurrency: CURRENCIES[0], // USD as default
//   isConfigured: false,
// };

// const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

// export function InvoiceSettingsProvider({ children }: { children: ReactNode }) {
//   const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
//   const [isLoaded, setIsLoaded] = useState(false);

//   // Load settings from localStorage on mount
//   useEffect(() => {
//     try {
//       const savedSettings = localStorage.getItem('invoiceSettings');
//       if (savedSettings) {
//         const parsed = JSON.parse(savedSettings);
//         setSettings({
//           selectedTemplate: parsed.selectedTemplate || defaultSettings.selectedTemplate,
//           selectedCurrency: parsed.selectedCurrency || defaultSettings.selectedCurrency,
//           isConfigured: parsed.isConfigured || false,
//         });
//       }
//     } catch (error) {
//       console.error('Failed to load invoice settings:', error);
//     } finally {
//       setIsLoaded(true);
//     }
//   }, []);

//   // Save settings to localStorage whenever they change
//   useEffect(() => {
//     if (isLoaded) {
//       try {
//         localStorage.setItem('invoiceSettings', JSON.stringify(settings));
//       } catch (error) {
//         console.error('Failed to save invoice settings:', error);
//       }
//     }
//   }, [settings, isLoaded]);

//   const updateTemplate = (template: InvoiceTemplate) => {
//     setSettings(prev => ({
//       ...prev,
//       selectedTemplate: template,
//       isConfigured: true,
//     }));
//   };

//   const updateCurrency = (currency: Currency) => {
//     setSettings(prev => ({
//       ...prev,
//       selectedCurrency: currency,
//       isConfigured: true,
//     }));
//   };

//   const resetSettings = () => {
//     setSettings(defaultSettings);
//     localStorage.removeItem('invoiceSettings');
//   };

//   const formatCurrency = (amount: number): string => {
//     const { symbol, code } = settings.selectedCurrency;
    
//     // Handle different currency formatting
//     switch (code) {
//       case 'JPY':
//         return `${symbol}${Math.round(amount).toLocaleString()}`;
//       case 'USD':
//       case 'CAD':
//       case 'AUD':
//         return `${symbol}${amount.toFixed(2)}`;
//       case 'EUR':
//         return `${amount.toFixed(2)}${symbol}`;
//       case 'GBP':
//         return `${symbol}${amount.toFixed(2)}`;
//       case 'NGN':
//         return `${symbol}${amount.toFixed(2)}`;
//       case 'INR':
//         return `${symbol}${amount.toFixed(2)}`;
//       default:
//         return `${symbol}${amount.toFixed(2)}`;
//     }
//   };

//   return (
//     <InvoiceSettingsContext.Provider
//       value={{
//         settings,
//         updateTemplate,
//         updateCurrency,
//         resetSettings,
//         formatCurrency,
//       }}
//     >
//       {children}
//     </InvoiceSettingsContext.Provider>
//   );
// }

// export function useInvoiceSettings() {
//   const context = useContext(InvoiceSettingsContext);
//   if (context === undefined) {
//     throw new Error('useInvoiceSettings must be used within an InvoiceSettingsProvider');
//   }
//   return context;
// }