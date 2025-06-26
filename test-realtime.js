/**
 * @file test-realtime.js
 * @description Simple test script to verify realtime subscription functionality
 * Run with: node test-realtime.js
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase credentials here
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ Please set your Supabase credentials:');
  console.log('   SUPABASE_URL=your_url SUPABASE_ANON_KEY=your_key node test-realtime.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtimeSubscription() {
  console.log('🧪 Testing realtime subscription...');

  // Test user ID (replace with a real user ID from your database)
  const testUserId = 'test-user-id';

  // Subscribe to new messages
  const channel = supabase
    .channel('test-messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${testUserId}`,
      },
      (payload) => {
        console.log('✅ New message received:', payload);
      },
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to new messages');
      }
    });

  // Wait a bit for subscription to establish
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test inserting a message (you'll need to modify this based on your schema)
  console.log('📝 Testing message insertion...');
  try {
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: 'test-conversation-id',
      sender_id: 'other-user-id',
      recipient_id: testUserId,
      message_type: 'text',
      content: 'Test message from realtime test',
      is_viewed: false,
    });

    if (error) {
      console.error('❌ Error inserting test message:', error);
    } else {
      console.log('✅ Test message inserted:', data);
    }
  } catch (error) {
    console.error('❌ Error during test:', error);
  }

  // Wait for the realtime event
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Cleanup
  channel.unsubscribe();
  console.log('🧹 Test completed');
}

testRealtimeSubscription().catch(console.error);
