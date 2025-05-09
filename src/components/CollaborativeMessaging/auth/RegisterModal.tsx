"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Mail, Lock, User } from "lucide-react";

import Modal from "@/components/custom-ui/modal/Modal";
import Button from "@/components/custom-ui/button";
import Input from "@/components/custom-ui/input";
import useAuthStore from "@/lib/store/messaging/authStore";
import useModalStore from "@/lib/store/messaging/modalStore";

interface RegisterFormValues {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

const RegisterModal = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerUser } = useAuthStore();
  const { isOpen, type, data, closeModal, openModal } = useModalStore();

  const showModal = isOpen && type === "register";
  const redirectPath = data?.redirectPath as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: "",
      password: "",
      username: "",
      fullName: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      await registerUser(
        values.username,
        values.email,
        values.password,
        values.fullName
      );

      // Close modal and redirect if needed
      closeModal();
      reset();

      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onToggle = () => {
    closeModal();
    openModal("login", { redirectPath });
  };

  return (
    <Modal
      isOpen={showModal}
      onClose={closeModal}
      title="Create an Account"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="fullName"
          label="Full Name"
          type="text"
          icon={<User size={18} className="text-gray-500" />}
          disabled={isLoading}
          error={errors.fullName?.message}
          {...register("fullName", {
            required: "Full name is required",
          })}
        />

        <Input
          id="username"
          label="Username"
          type="text"
          icon={<User size={18} className="text-gray-500" />}
          disabled={isLoading}
          error={errors.username?.message}
          {...register("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
            pattern: {
              value: /^[a-zA-Z0-9_]+$/,
              message:
                "Username can only contain letters, numbers, and underscores",
            },
          })}
        />

        <Input
          id="email"
          label="Email"
          type="email"
          icon={<Mail size={18} className="text-gray-500" />}
          disabled={isLoading}
          error={errors.email?.message}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Invalid email address",
            },
          })}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          icon={<Lock size={18} className="text-gray-500" />}
          disabled={isLoading}
          error={errors.password?.message}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />

        <div>
          <Button type="submit" fullWidth isLoading={isLoading}>
            Create Account
          </Button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onToggle}
              className="text-emerald-600 hover:underline"
              disabled={isLoading}
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default RegisterModal;
