# Realtime Subscription Testing Guide

## Overview

This guide covers testing the realtime subscription functionality for chat messages in SnapConnect.

## Prerequisites

1. Expo development server running (`npm start`)
2. Two test user accounts in your Supabase database
3. Supabase Realtime enabled in your project settings

## Testing Methods

### Method 1: Manual Testing in App

#### Step 1: Setup Test Users

1. Create two test accounts in your app:
   - User A: `testuser1@example.com`
   - User B: `testuser2@example.com`

2. Add them as friends to each other

#### Step 2: Test Realtime Connection

1. Login as User A
2. Navigate to the Chat screen
3. Look for the connection status indicator:
   - ✅ **Green**: "🔌 Connecting to real-time updates..." (briefly)
   - ✅ **No indicator**: Connection established successfully

#### Step 3: Test Message Reception

1. Keep User A on the Chat screen
2. Login as User B on another device/simulator
3. Send a snap or message to User A
4. **Expected Result**: User A should see:
   - Unread count badge update immediately
   - New conversation appear at top of list
   - No need to refresh manually

#### Step 4: Test Multiple Messages

1. Send multiple messages from User B to User A
2. **Expected Result**: Unread count should increment in real-time

### Method 2: Console Logging Verification

#### Step 1: Enable Debug Logs

The app includes comprehensive logging. Watch the console for:

```
🚀 Initializing realtime subscriptions in ChatScreen
✅ Subscribed to new messages for user [user-id]
📨 New message received: [payload]
```

#### Step 2: Monitor Redux State

Use Redux DevTools or console logs to verify:

- `realtime.isConnected: true`
- `realtime.activeSubscriptions: ['messages']`
- `realtime.newMessageNotifications: [...]`

### Method 3: Automated Testing

#### Step 1: Run Test Script

```bash
# Set your Supabase credentials
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"

# Run the test script
node test-realtime.js
```

#### Step 2: Verify Output

Expected output:

```
🧪 Testing realtime subscription...
📡 Subscription status: SUBSCRIBED
✅ Successfully subscribed to new messages
📝 Testing message insertion...
✅ Test message inserted: [data]
✅ New message received: [payload]
🧹 Test completed
```

## Common Issues & Solutions

### Issue: "Connection failed" or "Subscription error"

**Solution**:

1. Check Supabase Realtime is enabled in your project
2. Verify RLS policies allow the subscription
3. Check network connectivity

### Issue: Messages not appearing in real-time

**Solution**:

1. Verify the `recipient_id` filter matches the current user
2. Check that messages are being inserted with correct `conversation_id`
3. Ensure the user is authenticated

### Issue: Unread counts not updating

**Solution**:

1. Check Redux state for `newMessageNotifications`
2. Verify the conversation ID matches between database and Redux
3. Check that `markMessagesAsViewed` is being called when opening conversations

## Testing Checklist

- [ ] Connection status indicator appears and disappears correctly
- [ ] New messages trigger real-time updates
- [ ] Unread counts increment in real-time
- [ ] Conversations list updates without manual refresh
- [ ] Subscriptions clean up properly when leaving the screen
- [ ] Multiple messages from same conversation increment count correctly
- [ ] Messages from different conversations show separate notifications

## Performance Testing

### Test Concurrent Messages

1. Send 10+ messages rapidly from User B to User A
2. Verify all messages are received and counted correctly
3. Check for any performance degradation

### Test Network Interruption

1. Disconnect network while app is running
2. Reconnect network
3. Verify subscriptions re-establish automatically

## Debug Commands

### Check Supabase Realtime Status

```sql
-- In Supabase SQL editor
SELECT * FROM pg_stat_activity WHERE application_name LIKE '%realtime%';
```

### Monitor Message Inserts

```sql
-- In Supabase SQL editor
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;
```

## Next Steps After Testing

1. If all tests pass, proceed to 8.1C (unread counts and lifecycle management)
2. If issues found, debug and fix before proceeding
3. Consider adding unit tests for the realtime service functions
