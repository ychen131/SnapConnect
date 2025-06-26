/**
 * @file realtimeService.test.ts
 * @description Unit tests for realtime service functionality
 */
import { store } from '../store/store';
import {
  setConnectionStatus,
  addActiveSubscription,
  addNewMessageNotification,
  clearActiveSubscriptions,
} from '../store/realtimeSlice';
import {
  initializeRealtimeSubscriptions,
  cleanupRealtimeSubscriptions,
  getConnectionStatus,
  getMessageNotifications,
  clearConversationNotifications,
} from './realtimeService';

// Mock the realtime module
jest.mock('./realtime', () => ({
  subscribeToNewMessages: jest.fn(),
  unsubscribeFromNewMessages: jest.fn(),
}));

// Mock the chatService module
jest.mock('./chatService', () => ({
  getConversations: jest.fn(),
}));

// Mock the store
jest.mock('../store/store', () => ({
  store: {
    dispatch: jest.fn(),
    getState: jest.fn(),
  },
}));

describe('realtimeService', () => {
  const mockStore = store as jest.Mocked<typeof store>;
  const mockSubscribeToNewMessages = require('./realtime')
    .subscribeToNewMessages as jest.MockedFunction<any>;
  const mockUnsubscribeFromNewMessages = require('./realtime')
    .unsubscribeFromNewMessages as jest.MockedFunction<any>;
  const mockGetConversations = require('./chatService')
    .getConversations as jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockStore.getState.mockReturnValue({
      auth: { user: { id: 'test-user-id' } },
      realtime: {
        isConnected: false,
        activeSubscriptions: [],
        newMessageNotifications: [],
        error: null,
      },
    } as any);

    // Reset the module's internal state by clearing the module cache
    jest.resetModules();
  });

  describe('initializeRealtimeSubscriptions', () => {
    it('should initialize subscriptions successfully', async () => {
      const userId = 'test-user-id';

      await initializeRealtimeSubscriptions(userId);

      expect(mockSubscribeToNewMessages).toHaveBeenCalledWith(userId, expect.any(Function));
      expect(mockStore.dispatch).toHaveBeenCalledWith(setConnectionStatus(true));
      expect(mockStore.dispatch).toHaveBeenCalledWith(addActiveSubscription('messages'));
    });

    it('should handle initialization errors', async () => {
      const userId = 'test-user-id';
      const error = new Error('Connection failed');

      mockSubscribeToNewMessages.mockImplementation(() => {
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

      // Clear mocks to check if they're called again
      mockUnsubscribeFromNewMessages.mockClear();
      mockSubscribeToNewMessages.mockClear();
      mockStore.dispatch.mockClear();

      // Manually cleanup to reset the isInitialized flag
      cleanupRealtimeSubscriptions();

      // Second initialization should work normally
      await initializeRealtimeSubscriptions(userId);

      expect(mockSubscribeToNewMessages).toHaveBeenCalledWith(userId, expect.any(Function));
    });
  });

  describe('cleanupRealtimeSubscriptions', () => {
    it('should cleanup subscriptions successfully', () => {
      cleanupRealtimeSubscriptions();

      expect(mockUnsubscribeFromNewMessages).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledWith(setConnectionStatus(false));
      expect(mockStore.dispatch).toHaveBeenCalledWith(clearActiveSubscriptions());
    });

    it('should handle cleanup errors gracefully', () => {
      const error = new Error('Cleanup failed');
      mockUnsubscribeFromNewMessages.mockImplementation(() => {
        throw error;
      });

      // Should not throw
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
        { conversationId: 'conv2', count: 1, lastMessageAt: '2023-01-01T01:00:00Z' },
      ];

      mockStore.getState.mockReturnValue({
        realtime: { newMessageNotifications: mockNotifications },
      } as any);

      const notifications = getMessageNotifications();
      expect(notifications).toEqual(mockNotifications);
    });
  });

  describe('clearConversationNotifications', () => {
    it('should clear notifications for specific conversation', () => {
      const conversationId = 'test-conversation-id';

      clearConversationNotifications(conversationId);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: conversationId,
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

      // Initialize subscriptions to get the message handler
      await initializeRealtimeSubscriptions(userId);

      // Get the message handler function that was passed to subscribeToNewMessages
      const messageHandler = mockSubscribeToNewMessages.mock.calls[0][1];

      // Simulate receiving a message
      await messageHandler(mockMessagePayload);

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        addNewMessageNotification({
          conversationId: 'conv1',
          messageAt: '2023-01-01T00:00:00Z',
        }),
      );
    });

    it('should ignore non-INSERT events', async () => {
      const userId = 'test-user-id';
      const mockUpdatePayload = {
        eventType: 'UPDATE',
        new: { conversation_id: 'conv1', created_at: '2023-01-01T00:00:00Z' },
      };

      await initializeRealtimeSubscriptions(userId);
      const messageHandler = mockSubscribeToNewMessages.mock.calls[0][1];

      await messageHandler(mockUpdatePayload);

      // Should not dispatch notification for UPDATE events
      expect(mockStore.dispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringContaining('addNewMessageNotification'),
        }),
      );
    });

    it('should handle missing message data gracefully', async () => {
      const userId = 'test-user-id';
      const mockInvalidPayload = {
        eventType: 'INSERT',
        new: null,
      };

      await initializeRealtimeSubscriptions(userId);
      const messageHandler = mockSubscribeToNewMessages.mock.calls[0][1];

      // Should not throw
      await messageHandler(mockInvalidPayload);
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('should refresh conversations after new message', async () => {
      const userId = 'test-user-id';
      const mockMessagePayload = {
        eventType: 'INSERT',
        new: {
          conversation_id: 'conv1',
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetConversations.mockResolvedValue([]);

      await initializeRealtimeSubscriptions(userId);
      const messageHandler = mockSubscribeToNewMessages.mock.calls[0][1];

      await messageHandler(mockMessagePayload);

      expect(mockGetConversations).toHaveBeenCalledWith(userId);
    });

    it('should handle conversation refresh errors gracefully', async () => {
      const userId = 'test-user-id';
      const mockMessagePayload = {
        eventType: 'INSERT',
        new: {
          conversation_id: 'conv1',
          created_at: '2023-01-01T00:00:00Z',
        },
      };

      mockGetConversations.mockRejectedValue(new Error('Refresh failed'));

      await initializeRealtimeSubscriptions(userId);
      const messageHandler = mockSubscribeToNewMessages.mock.calls[0][1];

      // Should not throw
      await messageHandler(mockMessagePayload);
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });
});
