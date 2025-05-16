import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Hash, Lock } from "lucide-react";

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
      title="Create a Channel"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Channel Name"
          type="text"
          icon={<Hash size={18} className="text-gray-500" />}
          placeholder="e.g. general, announcements, random"
          disabled={isLoading}
          error={errors.name?.message}
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
            rows={2}
            placeholder="What is this channel about?"
            disabled={isLoading}
            {...register("description", {
              maxLength: {
                value: 500,
                message: "Description cannot exceed 500 characters",
              },
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isPrivate"
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            {...register("isPrivate")}
          />
          <div className="flex items-center">
            <label
              htmlFor="isPrivate"
              className="text-sm font-medium text-gray-700"
            >
              Private Channel
            </label>
            {isPrivate && <Lock size={16} className="ml-2 text-emerald-500" />}
          </div>
        </div>

        {isPrivate && (
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            <p>
              Private channels are only visible to invited members. This cannot
              be changed later.
            </p>
          </div>
        )}

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
            Create Channel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateChannelModal