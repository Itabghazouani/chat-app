import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import { axiosInstance } from '../lib/axios';
import { TMessage } from '../types/messages.types';
import { TUser } from '../types/user.types';
import { TMessageData } from '../types/messageData';

interface IChatStore {
  messages: TMessage[];
  users: TUser[];
  selectedUser: TUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: TMessageData) => Promise<void>;
  setSelectedUser: (selectedUser: TUser | null) => void;
  restoreSelectedUser: () => Promise<void>;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users');
      set({ users: res.data });

      // After getting users, try to restore the selected user
      const selectedUserId = localStorage.getItem('selectedUserId');
      if (selectedUserId) {
        const selectedUser = res.data.find(
          (user: TUser) => user._id === selectedUserId,
        );
        if (selectedUser) {
          set({ selectedUser });
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'An error occurred');
      } else {
        toast.error('An error occurred');
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error('No user selected to send message to');
      return;
    }
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Failed to send message');
      } else {
        toast.error('An error occurred while sending the message');
      }
    }
  },
  setSelectedUser: (selectedUser: TUser | null) => {
    set({ selectedUser });
    // Save to localStorage when a user is selected
    if (selectedUser) {
      localStorage.setItem('selectedUserId', selectedUser._id);
    } else {
      localStorage.removeItem('selectedUserId');
    }
  },
  restoreSelectedUser: async () => {
    const selectedUserId = localStorage.getItem('selectedUserId');
    if (!selectedUserId) return;

    const { users } = get();
    if (users.length === 0) {
      // If users haven't been loaded yet, load them
      await get().getUsers();
    } else {
      // If users are already loaded, find the selected user
      const selectedUser = users.find((user) => user._id === selectedUserId);
      if (selectedUser) {
        set({ selectedUser });
      }
    }
  },
}));
