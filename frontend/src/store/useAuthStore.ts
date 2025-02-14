import axios from 'axios';
import toast from 'react-hot-toast';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

import { axiosInstance } from '../lib/axios.ts';

import { TUser } from '../types/user.types.ts';
import { TSignupData } from '../types/signUpData.types.ts';
import { TLoginData } from '../types/loginData.types.ts';
import { TProfileUpdateData } from '../types/profileUpdateData.types.ts';
import { BASE_URL } from '../constants/index.ts';
import { useChatStore } from './useChatStore.ts';
import { TMessage } from '../types/messages.types.ts';

interface IAuthStore {
  authUser: TUser | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: TUser['_id'][];
  socket: Socket | null;

  checkAuth: () => Promise<void>;
  signup: (data: TSignupData) => Promise<void>;
  logout: () => Promise<void>;
  login: (data: TLoginData) => Promise<void>;
  updateProfile: (data: TProfileUpdateData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
}

interface ApiError {
  message: string;
}

export const useAuthStore = create<IAuthStore>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isLoggingOut: false,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<TUser>('auth/check');
      console.log('Check auth response:', res.data);
      set({ authUser: res.data });
      get().connectSocket();
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
      set({ authUser: res.data });
      toast.success('Account created successfully');
      get().connectSocket();
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

      get().connectSocket();
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
      get().disconnectSocket();
      await axiosInstance.post('auth/logout');
      set({ authUser: null });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error in logout:', error);
      set({ authUser: null });
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

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket });

    socket.on('getOnlineUsers', (userIds: TUser['_id'][]) => {
      set({ onlineUsers: userIds });
    });

    socket.on('userListUpdate', () => {
      const chatStore = useChatStore.getState();
      chatStore.getUsers();
    });

    socket.on('messageReceived', (message: TMessage) => {
      console.log('Message received in auth store:', message);
      const chatStore = useChatStore.getState();
      const selectedUser = chatStore.selectedUser;

      if (!selectedUser || message.senderId !== selectedUser._id) {
        console.log('Incrementing unread messages for:', message.senderId);
        chatStore.incrementUnreadMessages(message.senderId);
      }
    });

    socket.on('updateUsersList', () => {
      const chatStore = useChatStore.getState();
      chatStore.getUsers();
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));
