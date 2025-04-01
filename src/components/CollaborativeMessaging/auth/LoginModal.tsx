"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Mail, Lock } from 'lucide-react';


import useAuthStore from '@/store/messaging/authStore';
import useModalStore from '@/store/messaging/modalStore';
import Modal from '../../custom-ui/modal/Modal';
import Input from '@/components/custom-ui/input';
import Button from '@/components/custom-ui/button';

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginModal = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuthStore();
  const { isOpen, type, data, closeModal, openModal } = useModalStore();
  
  const showModal = isOpen && type === 'login';
  const redirectPath = data?.redirectPath as string;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      await login(values.email, values.password);
      
      // Close modal and redirect if needed
      closeModal();
      reset();
      
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onToggle = () => {
    closeModal();
    openModal('register', { redirectPath });
  };
  
  return (
    <Modal
      isOpen={showModal}
      onClose={closeModal}
      title="Log In"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="email"
          label="Email"
          type="email"
          icon={<Mail size={18} className="text-gray-500" />}
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Invalid email address',
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
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
        />
        
        <div>
          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
          >
            Log In
          </Button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={onToggle}
              className="text-emerald-600 hover:underline"
              disabled={isLoading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default LoginModal;