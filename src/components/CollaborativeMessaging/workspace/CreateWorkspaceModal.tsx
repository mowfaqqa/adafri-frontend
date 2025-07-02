import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Upload, X, Sparkles, Users, Target } from 'lucide-react';

import Modal from '@/components/custom-ui/modal/Modal';
import Button from '@/components/custom-ui/button';
import Input from '@/components/custom-ui/input';
import useModalStore from '@/lib/store/messaging/modalStore';
import useWorkspaceStore from '@/lib/store/messaging/workspaceStore';

interface CreateWorkspaceFormValues {
  name: string;
  description: string;
  logo?: FileList;
}

const CreateWorkspaceModal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { createWorkspace } = useWorkspaceStore();
  const { isOpen, type, closeModal } = useModalStore();

  const showModal = isOpen && type === 'createWorkspace';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateWorkspaceFormValues>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Watch the logo field to create preview
  const logoField = watch('logo');

  // Update preview when logo changes
  React.useEffect(() => {
    if (logoField && logoField.length > 0) {
      const file = logoField[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  }, [logoField]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        setValue('logo', dataTransfer.files);
      }
    }
  };

  const onSubmit = async (values: CreateWorkspaceFormValues) => {
    try {
      setIsLoading(true);

      // Create the workspace first
      const workspace = await createWorkspace({
        name: values.name.trim(),
        description: values.description.trim(),
      });

      // If there's a logo, upload it
      if (values.logo && values.logo.length > 0) {
        await useWorkspaceStore.getState().updateWorkspaceLogo(workspace.id, values.logo[0]);
      }

      closeModal();
      reset();
      setLogoPreview(null);
    } catch (error) {
      console.error('Create workspace error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={closeModal}
      title=""
      size="lg"
    >
      <div className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 opacity-60" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Create Your Workspace
            </h2>
            <p className="text-gray-600 text-lg">
              Build something amazing together
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center mr-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                  </div>
                  Workspace Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your workspace name..."
                    disabled={isLoading}
                    error={errors.name?.message}
                    className="pl-4 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-emerald-400 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                    {...register('name', {
                      required: 'Workspace name is required',
                      minLength: {
                        value: 2,
                        message: 'Workspace name must be at least 2 characters',
                      },
                      maxLength: {
                        value: 50,
                        message: 'Workspace name cannot exceed 50 characters',
                      },
                    })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    className="w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-300 resize-none"
                    rows={4}
                    placeholder="Describe what this workspace is for..."
                    disabled={isLoading}
                    {...register('description', {
                      maxLength: {
                        value: 500,
                        message: 'Description cannot exceed 500 characters',
                      },
                    })}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {watch('description')?.length || 0}/500
                  </div>
                </div>
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="w-4 h-4 mr-1" />
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModal}
                disabled={isLoading}
                className="px-8 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all duration-300 hover:scale-105"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                isLoading={isLoading}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
              >
                {isLoading ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default CreateWorkspaceModal;