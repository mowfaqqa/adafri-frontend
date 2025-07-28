// app/auth/setup/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/lib/context/organization';
import CreateOrganizationModal from '@/components/modals/CreateOrganizationModal';

const OrganizationSetupPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  // Add mounted state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [setupStep, setSetupStep] = useState<'welcome' | 'choose' | 'create'>('welcome');
  const [isLoading, setIsLoading] = useState(true);

  // Only use organization hook after component is mounted
  let hasOrganizations = false;
  let loadOrganizations = async () => {};
  
  try {
    const orgContext = useOrganization();
    hasOrganizations = orgContext.hasOrganizations;
    loadOrganizations = orgContext.loadOrganizations;
  } catch (error) {
    // Context not available yet - will be handled by mounted check
    console.warn('Organization context not available during SSR');
  }

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check authentication and organization status
  useEffect(() => {
    if (!isMounted) return;

    const checkStatus = async () => {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      // Load organizations to check if user already has any
      await loadOrganizations();
      
      if (hasOrganizations) {
        router.push('/dashboard');
        return;
      }

      setIsLoading(false);
    };

    checkStatus();
  }, [isMounted, isAuthenticated, hasOrganizations, router, loadOrganizations]);

  // Handle create organization success
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    router.push('/dashboard');
  };

  // Handle step transitions
  const nextStep = () => {
    if (setupStep === 'welcome') {
      setSetupStep('choose');
    } else if (setupStep === 'choose') {
      setSetupStep('create');
      setShowCreateModal(true);
    }
  };

  // Show loading until mounted and ready
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Welcome Step */}
        {setupStep === 'welcome' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to the Platform, {user?.first_name || 'there'}! 👋
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
              To get started, you'll need to be part of an organization. This helps us organize your workspace and team collaboration.
            </p>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">What you can do:</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Create Organization</h3>
                  <p className="text-sm text-gray-600">Start your own workspace and invite team members</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Join via Invitation</h3>
                  <p className="text-sm text-gray-600">Use an invitation link from your team</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Collaborate</h3>
                  <p className="text-sm text-gray-600">Work together with your team seamlessly</p>
                </div>
              </div>
            </div>

            <button
              onClick={nextStep}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="font-medium">Let's Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Choose Step */}
        {setupStep === 'choose' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              How would you like to proceed?
            </h1>
            
            <p className="text-gray-600 mb-8">
              Choose the option that best fits your situation
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Create Organization Option */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="group p-8 bg-white rounded-2xl shadow-lg border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Create New Organization
                </h3>
                
                <p className="text-gray-600 mb-4">
                  Start your own workspace and become the organization owner. You'll be able to invite team members and manage settings.
                </p>
                
                <div className="flex items-center space-x-2 text-blue-600 font-medium">
                  <span>Create Organization</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Join Organization Option */}
              <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-200 opacity-75">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-gray-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Join via Invitation
                </h3>
                
                <p className="text-gray-600 mb-4">
                  If you have an invitation link from your team, you can use it to join their organization directly.
                </p>
                
                <div className="flex items-center space-x-2 text-gray-400 font-medium">
                  <span>Check your email for invitation links</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setSetupStep('welcome')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* Success Step - Shows after organization creation */}
        {setupStep === 'create' && !showCreateModal && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Organization Created Successfully! 🎉
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your workspace is ready. You can now access all platform features and invite team members.
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <span className="font-medium">Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSetupStep('choose');
        }}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default OrganizationSetupPage;