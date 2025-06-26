// components/invoice/TemplateCurrencySelector.tsx
'use client';
import React, { useState } from 'react';
import { 
  Sparkles, 
  Crown, 
  Zap, 
  Diamond, 
  DollarSign, 
  Check, 
  Settings,
  Globe,
  Palette
} from 'lucide-react';
import type { InvoiceTemplate } from '@/lib/types/invoice/types';
import { useInvoiceSettings , CURRENCIES, type Currency } from '@/lib/context/invoices/InvoiceSettingsProvider';

interface TemplateCurrencySelectorProps {
  onComplete?: () => void;
  showOnlyIfNotConfigured?: boolean;
}

export function TemplateCurrencySelector({ 
  onComplete, 
  showOnlyIfNotConfigured = false 
}: TemplateCurrencySelectorProps) {
  const { settings, updateTemplate, updateCurrency } = useInvoiceSettings();
  const [currentStep, setCurrentStep] = useState<'template' | 'currency' | 'complete'>('template');

  // If configured and we only show when not configured, don't render
  if (showOnlyIfNotConfigured && settings.isConfigured) {
    return null;
  }

  const templates = [
    {
      id: 'modern' as const,
      name: 'Modern',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-600',
      description: 'Clean gradient design with modern styling',
      preview: 'Gradient headers, rounded corners, contemporary feel'
    },
    {
      id: 'classic' as const,
      name: 'Classic',
      icon: Crown,
      color: 'from-gray-700 to-gray-900',
      description: 'Traditional business document style',
      preview: 'Bold borders, formal layout, timeless design'
    },
    {
      id: 'minimal' as const,
      name: 'Minimal',
      icon: Zap,
      color: 'from-gray-400 to-gray-600',
      description: 'Simple and clean layout',
      preview: 'Clean lines, lots of white space, elegant simplicity'
    },
    {
      id: 'professional' as const,
      name: 'Professional',
      icon: Diamond,
      color: 'from-indigo-500 to-blue-600',
      description: 'Corporate professional appearance',
      preview: 'Structured layout, business-focused design'
    }
  ];

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    updateTemplate(template);
    setCurrentStep('currency');
  };

  const handleCurrencySelect = (currency: Currency) => {
    updateCurrency(currency);
    setCurrentStep('complete');
    // Auto-complete after a short delay to show success state
    setTimeout(() => {
      onComplete?.();
    }, 1500);
  };

  const handleReconfigure = () => {
    setCurrentStep('template');
  };

  if (currentStep === 'complete') {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">All Set!</h3>
        <p className="text-gray-600 mb-4">
          Your preferences have been saved. You can now create invoices with your selected template and currency.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Template:</span>
            <span className="font-medium">{templates.find(t => t.id === settings.selectedTemplate)?.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Currency:</span>
            <span className="font-medium">{settings.selectedCurrency.code} ({settings.selectedCurrency.symbol})</span>
          </div>
        </div>
        <button
          onClick={handleReconfigure}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Change settings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${
            currentStep === 'template' ? 'text-blue-600' : 'text-green-600'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'template' 
                ? 'bg-blue-600 text-white' 
                : 'bg-green-600 text-white'
            }`}>
              {currentStep === 'template' ? '1' : <Check className="w-4 h-4" />}
            </div>
            <span className="font-medium">Choose Template</span>
          </div>
          
          <div className={`w-12 h-0.5 ${
            currentStep === 'currency' ? 'bg-blue-600' : 'bg-gray-300'
          }`} />
          
          <div className={`flex items-center space-x-2 ${
            currentStep === 'currency' ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep === 'currency' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="font-medium">Select Currency</span>
          </div>
        </div>
      </div>

      {/* Template Selection */}
      {currentStep === 'template' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Template</h2>
            <p className="text-gray-600 text-lg">
              Select a design that matches your brand and style preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = settings.selectedTemplate === template.id;
              
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${template.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 mb-3">{template.description}</p>
                  <p className="text-sm text-gray-500">{template.preview}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Currency Selection */}
      {currentStep === 'currency' && (
        <div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Currency</h2>
            <p className="text-gray-600 text-lg">
              Choose your default currency for all invoices and quotes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {CURRENCIES.map((currency) => {
              const isSelected = settings.selectedCurrency.code === currency.code;
              
              return (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group hover:shadow-md ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">{currency.symbol}</span>
                        <span className="font-medium text-gray-900">{currency.code}</span>
                      </div>
                      <p className="text-sm text-gray-600">{currency.name}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setCurrentStep('template')}
              className="text-gray-600 hover:text-gray-800 underline"
            >
              ← Back to template selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}