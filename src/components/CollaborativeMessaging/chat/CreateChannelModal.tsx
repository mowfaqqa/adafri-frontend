import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Hash, Lock, MessageSquare, Users, Shield, X } from "lucide-react";

import Modal from "@/components/custom-ui/modal/Modal";
import Button from "@/components/custom-ui/button";
import Input from "@/components/custom-ui/input";
import useModalStore from "@/lib/store/messaging/modalStore";
import useChannelStore from "@/lib/store/messaging/channelStore";

interface CreateChannelFormValues {
  name: string;
  description: string;
  isPrivate: boolean;
}

const CreateChannelModal: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const { createChannel } = useChannelStore();
  const { isOpen, type, closeModal, data } = useModalStore();

  const showModal = isOpen && type === "createChannel";
  
  // Get the workspace ID from the modal data
  const workspaceId = data?.workspaceId;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateChannelFormValues>({
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const isPrivate = watch("isPrivate");

  const onSubmit = async (values: CreateChannelFormValues) => {
    if (!workspaceId) {
      console.error("No workspace ID provided");
      return;
    }
    
    try {
      setIsLoading(true);

      // Format channel name (remove spaces, convert to lowercase)
      const formattedName = values.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      await createChannel({
        name: formattedName,
        description: values.description,
        isPrivate: values.isPrivate,
        workspaceId,
      });

      closeModal();
      reset();
    } catch (error) {
      console.error("Create channel error:", error);
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 opacity-60" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-emerald-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
        
        <div className="relative z-10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              Create a Channel
            </h2>
            <p className="text-gray-600 text-lg">
              Start conversations and organize your team
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-6">
              {/* Channel Name */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                  </div>
                  Channel Name
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter channel name..."
                    disabled={isLoading}
                    error={errors.name?.message}
                    className="pl-4 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-2xl focus:border-blue-400 focus:bg-white transition-all duration-300 shadow-sm hover:shadow-md"
                    {...register("name", {
                      required: "Channel name is required",
                      minLength: {
                        value: 1,
                        message: "Channel name is required",
                      },
                      maxLength: {
                        value: 50,
                        message: "Channel name cannot exceed 50 characters",
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_\- ]+$/,
                        message:
                          "Channel name can only contain letters, numbers, spaces, underscores, and hyphens",
                      },
                    })}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Spaces will be converted to hyphens. Special characters are not allowed.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    className="w-full rounded-2xl border-2 border-gray-200 px-4 py-4 text-lg bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-0 transition-all duration-300 resize-none"
                    rows={3}
                    placeholder="What is this channel about?"
                    disabled={isLoading}
                    {...register("description", {
                      maxLength: {
                        value: 500,
                        message: "Description cannot exceed 500 characters",
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

              {/* Privacy Setting */}
              <div className="flex items-center gap-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <div className="w-5 h-5 bg-emerald-100 rounded-lg flex items-center justify-center mr-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  Privacy Settings
                </label>

                <input
                  type="checkbox"
                  id="isPrivate"
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-all duration-200"
                  {...register("isPrivate")}
                />

                <label
                  htmlFor="isPrivate"
                  className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-1"
                >
                  <span>Private Channel</span>
                  {isPrivate && <Lock size={14} className="text-emerald-500" />}
                </label>
              </div>

              {/* Private Channel Warning */}
              {isPrivate && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-800">
                        Private channels are only visible to invited members. This cannot be changed later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 transform"
              >
                {isLoading ? 'Creating...' : 'Create Channel'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default CreateChannelModal;