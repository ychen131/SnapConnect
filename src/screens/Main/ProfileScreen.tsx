/**
 * @file ProfileScreen.tsx
 * @description Profile screen displaying user information and friend management options.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { getFriendsList } from '../../services/friendService';
import { getUserStories } from '../../services/storyService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Menu from '../../components/ui/Menu';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StoriesGrid, { Story } from '../../components/ui/StoriesGrid';
import VibeCheckHistoryGrid, {
  VibeCheckHistoryItem,
} from '../../components/ui/VibeCheckHistoryGrid';
import VibeCheckReport from '../../components/report/VibeCheckReport';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Displays the user's profile with basic information and navigation options.
 */
export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [friendCount, setFriendCount] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [selectedTab, setSelectedTab] = useState<'stories' | 'vibes'>('vibes');
  const [showVibeCheckReport, setShowVibeCheckReport] = useState(false);
  const [selectedVibeCheck, setSelectedVibeCheck] = useState<VibeCheckHistoryItem | null>(null);
  const [savedVibeChecks, setSavedVibeChecks] = useState<VibeCheckHistoryItem[]>([]);

  // Mock data for Vibe Check history (replace with real data later)
  const [vibeCheckHistory] = useState<VibeCheckHistoryItem[]>([
    {
      id: '1',
      photoUri: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
      summary: 'A happy pup, calm and curious about the world.',
      detailedReport: `## 🐕 VIBE CHECK REPORT

### Emotional State Assessment
Based on the observed visual cues, your dog appears to have a calm and curious emotional state. There are no signs of anxiety, fear, or aggression.

### Body Language Breakdown
The relaxed body posture, neutral ear positioning, and a tail held in a neutral to slightly elevated position are strong indicators of a relaxed and comfortable state.

### Behavioral Context
The leash and walking posture suggest your dog is likely on a walk, exploring its surroundings. This is a common context for dogs to exhibit curiosity and interest.

### Comfort & Well-being Level
The comfort level of your dog seems to be quite high. The relaxed body language and lack of stress indicators contribute to this assessment.

### Scientific Backing
Scientific research in canine behavior supports these conclusions. Studies have shown that dogs express their emotional states through body language.

### Recommendations
Continue providing your dog with opportunities for exploration and stimulation, like regular walks or play sessions.`,
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      photoUri: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=400&h=400&fit=crop',
      summary: 'A curious explorer, ready for adventure!',
      detailedReport: `## 🐕 VIBE CHECK REPORT

### Emotional State Assessment
Your dog shows signs of excitement and curiosity, with alert ears and an engaged posture indicating readiness for activity.

### Body Language Breakdown
The forward-leaning stance, perked ears, and focused gaze suggest your dog is in an active, alert state. The tail position indicates positive anticipation.

### Behavioral Context
This appears to be a moment of preparation for an activity - possibly before a walk, play session, or training. The environment seems to be stimulating your dog's interest.

### Comfort & Well-being Level
Your dog appears comfortable and excited, showing healthy engagement with the environment. The energy level suggests good physical and mental well-being.

### Scientific Backing
Research shows that dogs display specific body language when anticipating positive activities, including forward posture and alert facial expressions.

### Recommendations
Channel this energy into positive activities like walks, play, or training sessions. This is a great time for interactive engagement.`,
      timestamp: '1 day ago',
    },
  ]);

  // Load user stats when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      fetchUserStories();
    }
  }, [user?.id]);

  // Refresh stats when screen comes into focus (e.g., after adding friends)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUserStats();
      }
    }, [user?.id]),
  );

  // Load saved Vibe Checks from AsyncStorage
  async function loadSavedVibeChecks() {
    try {
      const data = await AsyncStorage.getItem('savedVibeChecks');
      setSavedVibeChecks(data ? JSON.parse(data) : []);
    } catch (err) {
      setSavedVibeChecks([]);
    }
  }

  // Load on mount and when screen is focused
  useEffect(() => {
    loadSavedVibeChecks();
    const unsubscribe = navigation.addListener('focus', loadSavedVibeChecks);
    return unsubscribe;
  }, [navigation]);

  // Merge mock and real Vibe Checks (avoid duplicates by id, sort by timestamp desc)
  const allVibeChecks = React.useMemo(() => {
    const all = [...vibeCheckHistory];
    const existingIds = new Set(all.map((v) => v.id));
    for (const vibe of savedVibeChecks) {
      if (!existingIds.has(vibe.id)) all.push(vibe);
    }
    // Sort by timestamp desc (newest first)
    return all.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return tb - ta;
    });
  }, [vibeCheckHistory, savedVibeChecks]);

  /**
   * Loads user statistics (friends, snaps, stories)
   */
  async function loadUserStats() {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load friend count
      const friends = await getFriendsList(user.id);
      setFriendCount(friends.length);

      // Load story count
      const stories = await getUserStories(user.id, false); // Only active stories
      setStoryCount(stories.length);

      // TODO: Load snap count when that feature is implemented
      // For now, we'll keep it at 0
      setSnapCount(0);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserStories() {
    if (!user?.id) return;
    try {
      const stories = await getUserStories(user.id, false);
      setUserStories(stories);
    } catch (error) {
      setUserStories([]);
    }
  }

  /**
   * Handles user logout
   */
  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        },
      },
    ]);
  }

  /**
   * Navigates to Add Friends screen
   */
  function handleAddFriends() {
    navigation.navigate('AddFriends');
  }

  /**
   * Navigates to Settings screen
   */
  function handleSettings() {
    navigation.navigate('Settings');
  }

  /**
   * Navigates to Camera screen for a new Vibe Check
   */
  function handleNewVibeCheck() {
    navigation.navigate('Camera');
  }

  // Helper to display username in title case
  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  const displayUsername = (user as any).username ? toTitleCase((user as any).username) : '';

  /**
   * Handles tapping a Vibe Check history item
   */
  function handleVibeCheckPress(item: VibeCheckHistoryItem) {
    // Ensure the item has a unique id
    let vibeCheck = item;
    if (!vibeCheck.id) {
      vibeCheck = { ...item, id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}` };
    }
    setSelectedVibeCheck(vibeCheck);
    setShowVibeCheckReport(true);
  }

  /**
   * Handles deleting a saved Vibe Check
   */
  async function handleDeleteVibeCheck(id: string) {
    const filtered = savedVibeChecks.filter((v) => v.id !== id);
    await AsyncStorage.setItem('savedVibeChecks', JSON.stringify(filtered));
    setSavedVibeChecks(filtered);
    setShowVibeCheckReport(false);
  }

  /**
   * Closes the Vibe Check report modal
   */
  function handleCloseVibeCheckReport() {
    setShowVibeCheckReport(false);
    setSelectedVibeCheck(null);
  }

  // Handler for pressing a story in the grid
  function handleStoryPress(story: Story) {
    if (!user) return;
    const usersWithStories = [
      {
        id: user.id,
        username: user.username,
        avatarUrl: (user as any)?.avatarUrl || (user as any)?.avatar_url || '',
        isOwn: true,
        hasStory: userStories.length > 0,
      },
    ];
    const storyIndex = userStories.findIndex((s) => s.id === story.id);
    navigation.navigate('StoryViewer', {
      userId: user.id,
      username: user.username,
      avatarUrl: (user as any)?.avatarUrl || (user as any)?.avatar_url || '',
      usersWithStories,
      userIndex: 0,
      storyIndex,
    });
  }

  // Utility to get relative time
  function getRelativeTime(timestamp: string) {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  }

  // Handler for saving a Vibe Check to profile
  async function handleSaveToProfile(vibeCheck: VibeCheckHistoryItem) {
    if (!vibeCheck) return;
    const alreadySaved = savedVibeChecks.some((v) => v.id === vibeCheck.id);
    if (alreadySaved) return;
    const updated = [...savedVibeChecks, vibeCheck];
    await AsyncStorage.setItem('savedVibeChecks', JSON.stringify(updated));
    setSavedVibeChecks(updated);
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">User not found</Text>
      </View>
    );
  }

  // Render profile header
  const renderProfileHeader = () => (
    <View>
      {/* Profile Info Card */}
      <View className="px-4 pb-4 pt-4">
        <View className="flex-row items-center">
          <View className="w-24 flex-shrink-0 items-center justify-center">
            {(user as any).avatar_url ? (
              <Image
                source={{ uri: (user as any).avatar_url }}
                className="h-24 w-24 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-brand">
                <Text className="font-heading text-4xl font-bold text-white">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View className="ml-4 flex-grow flex-row items-center justify-around">
            <View className="items-center">
              <Text className="text-text-primary font-heading text-lg font-bold">
                {isLoading ? '...' : storyCount}
              </Text>
              <Text className="text-text-secondary text-xs">Stories</Text>
            </View>
            <View className="items-center">
              <Text className="text-text-primary font-heading text-lg font-bold">
                {isLoading ? '...' : friendCount}
              </Text>
              <Text className="text-text-secondary text-xs">Friends</Text>
            </View>
            <View className="items-center">
              <Text className="text-text-primary font-heading text-lg font-bold">
                {vibeCheckHistory.length}
              </Text>
              <Text className="text-text-secondary text-xs">Vibes</Text>
            </View>
          </View>
        </View>
        {/* Name, Handle, and Bio Section */}
        <View className="pt-4">
          <Text className="text-text-primary font-heading text-base font-bold">
            {(user as any).displayName || displayUsername || 'User'}
          </Text>
          <Text className="text-text-secondary text-sm">@{user.username || 'username'}</Text>
          <Text className="text-text-primary mt-2 text-base">
            {(user as any).bio ||
              'Lover of squeaky toys & long walks on the beach. Professional napper. Send snacks.'}
          </Text>
        </View>
      </View>

      {/* Action Buttons Section */}
      {user.id === (user as any).id ? (
        <View className="flex-row items-center justify-center gap-2 px-4 pb-4">
          {/* Add Vibe Check CTA (fills half row) */}
          <TouchableOpacity
            onPress={handleNewVibeCheck}
            className="flex-1 items-center justify-center rounded-xl bg-brand py-2 shadow-md"
            activeOpacity={0.85}
          >
            <Text className="font-heading text-base font-bold text-white">Add Vibe Check</Text>
          </TouchableOpacity>

          {/* Edit Profile (fills half row) */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            className="flex-1 items-center justify-center rounded-xl border border-gray-300 bg-gray-200 py-2"
            activeOpacity={0.85}
          >
            <Text className="font-heading text-base font-bold text-gray-800">Edit Profile</Text>
          </TouchableOpacity>

          {/* Add Friend Icon Button (square, not stretched) */}
          <TouchableOpacity
            onPress={handleAddFriends}
            className="ml-2 items-center justify-center border border-gray-300 bg-gray-200"
            style={{ width: 36, height: 36, borderRadius: 10 }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={18} color="#2D2D2D" />
          </TouchableOpacity>
        </View>
      ) : (
        // Friend or potential friend profile: Add Friend and Send Snap, bold CTAs
        <View className="flex-row justify-center gap-4 px-4 pb-4">
          <Button
            label="Add Friend"
            variant="primary"
            onPress={handleAddFriends}
            className="flex-1 rounded-xl py-2 text-sm shadow-lg"
          />
          <Button
            label="Send Snap"
            variant="secondary"
            onPress={() => {}}
            className="text-brand-red flex-1 rounded-xl bg-brand-light py-2 text-sm"
          />
        </View>
      )}

      {/* Tab Navigation */}
      <View className="border-b border-gray-200">
        <View className="flex-row justify-around">
          <TouchableOpacity
            className={`flex-1 items-center border-b-2 py-2 text-center ${selectedTab === 'vibes' ? 'border-yellow-400' : 'border-transparent'}`}
            onPress={() => setSelectedTab('vibes')}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 20 }}>🐾✨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center border-b-2 py-2 text-center ${selectedTab === 'stories' ? 'border-text-primary' : 'border-transparent'}`}
            onPress={() => setSelectedTab('stories')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="view-grid"
              size={20}
              color={selectedTab === 'stories' ? '#2D2D2D' : '#AAB0B7'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render content based on selected tab
  const renderContent = () => {
    if (selectedTab === 'vibes') {
      return (
        <View className="px-1 pb-4 pt-1">
          <VibeCheckHistoryGrid
            items={allVibeChecks}
            onItemPress={handleVibeCheckPress}
            getRelativeTime={getRelativeTime}
          />
        </View>
      );
    } else {
      return (
        <View className="px-1 pb-4 pt-1">
          <StoriesGrid stories={userStories} onStoryPress={handleStoryPress} />
        </View>
      );
    }
  };

  // Data for FlatList - just one item that contains everything
  const flatListData = [{ id: 'profile-content' }];

  const renderItem = () => (
    <View>
      {renderProfileHeader()}
      {renderContent()}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />

      {/* Vibe Check Report Modal */}
      {selectedVibeCheck && (
        <VibeCheckReport
          visible={showVibeCheckReport}
          onClose={handleCloseVibeCheckReport}
          report={selectedVibeCheck.detailedReport}
          photoUri={selectedVibeCheck.photoUri}
          isLoading={false}
          onDelete={
            selectedVibeCheck && savedVibeChecks.some((v) => v.id === selectedVibeCheck.id)
              ? () => handleDeleteVibeCheck(selectedVibeCheck.id)
              : undefined
          }
          onSaveToProfile={
            selectedVibeCheck && !savedVibeChecks.some((v) => v.id === selectedVibeCheck.id)
              ? () => handleSaveToProfile(selectedVibeCheck)
              : undefined
          }
        />
      )}
    </SafeAreaView>
  );
}
