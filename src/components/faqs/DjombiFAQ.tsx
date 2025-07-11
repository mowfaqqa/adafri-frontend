// components/DjombiFAQComponent.tsx
"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Settings, Shield, AlertTriangle, CheckCircle, ExternalLink, Search } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  category: string;
  icon: React.JSX.Element;
  answer: React.JSX.Element;
}

interface OpenItems {
  [key: string]: boolean;
}

export default function DjombiFAQComponent(): React.JSX.Element {
  const [openItems, setOpenItems] = useState<OpenItems>({});
  const [searchTerm, setSearchTerm] = useState<string>('');

  const toggleItem = (id: string): void => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqData: FAQ[] = [
    {
      id: 'gmail-connection',
      question: 'How do I connect my Gmail account to Djombi?',
      category: 'Email Integration',
      icon: <Mail className="w-5 h-5" />,
      answer: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Security First</span>
            </div>
            <p className="text-blue-700 text-sm">Gmail requires an App Password for third-party apps like Djombi. Never use your regular Gmail password.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                        <p className="font-medium">Open Google Account Settings</p>
                        <p className="text-gray-600 text-sm">
                        Navigate to{" "}
                        <a
                            href="https://myaccount.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center"
                        >
                            https://myaccount.google.com
                            <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                        </p>
                    </div>
            </div>

            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Go to Security Tab</p>
                <p className="text-gray-600 text-sm">Click on the "Security" section in the left sidebar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Enable 2-Step Verification</p>
                <p className="text-gray-600 text-sm">Under "Signing in to Google", enable 2-Step Verification if not already active</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium">Generate App Password</p>
                <p className="text-gray-600 text-sm">Search for "App Passwords" option on Search field (appears after 2-Step is enabled)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <p className="font-medium">Configure App Password</p>
                <p className="text-gray-600 text-sm">Select "Mail" as app, "Other" as device (name it "Djombi"), then generate</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">6</div>
              <div>
                <p className="font-medium">Copy the 16-Character Password</p>
                <p className="text-gray-600 text-sm">Save this password securely - you'll need it for Djombi setup</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Pro Tip</span>
            </div>
            <p className="text-green-700 text-sm">Keep your app password safe! You can always generate a new one if needed, but you'll need to update it in Djombi.</p>
          </div>
        </div>
      )
    },
    {
      id: 'yahoo-connection',
      question: 'How do I link my Yahoo Mail to Djombi?',
      category: 'Email Integration',
      icon: <Mail className="w-5 h-5" />,
      answer: (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-semibold text-purple-800">Yahoo Security</span>
            </div>
            <p className="text-purple-700 text-sm">Yahoo requires either an App Password or IMAP access for third-party applications.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Sign in to Yahoo Mail</p>
                <p className="text-gray-600 text-sm">Go to your Yahoo Mail account settings</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Navigate to Account Security</p>
                <p className="text-gray-600 text-sm">Click on your profile → Account Info → Account Security</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Generate App Password</p>
                <p className="text-gray-600 text-sm">Look for "App Passwords" and create a new one for "Djombi"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium">Alternative: Enable IMAP</p>
                <p className="text-gray-600 text-sm">Go to Settings → More Settings → Mailboxes → IMAP Access (Enable)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
              <span className="font-semibold text-amber-800">Important Note</span>
            </div>
            <p className="text-amber-700 text-sm">If you can't find App Passwords, try enabling "Less secure app access" in Account Security, but App Passwords are more secure.</p>
          </div>
        </div>
      )
    },
    {
      id: 'custom-email',
      question: 'How do I connect my custom email (e.g., daniel@adafri.net)?',
      category: 'Email Integration',
      icon: <Settings className="w-5 h-5" />,
      answer: (
        <div className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
            <div className="flex items-center mb-2">
              <Settings className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="font-semibold text-indigo-800">Custom Domain Setup</span>
            </div>
            <p className="text-indigo-700 text-sm">You'll need IMAP and SMTP settings from your email provider or hosting service.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Gather Your Email Settings</p>
                <p className="text-gray-600 text-sm">Contact your hosting provider or check your email client for these details</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3">Required Information:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">IMAP Settings (Incoming)</p>
                  <p className="text-gray-600">Host: imap.adafri.net</p>
                  <p className="text-gray-600">Port: 993 (SSL) or 143</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">SMTP Settings (Outgoing)</p>
                  <p className="text-gray-600">Host: smtp.adafri.net</p>
                  <p className="text-gray-600">Port: 465 (SSL) or 587 (TLS)</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Authentication Details</p>
                <p className="text-gray-600 text-sm">Use your full email address and regular password (unless your provider requires an app password)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Security Settings</p>
                <p className="text-gray-600 text-sm">Choose SSL/TLS encryption for secure connection</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Common Providers</span>
            </div>
            <p className="text-blue-700 text-sm">cPanel, Namecheap, GoDaddy, and most web hosts provide these settings in their email section or documentation.</p>
          </div>
        </div>
      )
    },
    {
      id: 'djombi-input',
      question: 'Where do I input my email details in Djombi?',
      category: 'App Navigation',
      icon: <Settings className="w-5 h-5" />,
      answer: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Access Settings</p>
                <p className="text-gray-600 text-sm">Click on the <strong>Settings</strong> icon in the main navigation menu</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Find Email Integration</p>
                <p className="text-gray-600 text-sm">Look for <strong>Email Integration</strong> or <strong>Email Setup</strong> section</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Choose Provider</p>
                <p className="text-gray-600 text-sm">Select your email provider (Gmail, Yahoo, Outlook) or choose <strong>"Custom"</strong> for personal domains</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium">Fill Required Fields</p>
                <div className="text-gray-600 text-sm mt-1">
                  <p>• <strong>Email Address:</strong> Your full email</p>
                  <p>• <strong>Password:</strong> App password or regular password</p>
                  <p>• <strong>SMTP Host & Port:</strong> For sending emails</p>
                  <p>• <strong>IMAP Host & Port:</strong> For receiving emails</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <p className="font-medium">Test & Save</p>
                <p className="text-gray-600 text-sm">Click <strong>"Test Connection"</strong> then <strong>"Save"</strong> when successful</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-800">Quick Access</span>
            </div>
            <p className="text-green-700 text-sm">Look for the gear icon (⚙️) in the top navigation bar or sidebar menu to access Settings quickly.</p>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      question: 'What if my email isn\'t sending?',
      category: 'Troubleshooting',
      icon: <AlertTriangle className="w-5 h-5" />,
      answer: (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-red-800">Common Issues</span>
            </div>
            <p className="text-red-700 text-sm">Most email sending issues are due to incorrect settings or authentication problems.</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <p className="font-medium">Verify IMAP/SMTP Settings</p>
                <p className="text-gray-600 text-sm">Double-check host addresses, ports, and encryption settings</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <p className="font-medium">Check Password Type</p>
                <p className="text-gray-600 text-sm">Ensure you're using an App Password (not regular password) for Gmail, Yahoo, and Outlook</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <p className="font-medium">Test Internet Connection</p>
                <p className="text-gray-600 text-sm">Ensure you have a stable internet connection</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <p className="font-medium">Check Firewall/Antivirus</p>
                <p className="text-gray-600 text-sm">Ensure ports 465, 587, and 993 aren't blocked</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <p className="font-medium">Try Alternative Ports</p>
                <p className="text-gray-600 text-sm">If 465 doesn't work, try 587 for SMTP</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Quick Diagnosis:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span><strong>Connection timeout:</strong> Check SMTP host and port</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><strong>Authentication failed:</strong> Verify app password</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span><strong>TLS/SSL error:</strong> Try different encryption settings</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <div className="flex items-center mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Still Having Issues?</span>
            </div>
            <p className="text-blue-700 text-sm">Contact your email provider to confirm the correct IMAP/SMTP settings for your domain.</p>
          </div>
        </div>
      )
    }
  ];

  const filteredFAQs: FAQ[] = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories: string[] = [...new Set(faqData.map(faq => faq.category))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search FAQs..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <div key={category} className="px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:shadow-md transition-all duration-200">
            {category}
          </div>
        ))}
      </div>

      {/* FAQ Items */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <div key={faq.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
            <button
              onClick={() => toggleItem(faq.id)}
              className="w-full px-6 py-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              type="button"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
                    {faq.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    <p className="text-sm text-gray-500">{faq.category}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {openItems[faq.id] ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 transform transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 transform transition-transform duration-200" />
                  )}
                </div>
              </div>
            </button>
            
            {openItems[faq.id] && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No FAQs found matching your search.</div>
          <p className="text-gray-500 mt-2">Try searching for different keywords or browse all categories.</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h3>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help you get connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
              type="button"
            >
              Contact Support
            </button>
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200"
              type="button"
            >
              Join Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}