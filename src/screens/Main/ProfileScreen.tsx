/**
 * @file ProfileScreen.tsx
 * @description Profile screen displaying user information and friend management options, now fully cloud-synced for vibe checks.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
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
import VibeCheckHistoryGrid from '../../components/ui/VibeCheckHistoryGrid';
import VibeCheckReport from '../../components/report/VibeCheckReport';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  fetchVibeChecksFromCloud,
  saveVibeCheckToCloud,
  deleteVibeCheckFromCloud,
  migrateLocalVibeChecksToCloud,
  VibeCheckRecord,
  fetchVibeChecksWithCache,
  fetchVibeChecksInBackground,
} from '../../services/vibeCheckService';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import CachedImage from '../../components/ui/CachedImage';
import tailwindConfig from '../../../tailwind.config';
import { getUserProfile } from '../../services/userService';
import { getOrCreateConversation } from '../../services/chatService';

// Safely access tailwind config with fallbacks
const brandColor = (tailwindConfig?.theme?.extend?.colors as any)?.brand?.DEFAULT || '#FFD700';
const brandLight = (tailwindConfig?.theme?.extend?.colors as any)?.brand?.light || '#FFF8DC';

/**
 * Displays the user's profile with basic information and navigation options.
 */
export default function ProfileScreen({ navigation, route }: { navigation: any; route: any }) {
  const loggedInUser = useSelector((state: RootState) => state.auth.user);
  const userId = route?.params?.userId || loggedInUser?.id;
  const isSelf = !route?.params?.userId || route?.params?.userId === loggedInUser?.id;
  console.log('ProfileScreen render', {
    userId,
    isSelf,
    routeParams: route?.params,
    routeKey: route.key,
  });
  const [profileUser, setProfileUser] = useState<any>(null);
  const dispatch = useDispatch();
  const [friendCount, setFriendCount] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [selectedTab, setSelectedTab] = useState<'stories' | 'vibes'>('vibes');
  const [showVibeCheckReport, setShowVibeCheckReport] = useState(false);
  const [selectedVibeCheck, setSelectedVibeCheck] = useState<VibeCheckRecord | null>(null);
  const [cloudVibeChecks, setCloudVibeChecks] = useState<VibeCheckRecord[]>([]);
  const [isMigrating, setIsMigrating] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { preloadForScreen } = useImagePreloader();

  useEffect(() => {
    console.log('ProfileScreen useEffect start', { userId, isSelf, routeKey: route.key });
    try {
      if (!isSelf && userId) {
        console.log('Fetching profile for userId:', userId);
        getUserProfile(userId).then(({ data, error }) => {
          console.log('Fetched profile:', data, error);
          setProfileUser(data);
        });
      } else {
        console.log('Setting profileUser to loggedInUser', loggedInUser);
        setProfileUser(loggedInUser);
      }
    } catch (err) {
      console.log('Error in ProfileScreen useEffect:', err);
    }
  }, [route.key, userId, isSelf, loggedInUser]);

  // Load user stats when component mounts
  useEffect(() => {
    if (profileUser?.id) {
      loadUserStats();
      fetchUserStories();
    }
  }, [profileUser?.id]);

  // Fetch cloud vibe checks and migrate local on mount
  useEffect(() => {
    if (!profileUser?.id) return;
    let didCancel = false;
    async function migrateAndFetch() {
      setIsMigrating(true);
      try {
        // Migrate local vibes to cloud (only needed once after update)
        await migrateLocalVibeChecksToCloud(profileUser.id);
      } catch (err) {
        // Ignore migration errors
      }
      if (!didCancel) {
        await refreshCloudVibes();
        setIsMigrating(false);
      }
    }
    migrateAndFetch();
    return () => {
      didCancel = true;
    };
  }, [profileUser?.id]);

  // Refresh on focus (e.g., after adding/deleting)
  useFocusEffect(
    useCallback(() => {
      if (profileUser?.id) refreshCloudVibes();
    }, [profileUser?.id]),
  );

  /**
   * Fetches all vibe checks from Supabase for the user with caching support.
   */
  async function refreshCloudVibes() {
    if (!profileUser?.id) return;

    let didCancel = false;

    try {
      console.log('Fetching vibe checks for user:', profileUser.id);
      console.log('Current logged in user:', loggedInUser?.id);
      console.log('Is viewing own profile:', isSelf);

      // First, try to load from cache for instant display
      setIsLoadingFromCache(true);
      const cachedVibeChecks = await fetchVibeChecksWithCache(profileUser.id, true);

      if (didCancel) return;

      if (cachedVibeChecks.length > 0) {
        console.log('📊 Displaying cached vibe checks:', cachedVibeChecks.length);
        setCloudVibeChecks(cachedVibeChecks);
        setIsLoadingFromCache(false);

        // Preload vibe check images for better performance
        const imageUrls = cachedVibeChecks
          .map((vibe) => vibe.source_url)
          .filter((url): url is string => url !== null && url !== undefined && url.trim() !== '');

        if (imageUrls.length > 0) {
          preloadForScreen('ProfileScreen', imageUrls);
        }
      } else {
        setIsLoadingFromCache(false);
      }

      // Then fetch fresh data in background - but don't clear existing data
      setIsRefreshing(true);
      const freshVibeChecks = await fetchVibeChecksInBackground(profileUser.id);

      if (didCancel) return;

      // Only update if we got fresh data and it's different from current
      if (freshVibeChecks.length > 0) {
        const currentIds = new Set(cloudVibeChecks.map((v) => v.id));
        const freshIds = new Set(freshVibeChecks.map((v) => v.id));

        // Check if the data has actually changed
        const hasChanged =
          freshVibeChecks.length !== cloudVibeChecks.length ||
          freshVibeChecks.some((v) => !currentIds.has(v.id)) ||
          cloudVibeChecks.some((v) => !freshIds.has(v.id));

        if (hasChanged) {
          console.log('🔄 Updated with fresh vibe checks:', freshVibeChecks.length);
          setCloudVibeChecks(freshVibeChecks);

          // Preload fresh vibe check images
          const imageUrls = freshVibeChecks
            .map((vibe) => vibe.source_url)
            .filter((url): url is string => url !== null && url !== undefined && url.trim() !== '');

          if (imageUrls.length > 0) {
            preloadForScreen('ProfileScreen', imageUrls);
          }
        } else {
          console.log('🔄 Fresh data is the same as cached data, no update needed');
        }
      } else if (freshVibeChecks.length === 0 && cloudVibeChecks.length > 0) {
        // If fresh data is empty but we have cached data, keep the cached data
        console.log('🔄 Fresh data is empty, keeping cached vibe checks');
      } else {
        // Update with empty array only if we don't have any cached data
        setCloudVibeChecks(freshVibeChecks);
      }
    } catch (err) {
      console.error('Error fetching vibe checks:', err);
      // Don't clear existing vibe checks on error - keep what we have
      if (!didCancel && cloudVibeChecks.length === 0) {
        setCloudVibeChecks([]);
      }
    } finally {
      if (!didCancel) {
        setIsLoadingFromCache(false);
        setIsRefreshing(false);
      }
    }
  }

  /**
   * Loads user statistics (friends, snaps, stories)
   */
  async function loadUserStats() {
    if (!profileUser?.id) return;
    setIsLoading(true);
    try {
      const friends = await getFriendsList(profileUser.id);
      setFriendCount(friends.length);
      const stories = await getUserStories(profileUser.id, false);
      setStoryCount(stories.length);
      setSnapCount(0);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserStories() {
    if (!profileUser?.id) return;
    try {
      const stories = await getUserStories(profileUser.id, false);
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
          // The RootNavigator will automatically handle navigation based on Redux state
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

  /**
   * Navigates to chat with the friend
   */
  async function handleSendMessage() {
    if (!profileUser?.id || !loggedInUser?.id) return;
    try {
      const conversationId = await getOrCreateConversation(loggedInUser.id, profileUser.id);
      navigation.navigate('Chat', {
        screen: 'IndividualChat',
        params: {
          conversationId,
          otherUserId: profileUser.id,
          otherUsername: profileUser.username,
        },
      });
    } catch (err) {
      console.error('Failed to start chat:', err);
    }
  }

  // Helper to display username in title case
  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (!profileUser) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  // Only after profileUser is guaranteed to be non-null
  const displayUsername = profileUser.username ? toTitleCase(profileUser.username) : '';

  /**
   * Handles tapping a Vibe Check history item
   */
  function handleVibeCheckPress(item: VibeCheckRecord) {
    setSelectedVibeCheck(item);
    setShowVibeCheckReport(true);
  }

  /**
   * Handles deleting a vibe check from the cloud with confirmation.
   */
  async function handleDeleteVibeCheck(id: string) {
    if (!profileUser?.id) return;
    Alert.alert('Delete Vibe Check', 'Are you sure you want to delete this vibe check?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            // Optimistically update UI
            setCloudVibeChecks((prev) => prev.filter((v) => v.id !== id));
            setShowVibeCheckReport(false);
            setSelectedVibeCheck(null);
            await deleteVibeCheckFromCloud(id, profileUser.id);
            // Optionally, refresh after a short delay to ensure backend is in sync
            setTimeout(refreshCloudVibes, 500);
          } catch (err) {
            // Optionally show error
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
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
    if (!profileUser) return;
    const usersWithStories = [
      {
        id: profileUser.id,
        username: profileUser.username,
        avatarUrl: (profileUser as any)?.avatarUrl || (profileUser as any)?.avatar_url || '',
        isOwn: true,
        hasStory: userStories.length > 0,
      },
    ];
    const storyIndex = userStories.findIndex((s) => s.id === story.id);
    navigation.navigate('StoryViewer', {
      userId: profileUser.id,
      username: profileUser.username,
      avatarUrl: (profileUser as any)?.avatarUrl || (profileUser as any)?.avatar_url || '',
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

  // Helper to map VibeCheckHistoryItem back to VibeCheckRecord for modal
  function handleVibeCheckHistoryItemPress(item: {
    id: string;
    photoUri: string;
    summary: string;
    detailedReport: string;
    timestamp: string;
  }) {
    // Find the full VibeCheckRecord by id
    const full = cloudVibeChecks.find((v) => v.id === item.id);
    if (full) {
      setSelectedVibeCheck(full);
      setShowVibeCheckReport(true);
    }
  }

  // Render profile header
  const renderProfileHeader = () => {
    return (
      <View>
        {/* Profile Info Card */}
        <View className="px-4 pb-4 pt-4">
          <View className="flex-row items-center">
            <View className="w-24 flex-shrink-0 items-center justify-center">
              {(profileUser as any).avatar_url ? (
                <CachedImage
                  uri={(profileUser as any).avatar_url}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  fallbackSource={require('../../../assets/icon.png')}
                  showLoadingIndicator={false}
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-brand">
                  <Text className="font-heading text-4xl font-bold text-white">
                    {profileUser.username?.charAt(0).toUpperCase() || 'U'}
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
                  {isLoading || isMigrating ? '...' : cloudVibeChecks.length}
                </Text>
                <Text className="text-text-secondary text-xs">Vibes</Text>
              </View>
            </View>
          </View>
          {/* Name, Handle, and Bio Section */}
          <View className="pt-4">
            <Text className="text-text-primary font-heading text-base font-bold">
              {(profileUser as any).displayName || displayUsername || 'User'}
            </Text>
            <Text className="text-text-secondary text-sm">
              @{profileUser.username || 'username'}
            </Text>
            <Text className="text-text-primary mt-2 text-base">
              {(profileUser as any).bio ||
                'Lover of squeaky toys & long walks on the beach. Professional napper. Send snacks.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Section */}
        {isSelf ? (
          // Own profile: Add Vibe Check, Edit Profile, Add Friend Icon
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
          // Friend profile: Add Friend and Send Message
          <View className="flex-row justify-center gap-4 px-4 pb-4">
            <Button
              label="Add Friend"
              variant="primary"
              onPress={handleAddFriends}
              className="flex-1 rounded-xl py-2 text-sm shadow-lg"
            />
            <Button
              label="Send Message"
              variant="secondary"
              onPress={handleSendMessage}
              className="text-brand-red flex-1 rounded-xl bg-brand-light py-2 text-sm"
            />
          </View>
        )}

        {/* Tab Navigation */}
        <View className="border-b border-gray-200">
          <View className="flex-row justify-around">
            <TouchableOpacity
              className={`flex-1 items-center border-b-2 py-2 text-center ${selectedTab === 'vibes' ? 'border-yellow-400' : 'border-transparent'}`}
              style={
                selectedTab === 'vibes'
                  ? {
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }
                  : undefined
              }
              onPress={() => setSelectedTab('vibes')}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20 }}>🐾✨</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 items-center border-b-2 py-2 text-center ${selectedTab === 'stories' ? 'border-text-primary' : 'border-transparent'}`}
              style={
                selectedTab === 'stories'
                  ? {
                      backgroundColor: 'rgba(255,255,255,0.4)',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }
                  : undefined
              }
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
  };

  // Render content based on selected tab
  const renderContent = () => {
    if (selectedTab === 'vibes') {
      if (isLoadingFromCache && cloudVibeChecks.length === 0) {
        return (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#FFD700" />
            <Text className="mt-4 text-base text-gray-500">Loading vibes...</Text>
          </View>
        );
      }

      if (isRefreshing && cloudVibeChecks.length > 0) {
        return (
          <View className="px-1 pb-4 pt-1">
            <View className="mb-2 flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFD700" />
              <Text className="ml-2 text-sm text-gray-500">Refreshing...</Text>
            </View>
            <VibeCheckHistoryGrid
              items={cloudVibeChecks.map((v) => ({
                id: v.id!,
                photoUri: v.source_url || '',
                summary: v.short_summary,
                detailedReport: v.detailed_report,
                timestamp: v.request_timestamp,
              }))}
              onItemPress={handleVibeCheckHistoryItemPress}
              getRelativeTime={getRelativeTime}
            />
          </View>
        );
      }

      return (
        <View className="px-1 pb-4 pt-1">
          <VibeCheckHistoryGrid
            items={cloudVibeChecks.map((v) => ({
              id: v.id!,
              photoUri: v.source_url || '',
              summary: v.short_summary,
              detailedReport: v.detailed_report,
              timestamp: v.request_timestamp,
            }))}
            onItemPress={handleVibeCheckHistoryItemPress}
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: brandLight }}>
      {/* Header with Back button for friend profile */}
      {!isSelf && (
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-transparent px-6 py-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="font-heading text-lg font-semibold text-brand">Back</Text>
          </TouchableOpacity>
          <View />
          <View style={{ width: 48 }} />
        </View>
      )}
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
          report={selectedVibeCheck.detailed_report}
          photoUri={selectedVibeCheck.source_url}
          isLoading={false}
          onDelete={() => handleDeleteVibeCheck(selectedVibeCheck.id!)}
        />
      )}
    </SafeAreaView>
  );
}
