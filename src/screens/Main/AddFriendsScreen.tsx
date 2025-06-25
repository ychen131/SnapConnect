/**
 * @file AddFriendsScreen.tsx
 * @description Screen for adding friends via username search and managing pending friend requests.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import {
  searchUsers,
  sendFriendRequest,
  getPendingRequests,
  acceptFriendRequest,
  declineFriendRequest,
  Friend,
} from '../../services/friendService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type TabType = 'search' | 'requests';

/**
 * Displays the Add Friends screen with search and pending requests tabs.
 */
export default function AddFriendsScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState<TabType>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  // Load pending requests when component mounts
  useEffect(() => {
    loadPendingRequests();
  }, []);

  // Search users when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      performUserSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  /**
   * Loads pending friend requests for the current user
   */
  async function loadPendingRequests() {
    if (!user?.id) return;

    setIsLoadingRequests(true);
    try {
      const requests = await getPendingRequests(user.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      Alert.alert('Error', 'Failed to load pending requests');
    } finally {
      setIsLoadingRequests(false);
    }
  }

  /**
   * Searches for users by username
   */
  async function performUserSearch() {
    if (!user?.id || searchTerm.length < 2) return;

    setIsSearching(true);
    try {
      const results = await searchUsers(searchTerm, user.id);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Sends a friend request to a user
   */
  async function handleSendFriendRequest(friendId: string) {
    if (!user?.id) return;

    setSendingRequests((prev) => new Set(prev).add(friendId));

    try {
      const success = await sendFriendRequest(user.id, friendId);

      if (success) {
        Alert.alert('Success', 'Friend request sent!');
        // Refresh search results to update UI
        if (searchTerm.length >= 2) {
          performUserSearch();
        }
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setSendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(friendId);
        return newSet;
      });
    }
  }

  /**
   * Accepts a friend request
   */
  async function handleAcceptRequest(fromUserId: string) {
    if (!user?.id) return;

    try {
      const success = await acceptFriendRequest(fromUserId, user.id);

      if (success) {
        Alert.alert('Success', 'Friend request accepted!');
        // Refresh pending requests
        loadPendingRequests();
      } else {
        Alert.alert('Error', 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  }

  /**
   * Declines a friend request
   */
  async function handleDeclineRequest(fromUserId: string) {
    if (!user?.id) return;

    try {
      const success = await declineFriendRequest(fromUserId, user.id);

      if (success) {
        Alert.alert('Success', 'Friend request declined');
        // Refresh pending requests
        loadPendingRequests();
      } else {
        Alert.alert('Error', 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  }

  /**
   * Renders a search result item
   */
  function renderSearchResult({ item }: { item: Friend }) {
    const isSending = sendingRequests.has(item.id);

    return (
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white p-4">
        {/* User info */}
        <View className="flex-1 flex-row items-center">
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-purple-500">
            <Text className="text-lg font-bold text-white">
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{item.username}</Text>
            <Text className="text-sm text-gray-500">@{item.username}</Text>
          </View>
        </View>

        {/* Add Friend button */}
        <TouchableOpacity
          onPress={() => handleSendFriendRequest(item.id)}
          disabled={isSending}
          className={`rounded-full px-4 py-2 ${isSending ? 'bg-gray-300' : 'bg-purple-500'}`}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#6b7280" />
          ) : (
            <Text className="font-semibold text-white">Add Friend</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  /**
   * Renders a pending request item
   */
  function renderPendingRequest({ item }: { item: Friend }) {
    return (
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white p-4">
        {/* User info */}
        <View className="flex-1 flex-row items-center">
          <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-purple-500">
            <Text className="text-lg font-bold text-white">
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800">{item.username}</Text>
            <Text className="text-sm text-gray-500">wants to be your friend</Text>
          </View>
        </View>

        {/* Accept/Decline buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleAcceptRequest(item.id)}
            className="rounded-full bg-green-500 px-4 py-2"
          >
            <Text className="font-semibold text-white">Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeclineRequest(item.id)}
            className="rounded-full bg-red-500 px-4 py-2"
          >
            <Text className="font-semibold text-white">Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-lg font-semibold text-purple-600">Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-800">Add Friends</Text>
          <View className="w-12" />
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="border-b border-gray-200 bg-white">
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab('search')}
            className={`flex-1 py-4 ${activeTab === 'search' ? 'border-b-2 border-purple-500' : ''}`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'search' ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              Search
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            className={`flex-1 py-4 ${activeTab === 'requests' ? 'border-b-2 border-purple-500' : ''}`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === 'requests' ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              Requests ({pendingRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <View className="flex-1">
          {/* Search Bar */}
          <View className="border-b border-gray-200 bg-white p-4">
            <TextInput
              className="rounded-lg bg-gray-100 px-4 py-3 text-gray-800"
              placeholder="Search by username..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Search Results */}
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            className="flex-1"
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center p-8">
                {isSearching ? (
                  <ActivityIndicator size="large" color="#8b5cf6" />
                ) : searchTerm.length >= 2 ? (
                  <Text className="text-center text-gray-500">
                    No users found for "{searchTerm}"
                  </Text>
                ) : (
                  <Text className="text-center text-gray-500">
                    Search for friends by their username
                  </Text>
                )}
              </View>
            }
          />
        </View>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <View className="flex-1">
          <FlatList
            data={pendingRequests}
            renderItem={renderPendingRequest}
            keyExtractor={(item) => item.id}
            className="flex-1"
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center p-8">
                {isLoadingRequests ? (
                  <ActivityIndicator size="large" color="#8b5cf6" />
                ) : (
                  <Text className="text-center text-gray-500">No pending friend requests</Text>
                )}
              </View>
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
