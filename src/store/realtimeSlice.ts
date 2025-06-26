/**
 * @file realtimeSlice.ts
 * @description Redux slice for managing realtime subscription state and message/snap/story notifications.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * The shape of the realtime state.
 */
export interface RealtimeState {
  isConnected: boolean;
  activeSubscriptions: string[];
  newMessageNotifications: {
    conversationId: string;
    count: number;
    lastMessageAt: string;
  }[];
  newSnapNotifications: {
    senderId: string;
    senderUsername: string;
    snapId: string;
    mediaType: 'photo' | 'video';
    timer?: number;
    receivedAt: string;
  }[];
  newStoryNotifications: {
    storyId: string;
    userId: string;
    username: string;
    mediaType: 'photo' | 'video';
    receivedAt: string;
  }[];
  error: string | null;
}

const initialState: RealtimeState = {
  isConnected: false,
  activeSubscriptions: [],
  newMessageNotifications: [],
  newSnapNotifications: [],
  newStoryNotifications: [],
  error: null,
};

/**
 * Realtime slice for managing subscription state and notifications.
 */
const realtimeSlice = createSlice({
  name: 'realtime',
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
      if (!action.payload) {
        // Clear notifications when disconnected
        state.newMessageNotifications = [];
        state.newSnapNotifications = [];
        state.newStoryNotifications = [];
      }
    },
    addActiveSubscription(state, action: PayloadAction<string>) {
      if (!state.activeSubscriptions.includes(action.payload)) {
        state.activeSubscriptions.push(action.payload);
      }
    },
    removeActiveSubscription(state, action: PayloadAction<string>) {
      state.activeSubscriptions = state.activeSubscriptions.filter((sub) => sub !== action.payload);
    },
    clearActiveSubscriptions(state) {
      state.activeSubscriptions = [];
    },
    addNewMessageNotification(
      state,
      action: PayloadAction<{
        conversationId: string;
        messageAt: string;
      }>,
    ) {
      const { conversationId, messageAt } = action.payload;

      const existingIndex = state.newMessageNotifications.findIndex(
        (notification) => notification.conversationId === conversationId,
      );

      if (existingIndex >= 0) {
        // Update existing notification
        state.newMessageNotifications[existingIndex].count += 1;
        state.newMessageNotifications[existingIndex].lastMessageAt = messageAt;
      } else {
        // Add new notification
        state.newMessageNotifications.push({
          conversationId,
          count: 1,
          lastMessageAt: messageAt,
        });
      }
    },
    clearMessageNotification(state, action: PayloadAction<string>) {
      state.newMessageNotifications = state.newMessageNotifications.filter(
        (notification) => notification.conversationId !== action.payload,
      );
    },
    clearAllMessageNotifications(state) {
      state.newMessageNotifications = [];
    },
    addNewSnapNotification(
      state,
      action: PayloadAction<{
        senderId: string;
        senderUsername: string;
        snapId: string;
        mediaType: 'photo' | 'video';
        timer?: number;
        receivedAt: string;
      }>,
    ) {
      // Add new snap notification to the beginning of the array
      state.newSnapNotifications.unshift(action.payload);

      // Keep only the last 50 snap notifications to prevent memory issues
      if (state.newSnapNotifications.length > 50) {
        state.newSnapNotifications = state.newSnapNotifications.slice(0, 50);
      }
    },
    clearSnapNotification(state, action: PayloadAction<string>) {
      state.newSnapNotifications = state.newSnapNotifications.filter(
        (notification) => notification.snapId !== action.payload,
      );
    },
    clearAllSnapNotifications(state) {
      state.newSnapNotifications = [];
    },
    addNewStoryNotification(
      state,
      action: PayloadAction<{
        storyId: string;
        userId: string;
        username: string;
        mediaType: 'photo' | 'video';
        receivedAt: string;
      }>,
    ) {
      // Add new story notification to the beginning of the array
      state.newStoryNotifications.unshift(action.payload);

      // Keep only the last 20 story notifications to prevent memory issues
      if (state.newStoryNotifications.length > 20) {
        state.newStoryNotifications = state.newStoryNotifications.slice(0, 20);
      }
    },
    clearStoryNotification(state, action: PayloadAction<string>) {
      state.newStoryNotifications = state.newStoryNotifications.filter(
        (notification) => notification.storyId !== action.payload,
      );
    },
    clearAllStoryNotifications(state) {
      state.newStoryNotifications = [];
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setConnectionStatus,
  addActiveSubscription,
  removeActiveSubscription,
  clearActiveSubscriptions,
  addNewMessageNotification,
  clearMessageNotification,
  clearAllMessageNotifications,
  addNewSnapNotification,
  clearSnapNotification,
  clearAllSnapNotifications,
  addNewStoryNotification,
  clearStoryNotification,
  clearAllStoryNotifications,
  setError,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;

/**
 * Selector to get the count of unread snap notifications.
 * @param state The root Redux state
 * @returns The number of unread snap notifications
 */
export function selectUnreadSnapCount(state: { realtime: RealtimeState }): number {
  return state.realtime.newSnapNotifications.length;
}

/**
 * Selector to get the count of unread story notifications.
 * @param state The root Redux state
 * @returns The number of unread story notifications
 */
export function selectUnreadStoryCount(state: { realtime: RealtimeState }): number {
  return state.realtime.newStoryNotifications.length;
}
