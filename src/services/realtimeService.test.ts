/**
 * @file realtimeService.test.ts
 * @description Unit tests for realtime service functionality
 */

// Mock all dependencies at the top
jest.mock('./realtime', () => ({
  subscribeToAllMessages: jest.fn(),
  unsubscribeFromAllMessages: jest.fn(),
  subscribeToStories: jest.fn(),
  unsubscribeFromStories: jest.fn(),
  // Legacy functions for backward compatibility
  subscribeToNewMessages: jest.fn(),
  unsubscribeFromNewMessages: jest.fn(),
  subscribeToNewSnaps: jest.fn(),
  unsubscribeFromNewSnaps: jest.fn(),
}));

jest.mock('./chatService', () => ({
  getConversations: jest.fn(),
}));

jest.mock('./userService', () => ({
  getUserProfile: jest.fn(),
}));

jest.mock('../store/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

// Import after mocks
import { store } from '../store/store';
import {
  setConnectionStatus,
  addActiveSubscription,
  addNewMessageNotification,
  addNewSnapNotification,
  clearActiveSubscriptions,
} from '../store/realtimeSlice';
import {
  initializeRealtimeSubscriptions,
  cleanupRealtimeSubscriptions,
  getConnectionStatus,
  getMessageNotifications,
  getSnapNotifications,
  clearConversationNotifications,
  clearSnapNotification,
} from './realtimeService';

// Get mocked functions
const mockRealtime = require('./realtime');
const mockChatService = require('./chatService');
const mockUserService = require('./userService');

describe('realtimeService', () => {
  const mockStore = store as jest.Mocked<typeof store>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset module state
    const realtimeService = require('./realtimeService');
    if (realtimeService.isInitialized !== undefined) {
      realtimeService.isInitialized = false;
    }

    // Setup default mock implementations
    mockStore.getState.mockReturnValue({
      auth: { user: { id: 'test-user-id' } },
      realtime: {
        isConnected: false,
        activeSubscriptions: [],
        newMessageNotifications: [],
        newSnapNotifications: [],
        error: null,
      },
    } as any);

    mockChatService.getConversations.mockResolvedValue([]);
    mockUserService.getUserProfile.mockResolvedValue({
      data: { username: 'testuser' },
      error: null,
    });

    // Reset mock implementations to default (no-op)
    mockRealtime.subscribeToAllMessages.mockImplementation(() => {});
    mockRealtime.unsubscribeFromAllMessages.mockImplementation(() => {});
    mockRealtime.subscribeToStories.mockImplementation(() => {});
    mockRealtime.unsubscribeFromStories.mockImplementation(() => {});
  });

  describe('initializeRealtimeSubscriptions', () => {
    it('should initialize subscriptions successfully', async () => {
      const userId = 'test-user-id';

      await initializeRealtimeSubscriptions(userId);

      expect(mockRealtime.subscribeToAllMessages).toHaveBeenCalledWith(
        userId,
        expect.any(Function), // message handler
        expect.any(Function), // snap handler
      );
      expect(mockRealtime.subscribeToStories).toHaveBeenCalledWith(
        userId,
        expect.any(Function), // story handler
        expect.any(Function), // story update handler
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(setConnectionStatus(true));
      expect(mockStore.dispatch).toHaveBeenCalledWith(addActiveSubscription('messages'));
      expect(mockStore.dispatch).toHaveBeenCalledWith(addActiveSubscription('snaps'));
      expect(mockStore.dispatch).toHaveBeenCalledWith(addActiveSubscription('stories'));
    });

    it('should handle initialization errors', async () => {
      const userId = 'test-user-id';
      const error = new Error('Connection failed');

      mockRealtime.subscribeToAllMessages.mockImplementation(() => {
        throw error;
      });

      await initializeRealtimeSubscriptions(userId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(setConnectionStatus(false));
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 'Connection failed',
        }),
      );
    });

    it('should reinitialize if already initialized', async () => {
      const userId = 'test-user-id';

      // First initialization
      await initializeRealtimeSubscriptions(userId);

      // Cleanup
      cleanupRealtimeSubscriptions();

      // Clear mock calls for second initialization
      mockRealtime.subscribeToAllMessages.mockClear();
      mockRealtime.subscribeToStories.mockClear();

      // Second initialization
      await initializeRealtimeSubscriptions(userId);

      expect(mockRealtime.subscribeToAllMessages).toHaveBeenCalledWith(
        userId,
        expect.any(Function), // message handler
        expect.any(Function), // snap handler
      );
      expect(mockRealtime.subscribeToStories).toHaveBeenCalledWith(
        userId,
        expect.any(Function), // story handler
        expect.any(Function), // story update handler
      );
    });
  });

  describe('cleanupRealtimeSubscriptions', () => {
    it('should cleanup subscriptions successfully', () => {
      cleanupRealtimeSubscriptions();

      expect(mockRealtime.unsubscribeFromAllMessages).toHaveBeenCalled();
      expect(mockRealtime.unsubscribeFromStories).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith(setConnectionStatus(false));
      expect(mockStore.dispatch).toHaveBeenCalledWith(clearActiveSubscriptions());
    });

    it('should handle cleanup errors gracefully', () => {
      const error = new Error('Cleanup failed');
      mockRealtime.unsubscribeFromAllMessages.mockImplementation(() => {
        throw error;
      });

      expect(() => cleanupRealtimeSubscriptions()).not.toThrow();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status from store', () => {
      mockStore.getState.mockReturnValue({
        realtime: { isConnected: true },
      } as any);

      const status = getConnectionStatus();
      expect(status).toBe(true);
    });

    it('should return false when disconnected', () => {
      mockStore.getState.mockReturnValue({
        realtime: { isConnected: false },
      } as any);

      const status = getConnectionStatus();
      expect(status).toBe(false);
    });
  });

  describe('getMessageNotifications', () => {
    it('should return message notifications from store', () => {
      const mockNotifications = [
        { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
      ];

      mockStore.getState.mockReturnValue({
        realtime: { newMessageNotifications: mockNotifications },
      } as any);

      const notifications = getMessageNotifications();
      expect(notifications).toEqual(mockNotifications);
    });
  });

  describe('getSnapNotifications', () => {
    it('should return snap notifications from store', () => {
      const mockNotifications = [
        {
          senderId: 'sender1',
          senderUsername: 'testuser',
          snapId: 'snap1',
          mediaType: 'photo' as const,
          timer: 5,
          receivedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockStore.getState.mockReturnValue({
        realtime: { newSnapNotifications: mockNotifications },
      } as any);

      const notifications = getSnapNotifications();
      expect(notifications).toEqual(mockNotifications);
    });
  });

  describe('clearConversationNotifications', () => {
    it('should clear notifications for specific conversation', () => {
      clearConversationNotifications('conv1');

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 'conv1',
        }),
      );
    });
  });

  describe('clearSnapNotification', () => {
    it('should clear notifications for specific snap', () => {
      clearSnapNotification('snap1');

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: 'snap1',
        }),
      );
    });
  });

  describe('message handling', () => {
    it('should handle new message events correctly', async () => {
      const userId = 'test-user-id';
      const mockMessagePayload = {
        eventType: 'INSERT',
        new: {
          conversation_id: 'conv1',
          created_at: '2023-01-01T00:00:00Z',
          content: 'Test message',
        },
      };

      // Initialize to get the message handler
      await initializeRealtimeSubscriptions(userId);

      // Get the message handler from the mock call
      const messageHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][1];
      expect(typeof messageHandler).toBe('function');

      // Call the handler
      await messageHandler(mockMessagePayload);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        addNewMessageNotification({
          conversationId: 'conv1',
          messageAt: '2023-01-01T00:00:00Z',
        }),
      );
    });

    it('should ignore non-INSERT message events', async () => {
      const userId = 'test-user-id';
      const mockMessagePayload = {
        eventType: 'UPDATE',
        new: { conversation_id: 'conv1', created_at: '2023-01-01T00:00:00Z' },
      };

      await initializeRealtimeSubscriptions(userId);
      const messageHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][1];
      await messageHandler(mockMessagePayload);

      expect(mockStore.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('realtime/addNewMessageNotification'),
        }),
      );
    });
  });

  describe('snap handling', () => {
    it('should handle new snap events correctly', async () => {
      const userId = 'test-user-id';
      const mockSnapPayload = {
        eventType: 'INSERT',
        new: {
          id: 'snap1',
          sender_id: 'sender1',
          message_type: 'photo',
          timer: 5,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockUserService.getUserProfile.mockResolvedValue({
        data: { username: 'testuser' },
        error: null,
      });

      await initializeRealtimeSubscriptions(userId);
      const snapHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][2];
      expect(typeof snapHandler).toBe('function');

      await snapHandler(mockSnapPayload);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        addNewSnapNotification({
          senderId: 'sender1',
          senderUsername: 'testuser',
          snapId: 'snap1',
          mediaType: 'photo',
          timer: 5,
          receivedAt: '2023-01-01T00:00:00Z',
        }),
      );
    });

    it('should handle snap events with unknown sender gracefully', async () => {
      const userId = 'test-user-id';
      const mockSnapPayload = {
        eventType: 'INSERT',
        new: {
          id: 'snap1',
          sender_id: 'sender1',
          message_type: 'photo',
          timer: 5,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockUserService.getUserProfile.mockResolvedValue({
        data: null,
        error: new Error('User not found'),
      });

      await initializeRealtimeSubscriptions(userId);
      const snapHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][2];
      await snapHandler(mockSnapPayload);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        addNewSnapNotification({
          senderId: 'sender1',
          senderUsername: 'Unknown User',
          snapId: 'snap1',
          mediaType: 'photo',
          timer: 5,
          receivedAt: '2023-01-01T00:00:00Z',
        }),
      );
    });

    it('should ignore non-INSERT snap events', async () => {
      const userId = 'test-user-id';
      const mockSnapPayload = {
        eventType: 'UPDATE',
        new: {
          id: 'snap1',
          sender_id: 'sender1',
          message_type: 'photo',
          timer: 5,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      await initializeRealtimeSubscriptions(userId);
      const snapHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][2];
      await snapHandler(mockSnapPayload);

      expect(mockStore.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('realtime/addNewSnapNotification'),
        }),
      );
    });

    it('should ignore non-snap message types', async () => {
      const userId = 'test-user-id';
      const mockSnapPayload = {
        eventType: 'INSERT',
        new: {
          id: 'snap1',
          sender_id: 'sender1',
          message_type: 'text', // Not a snap type
          timer: 5,
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      await initializeRealtimeSubscriptions(userId);
      const snapHandler = mockRealtime.subscribeToAllMessages.mock.calls[0][2];
      await snapHandler(mockSnapPayload);

      expect(mockStore.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('realtime/addNewSnapNotification'),
        }),
      );
    });
  });
});
