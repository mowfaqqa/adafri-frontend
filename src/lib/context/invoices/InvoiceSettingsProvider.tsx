// contexts/InvoiceSettingsContext.tsx
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { InvoiceTemplate } from '@/lib/types/invoice/types';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

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
    
    // Handle different currency formatting
    switch (code) {
      case 'JPY':
        return `${symbol}${Math.round(amount).toLocaleString()}`;
      case 'USD':
      case 'CAD':
      case 'AUD':
        return `${symbol}${amount.toFixed(2)}`;
      case 'EUR':
        return `${amount.toFixed(2)}${symbol}`;
      case 'GBP':
        return `${symbol}${amount.toFixed(2)}`;
      case 'NGN':
        return `${symbol}${amount.toFixed(2)}`;
      case 'INR':
        return `${symbol}${amount.toFixed(2)}`;
      default:
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