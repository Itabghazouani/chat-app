import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.ts';
import { TUser } from '../types/user.types.ts';
import toast from 'react-hot-toast';
import { TSignupData } from '../types/signUpData.types.ts';
import axios from 'axios';
import { TLoginData } from '../types/loginData.types.ts';
import { TProfileUpdateData } from '../types/profileUpdateData.types.ts';

interface IAuthStore {
  authUser: TUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  checkAuth: () => Promise<void>;
  signup: (data: TSignupData) => Promise<void>;
  logout: () => Promise<void>;
  login: (data: TLoginData) => Promise<void>;
  updateProfile: (data: TProfileUpdateData) => Promise<void>;
}

interface ApiError {
  message: string;
}

export const useAuthStore = create<IAuthStore>((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isLoggingOut: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<TUser>('auth/check');
      console.log('Check auth response:', res.data);
      set({ authUser: res.data });
    } catch (error) {
      console.error('Error in checkAuth:', error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: TSignupData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<TUser>('auth/signup', data);
      toast.success('Account created successfully');
      set({ authUser: res.data });
    } catch (error) {
      console.error('Error in signup:', error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          (error.response.data as ApiError).message || 'An error occurred';
        toast.error(errorMessage);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: TLoginData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post('/auth/login', data);
      set({ authUser: res.data });
      toast.success('Logged in successfully');

      // get().connectSocket();
    } catch (error) {
      console.error('Error in signup:', error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          (error.response.data as ApiError).message || 'An error occurred';
        toast.error(errorMessage);
      } else {
        toast.error('An error occurred');
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('auth/logout');
      set({ authUser: null });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error in logout:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage =
          (error.response.data as ApiError).message || 'An error occurred';
        toast.error(errorMessage);
      } else {
        toast.error('An error occurred');
      }
    }
  },

  updateProfile: async (data: TProfileUpdateData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/auth/update-profile', data);
      set({ authUser: res.data });
      toast.success('Profile updated successfully');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
