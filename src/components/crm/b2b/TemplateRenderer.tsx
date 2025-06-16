"use client";
import React from 'react';
import { Building, User } from 'lucide-react';
import type { DocumentData, InvoiceTemplate } from '@/lib/types/invoice/types';

interface TemplateRendererProps {
  document: DocumentData;
  template: InvoiceTemplate;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({ document, template }) => {
  const templates = {
    modern: (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl shadow-2xl border border-blue-200">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              {document.companyInfo.logo && (
                <img 
                  src={document.companyInfo.logo} 
                  alt={document.companyInfo.name} 
                  className="h-12 w-auto mb-2"
                />
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {document.companyInfo.name}
              </h1>
              <div className="text-gray-600 text-sm space-y-1">
                <p>{document.companyInfo.email}</p>
                <p>{document.companyInfo.phone}</p>
                <div className="whitespace-pre-line">{document.companyInfo.address}</div>
              </div>
            </div>
            <div className="text-right bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl text-white">
              <div className="text-lg font-bold">{document.type.toUpperCase()}</div>
              <div className="text-sm opacity-90">#{document.invoiceNumber}</div>
              <div className="text-xs opacity-75 mt-1">{new Date(document.date).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-3 rounded-xl">
              <h3 className="font-semibold text-blue-800 mb-1 text-sm">From:</h3>
              <p className="text-gray-700 text-sm">{document.companyInfo.name}</p>
              <div className="text-gray-600 text-xs whitespace-pre-line">{document.companyInfo.address}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">{document.type === 'invoice' ? 'Bill To:' : 'Quote For:'}</h3>
              <p className="text-gray-700 text-sm font-medium">{document.toCompany}</p>
              <p className="text-gray-600 text-xs">{document.toContact}</p>
              <div className="text-gray-600 text-xs whitespace-pre-line">{document.toAddress}</div>
              <p className="text-gray-600 text-xs">{document.toEmail}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-3 whitespace-pre-line">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="space-y-2 min-w-[250px]">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${document.subtotal.toFixed(2)}</span>
              </div>
              {document.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({document.discountRate}%):</span>
                  <span>-${document.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({document.taxRate}%):</span>
                <span>${document.taxAmount.toFixed(2)}</span>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">${document.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {(document.notes || document.terms) && (
            <div className="mt-6 space-y-3">
              {document.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Notes:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{document.notes}</p>
                </div>
              )}
              {document.terms && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-1">Terms & Conditions:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{document.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    ),

    classic: (
      <div className="bg-white p-6 border-4 border-gray-800 shadow-2xl">
        <div className="text-center border-b-4 border-gray-800 pb-4 mb-6">
          {document.companyInfo.logo && (
            <img 
              src={document.companyInfo.logo} 
              alt={document.companyInfo.name} 
              className="h-16 w-auto mx-auto mb-3"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{document.companyInfo.name}</h1>
          <div className="text-gray-600 text-sm space-y-1">
            <p>{document.companyInfo.email} | {document.companyInfo.phone}</p>
            <div className="whitespace-pre-line">{document.companyInfo.address}</div>
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-800 pb-1">
            {document.type.toUpperCase()}
          </h2>
          <div className="text-right text-sm space-y-1">
            <div><strong>Number:</strong> {document.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(document.date).toLocaleDateString()}</div>
            <div><strong>{document.type === 'invoice' ? 'Due Date:' : 'Valid Until:'}</strong> {new Date(document.type === 'invoice' ? document.dueDate : document.validUntil || '').toLocaleDateString()}</div>
            <div><strong>Status:</strong> {document.status}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">FROM:</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{document.companyInfo.name}</p>
              <div className="whitespace-pre-line text-gray-700">{document.companyInfo.address}</div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 border-b border-gray-400 pb-1 mb-2">{document.type === 'invoice' ? 'BILL TO:' : 'QUOTE FOR:'}</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{document.toCompany}</p>
              <p>{document.toContact}</p>
              <div className="whitespace-pre-line text-gray-700">{document.toAddress}</div>
              <p>{document.toEmail}</p>
            </div>
          </div>
        </div>

        <table className="w-full border-4 border-gray-800 mb-4 text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 text-left font-bold">DESCRIPTION</th>
              <th className="p-3 text-center font-bold">QTY</th>
              <th className="p-3 text-right font-bold">UNIT PRICE</th>
              <th className="p-3 text-right font-bold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id}>
                <td className="border-2 border-gray-400 p-3 whitespace-pre-line">{item.description}</td>
                <td className="border-2 border-gray-400 p-3 text-center">{item.quantity}</td>
                <td className="border-2 border-gray-400 p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="border-2 border-gray-400 p-3 text-right font-bold">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-4">
          <div className="text-right space-y-2">
            <div className="flex justify-between min-w-[200px]">
              <span className="font-bold">SUBTOTAL:</span>
              <span>${document.subtotal.toFixed(2)}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="font-bold">DISCOUNT:</span>
                <span>-${document.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-bold">TAX:</span>
              <span>${document.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-4 border-gray-800 bg-gray-800 text-white p-3 text-center">
              <div className="text-lg font-bold">TOTAL: ${document.total.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {(document.notes || document.terms) && (
          <div className="border-t-2 border-gray-800 pt-4 space-y-3">
            {document.notes && (
              <div>
                <h4 className="font-bold text-gray-900 mb-1">NOTES:</h4>
                <p className="text-sm whitespace-pre-line">{document.notes}</p>
              </div>
            )}
            {document.terms && (
              <div>
                <h4 className="font-bold text-gray-900 mb-1">TERMS & CONDITIONS:</h4>
                <p className="text-sm whitespace-pre-line">{document.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    ),

    minimal: (
      <div className="bg-white p-6 shadow-2xl rounded-lg">
        <div className="flex justify-between items-start mb-8">
          <div>
            {document.companyInfo.logo && (
              <img 
                src={document.companyInfo.logo} 
                alt={document.companyInfo.name} 
                className="h-10 w-auto mb-3"
              />
            )}
            <h1 className="text-xl font-light text-gray-900">{document.companyInfo.name}</h1>
            <div className="text-gray-500 text-sm mt-1 space-y-1">
              <p>{document.companyInfo.email}</p>
              <div className="whitespace-pre-line">{document.companyInfo.address}</div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-2xl font-thin text-gray-400">{document.type}</div>
            <div className="text-lg font-medium">#{document.invoiceNumber}</div>
            <div className="text-sm text-gray-500">{new Date(document.date).toLocaleDateString()}</div>
            <div className="text-xs text-gray-400">{document.status}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="text-gray-500 uppercase text-xs mb-1 tracking-wide">From</div>
            <div className="font-medium">{document.companyInfo.name}</div>
            <div className="text-sm text-gray-600 whitespace-pre-line">{document.companyInfo.address}</div>
          </div>
          <div>
            <div className="text-gray-500 uppercase text-xs mb-1 tracking-wide">{document.type === 'invoice' ? 'Bill To' : 'Quote For'}</div>
            <div className="font-medium">{document.toCompany}</div>
            <div className="text-sm text-gray-600">{document.toContact}</div>
            <div className="text-sm text-gray-600 whitespace-pre-line">{document.toAddress}</div>
          </div>
        </div>

        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
              <th className="text-center py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</th>
              <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Unit Price</th>
              <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3 whitespace-pre-line">{item.description}</td>
                <td className="py-3 text-center">{item.quantity}</td>
                <td className="py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="py-3 text-right font-medium">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="space-y-2 min-w-[250px]">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span>${document.subtotal.toFixed(2)}</span>
            </div>
            {document.discountAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span>Discount ({document.discountRate}%)</span>
                <span>-${document.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax ({document.taxRate}%)</span>
              <span>${document.taxAmount.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-gray-200 pt-2">
              <div className="flex justify-between items-center text-lg font-medium">
                <span>Total</span>
                <span>${document.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {(document.notes || document.terms) && (
          <div className="mt-8 space-y-4">
            {document.notes && (
              <div>
                <div className="text-gray-500 uppercase text-xs mb-2 tracking-wide">Notes</div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{document.notes}</p>
              </div>
            )}
            {document.terms && (
              <div>
                <div className="text-gray-500 uppercase text-xs mb-2 tracking-wide">Terms & Conditions</div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{document.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    ),

    professional: (
      <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              {document.companyInfo.logo && (
                <img 
                  src={document.companyInfo.logo} 
                  alt={document.companyInfo.name} 
                  className="h-12 w-auto mb-3 brightness-0 invert"
                />
              )}
              <h1 className="text-xl font-bold mb-1">{document.companyInfo.name}</h1>
              <div className="text-blue-100 text-sm space-y-1">
                <p>{document.companyInfo.email}</p>
                <p>{document.companyInfo.phone}</p>
                <div className="whitespace-pre-line">{document.companyInfo.address}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{document.type.toUpperCase()}</div>
              <div className="text-lg">#{document.invoiceNumber}</div>
              <div className="text-sm opacity-90 mt-1">{new Date(document.date).toLocaleDateString()}</div>
              <div className="text-xs opacity-75">Status: {document.status}</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center text-gray-800 text-sm">
                <Building className="w-4 h-4 mr-2 text-indigo-600" />
                Company Details
              </h3>
              <div className="text-gray-600 text-sm space-y-1">
                <p className="font-medium">{document.companyInfo.name}</p>
                <div className="whitespace-pre-line">{document.companyInfo.address}</div>
                <p>{document.companyInfo.email}</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center text-gray-800 text-sm">
                <User className="w-4 h-4 mr-2 text-blue-600" />
                {document.type === 'invoice' ? 'Billing Information' : 'Quote Information'}
              </h3>
              <div className="text-gray-600 text-sm space-y-1">
                <p className="font-medium">{document.toCompany}</p>
                <p>{document.toContact}</p>
                <div className="whitespace-pre-line">{document.toAddress}</div>
                <p>{document.toEmail}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-center">Quantity</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {document.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 whitespace-pre-line">{item.description}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="space-y-2 min-w-[250px]">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${document.subtotal.toFixed(2)}</span>
              </div>
              {document.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount ({document.discountRate}%):</span>
                  <span>-${document.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({document.taxRate}%):</span>
                <span>${document.taxAmount.toFixed(2)}</span>
              </div>
              <div className="bg-indigo-600 text-white p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">${document.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {(document.notes || document.terms) && (
            <div className="mt-6 space-y-4">
              {document.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    Notes
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{document.notes}</p>
                </div>
              )}
              {document.terms && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                    Terms & Conditions
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{document.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  };

  return templates[template];
};