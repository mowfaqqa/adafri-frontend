import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Upload } from 'lucide-react';

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

  const { createWorkspace } = useWorkspaceStore();
  const { isOpen, type, closeModal } = useModalStore();

  const showModal = isOpen && type === 'createWorkspace';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
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
      title="Create a Workspace"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Logo upload */}
        <div className="flex justify-center">
          <div className="relative group">
            <div
              className={`
                w-24 h-24 rounded-md flex items-center justify-center
                ${logoPreview ? 'bg-transparent' : 'bg-gray-200'}
                overflow-hidden
              `}
            >
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Workspace logo preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building size={32} className="text-gray-400" />
              )}
            </div>
            
            <label
              htmlFor="logo-upload"
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 
                        opacity-0 group-hover:opacity-100 cursor-pointer rounded-md transition-opacity"
            >
              <Upload size={24} className="text-white" />
            </label>
            
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              {...register('logo')}
            />
          </div>
        </div>

        <Input
          id="name"
          label="Workspace Name"
          type="text"
          placeholder="e.g. My Team, Project X, etc."
          disabled={isLoading}
          error={errors.name?.message}
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

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="description"
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={3}
            placeholder="What is this workspace for?"
            disabled={isLoading}
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Description cannot exceed 500 characters',
              },
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={closeModal}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateWorkspaceModal;