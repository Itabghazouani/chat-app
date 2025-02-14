import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from 'axios';
import { axiosInstance } from '../lib/axios';
import { TMessage } from '../types/messages.types';
import { TUser } from '../types/user.types';
import { TMessageData } from '../types/messageData';
import { useAuthStore } from './useAuthStore';
import { TUnreadMessages } from '../types/unreadMessages.types';
import { loadUnreadMessages } from '../lib/utils';
interface IChatStore {
  messages: TMessage[];
  users: TUser[];
  selectedUser: TUser | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  unreadMessages: TUnreadMessages;
  markMessagesAsRead: (userId: string) => void;
  incrementUnreadMessages: (senderId: string) => void;
  getUsers: () => Promise<void>;
  getMessages: (userId: string) => Promise<void>;
  sendMessage: (messageData: TMessageData) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (selectedUser: TUser | null) => void;
}

export const useChatStore = create<IChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: loadUnreadMessages(),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users');
      set({ users: res.data });
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
      const newMessage = res.data;
      set({ messages: [...messages, res.data] });
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit('newMessage', {
          recipientId: selectedUser._id,
          message: newMessage,
        });
        console.log('Message emitted via socket:', {
          recipientId: selectedUser._id,
          message: newMessage,
        });
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Failed to send message');
      } else {
        toast.error('An error occurred while sending the message');
      }
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;

    socket?.on('newMessage', (newMessage: TMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off('newMessage');
  },

  markMessagesAsRead: (userId: string) => {
    set((state) => {
      const newUnreadMessages = {
        ...state.unreadMessages,
        [userId]: 0,
      };
      localStorage.setItem('unreadMessages', JSON.stringify(newUnreadMessages));
      return { unreadMessages: newUnreadMessages };
    });
  },

  incrementUnreadMessages: (senderId: string) => {
    if (senderId === get().selectedUser?._id) return;
    set((state) => {
      const newUnreadMessages = {
        ...state.unreadMessages,
        [senderId]: (state.unreadMessages[senderId] || 0) + 1,
      };

      localStorage.setItem('unreadMessages', JSON.stringify(newUnreadMessages));
      return { unreadMessages: newUnreadMessages };
    });
  },
  setSelectedUser: (selectedUser: TUser | null) => {
    set({ selectedUser });
    if (selectedUser) {
      get().markMessagesAsRead(selectedUser._id);
    }
  },
}));
