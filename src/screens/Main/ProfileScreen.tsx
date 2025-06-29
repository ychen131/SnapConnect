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
} from '../../services/vibeCheckService';

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
  const [selectedVibeCheck, setSelectedVibeCheck] = useState<VibeCheckRecord | null>(null);
  const [cloudVibeChecks, setCloudVibeChecks] = useState<VibeCheckRecord[]>([]);
  const [isMigrating, setIsMigrating] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user stats when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      fetchUserStories();
    }
  }, [user?.id]);

  // Fetch cloud vibe checks and migrate local on mount
  useEffect(() => {
    if (!user?.id) return;
    let didCancel = false;
    async function migrateAndFetch() {
      setIsMigrating(true);
      try {
        // Migrate local vibes to cloud (only needed once after update)
        await migrateLocalVibeChecksToCloud(user.id);
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
  }, [user?.id]);

  // Refresh on focus (e.g., after adding/deleting)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) refreshCloudVibes();
    }, [user?.id]),
  );

  /**
   * Fetches all vibe checks from Supabase for the user.
   */
  async function refreshCloudVibes() {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const vibes = await fetchVibeChecksFromCloud(user.id);
      setCloudVibeChecks(vibes);
    } catch (err) {
      setCloudVibeChecks([]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Loads user statistics (friends, snaps, stories)
   */
  async function loadUserStats() {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const friends = await getFriendsList(user.id);
      setFriendCount(friends.length);
      const stories = await getUserStories(user.id, false);
      setStoryCount(stories.length);
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

  // Helper to display username in title case
  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  const displayUsername = (user as any).username ? toTitleCase((user as any).username) : '';

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
    if (!user?.id) return;
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
            await deleteVibeCheckFromCloud(id, user.id);
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

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">User not found</Text>
      </View>
    );
  }

  // Render profile header
  const renderProfileHeader = () => {
    return (
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
                  {isLoading || isMigrating ? '...' : cloudVibeChecks.length}
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
  };

  // Render content based on selected tab
  const renderContent = () => {
    if (selectedTab === 'vibes') {
      if (isLoading || isMigrating) {
        return (
          <View className="flex-1 items-center justify-center py-8">
            <ActivityIndicator size="large" color="#FFD700" />
            <Text className="mt-4 text-base text-gray-500">Loading vibes...</Text>
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
          report={selectedVibeCheck.detailed_report}
          photoUri={selectedVibeCheck.source_url}
          isLoading={false}
          onDelete={() => handleDeleteVibeCheck(selectedVibeCheck.id!)}
        />
      )}
    </SafeAreaView>
  );
}
