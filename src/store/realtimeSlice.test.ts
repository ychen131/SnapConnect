/**
 * @file realtimeSlice.test.ts
 * @description Unit tests for realtime Redux slice
 */
import realtimeReducer, {
  setConnectionStatus,
  addActiveSubscription,
  removeActiveSubscription,
  clearActiveSubscriptions,
  addNewMessageNotification,
  clearMessageNotification,
  clearAllMessageNotifications,
  setError,
  RealtimeState,
} from './realtimeSlice';

describe('realtimeSlice', () => {
  const initialState: RealtimeState = {
    isConnected: false,
    activeSubscriptions: [],
    newMessageNotifications: [],
    error: null,
  };

  describe('reducer', () => {
    it('should return initial state', () => {
      expect(realtimeReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    describe('setConnectionStatus', () => {
      it('should set connection status to true', () => {
        const action = setConnectionStatus(true);
        const newState = realtimeReducer(initialState, action);

        expect(newState.isConnected).toBe(true);
        expect(newState.error).toBe(null);
      });

      it('should set connection status to false and clear notifications', () => {
        const stateWithNotifications: RealtimeState = {
          ...initialState,
          isConnected: true,
          newMessageNotifications: [
            { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
          ],
        };

        const action = setConnectionStatus(false);
        const newState = realtimeReducer(stateWithNotifications, action);

        expect(newState.isConnected).toBe(false);
        expect(newState.newMessageNotifications).toEqual([]);
      });
    });

    describe('addActiveSubscription', () => {
      it('should add new subscription', () => {
        const action = addActiveSubscription('messages');
        const newState = realtimeReducer(initialState, action);

        expect(newState.activeSubscriptions).toEqual(['messages']);
      });

      it('should not add duplicate subscription', () => {
        const stateWithSubscription: RealtimeState = {
          ...initialState,
          activeSubscriptions: ['messages'],
        };

        const action = addActiveSubscription('messages');
        const newState = realtimeReducer(stateWithSubscription, action);

        expect(newState.activeSubscriptions).toEqual(['messages']);
      });

      it('should add multiple different subscriptions', () => {
        let state = initialState;

        state = realtimeReducer(state, addActiveSubscription('messages'));
        state = realtimeReducer(state, addActiveSubscription('stories'));

        expect(state.activeSubscriptions).toEqual(['messages', 'stories']);
      });
    });

    describe('removeActiveSubscription', () => {
      it('should remove existing subscription', () => {
        const stateWithSubscriptions: RealtimeState = {
          ...initialState,
          activeSubscriptions: ['messages', 'stories'],
        };

        const action = removeActiveSubscription('messages');
        const newState = realtimeReducer(stateWithSubscriptions, action);

        expect(newState.activeSubscriptions).toEqual(['stories']);
      });

      it('should handle removing non-existent subscription', () => {
        const stateWithSubscriptions: RealtimeState = {
          ...initialState,
          activeSubscriptions: ['messages'],
        };

        const action = removeActiveSubscription('stories');
        const newState = realtimeReducer(stateWithSubscriptions, action);

        expect(newState.activeSubscriptions).toEqual(['messages']);
      });
    });

    describe('clearActiveSubscriptions', () => {
      it('should clear all subscriptions', () => {
        const stateWithSubscriptions: RealtimeState = {
          ...initialState,
          activeSubscriptions: ['messages', 'stories'],
        };

        const action = clearActiveSubscriptions();
        const newState = realtimeReducer(stateWithSubscriptions, action);

        expect(newState.activeSubscriptions).toEqual([]);
      });
    });

    describe('addNewMessageNotification', () => {
      it('should add new notification', () => {
        const action = addNewMessageNotification({
          conversationId: 'conv1',
          messageAt: '2023-01-01T00:00:00Z',
        });
        const newState = realtimeReducer(initialState, action);

        expect(newState.newMessageNotifications).toEqual([
          { conversationId: 'conv1', count: 1, lastMessageAt: '2023-01-01T00:00:00Z' },
        ]);
      });

      it('should increment count for existing conversation', () => {
        const stateWithNotification: RealtimeState = {
          ...initialState,
          newMessageNotifications: [
            { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
          ],
        };

        const action = addNewMessageNotification({
          conversationId: 'conv1',
          messageAt: '2023-01-01T01:00:00Z',
        });
        const newState = realtimeReducer(stateWithNotification, action);

        expect(newState.newMessageNotifications).toEqual([
          { conversationId: 'conv1', count: 3, lastMessageAt: '2023-01-01T01:00:00Z' },
        ]);
      });

      it('should handle multiple conversations', () => {
        let state = initialState;

        state = realtimeReducer(
          state,
          addNewMessageNotification({
            conversationId: 'conv1',
            messageAt: '2023-01-01T00:00:00Z',
          }),
        );
        state = realtimeReducer(
          state,
          addNewMessageNotification({
            conversationId: 'conv2',
            messageAt: '2023-01-01T01:00:00Z',
          }),
        );

        expect(state.newMessageNotifications).toEqual([
          { conversationId: 'conv1', count: 1, lastMessageAt: '2023-01-01T00:00:00Z' },
          { conversationId: 'conv2', count: 1, lastMessageAt: '2023-01-01T01:00:00Z' },
        ]);
      });
    });

    describe('clearMessageNotification', () => {
      it('should remove specific conversation notification', () => {
        const stateWithNotifications: RealtimeState = {
          ...initialState,
          newMessageNotifications: [
            { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
            { conversationId: 'conv2', count: 1, lastMessageAt: '2023-01-01T01:00:00Z' },
          ],
        };

        const action = clearMessageNotification('conv1');
        const newState = realtimeReducer(stateWithNotifications, action);

        expect(newState.newMessageNotifications).toEqual([
          { conversationId: 'conv2', count: 1, lastMessageAt: '2023-01-01T01:00:00Z' },
        ]);
      });

      it('should handle removing non-existent notification', () => {
        const stateWithNotifications: RealtimeState = {
          ...initialState,
          newMessageNotifications: [
            { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
          ],
        };

        const action = clearMessageNotification('conv2');
        const newState = realtimeReducer(stateWithNotifications, action);

        expect(newState.newMessageNotifications).toEqual([
          { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
        ]);
      });
    });

    describe('clearAllMessageNotifications', () => {
      it('should clear all notifications', () => {
        const stateWithNotifications: RealtimeState = {
          ...initialState,
          newMessageNotifications: [
            { conversationId: 'conv1', count: 2, lastMessageAt: '2023-01-01T00:00:00Z' },
            { conversationId: 'conv2', count: 1, lastMessageAt: '2023-01-01T01:00:00Z' },
          ],
        };

        const action = clearAllMessageNotifications();
        const newState = realtimeReducer(stateWithNotifications, action);

        expect(newState.newMessageNotifications).toEqual([]);
      });
    });

    describe('setError', () => {
      it('should set error message', () => {
        const action = setError('Connection failed');
        const newState = realtimeReducer(initialState, action);

        expect(newState.error).toBe('Connection failed');
      });

      it('should clear error when set to null', () => {
        const stateWithError: RealtimeState = {
          ...initialState,
          error: 'Previous error',
        };

        const action = setError(null);
        const newState = realtimeReducer(stateWithError, action);

        expect(newState.error).toBe(null);
      });
    });
  });

  describe('action creators', () => {
    it('should create setConnectionStatus action', () => {
      const action = setConnectionStatus(true);
      expect(action.type).toBe('realtime/setConnectionStatus');
      expect(action.payload).toBe(true);
    });

    it('should create addActiveSubscription action', () => {
      const action = addActiveSubscription('messages');
      expect(action.type).toBe('realtime/addActiveSubscription');
      expect(action.payload).toBe('messages');
    });

    it('should create addNewMessageNotification action', () => {
      const notification = {
        conversationId: 'conv1',
        messageAt: '2023-01-01T00:00:00Z',
      };
      const action = addNewMessageNotification(notification);
      expect(action.type).toBe('realtime/addNewMessageNotification');
      expect(action.payload).toEqual(notification);
    });

    it('should create setError action', () => {
      const action = setError('Test error');
      expect(action.type).toBe('realtime/setError');
      expect(action.payload).toBe('Test error');
    });
  });
});
