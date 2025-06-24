/**
 * @file SendToScreen.tsx
 * @description Screen for selecting friends to send snaps to. Displays friends list with search functionality.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getFriendsList, searchUsers, Friend } from '../../services/friendService';

interface SendToScreenProps {
  navigation: any;
  route: {
    params: {
      contentUri: string;
      contentType: 'photo' | 'video';
      photoTimer?: number;
    };
  };
}

/**
 * Displays a list of friends for sending snaps to
 */
export default function SendToScreen({ navigation, route }: SendToScreenProps) {
  const { contentUri, contentType, photoTimer } = route.params;
  const user = useSelector((state: RootState) => state.auth.user);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);

  // Load friends list on component mount
  useEffect(() => {
    loadFriends();
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
   * Loads the current user's friends list
   */
  async function loadFriends() {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const friendsList = await getFriendsList(user.id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoading(false);
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
    } finally {
      setIsSearching(false);
    }
  }

  /**
   * Toggles friend selection
   */
  function toggleFriendSelection(friendId: string) {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  }

  /**
   * Handles sending the snap to selected friends
   */
  function handleSend() {
    if (selectedFriends.size === 0) {
      // Show error or alert
      return;
    }

    console.log('📤 Sending snap to friends:', Array.from(selectedFriends));
    console.log('📁 Content URI:', contentUri);
    console.log('📹 Content Type:', contentType);
    console.log('⏱️ Photo Timer:', photoTimer);

    // TODO: Implement actual snap sending logic
    // For now, just navigate back to camera
    navigation.navigate('Camera');
  }

  /**
   * Handles going back to preview
   */
  function handleBack() {
    navigation.goBack();
  }

  /**
   * Renders a friend item in the list
   */
  function renderFriendItem({ item }: { item: Friend }) {
    const isSelected = selectedFriends.has(item.id);

    return (
      <TouchableOpacity
        className={`flex-row items-center border-b border-gray-200 p-4 ${
          isSelected ? 'bg-blue-50' : 'bg-white'
        }`}
        onPress={() => toggleFriendSelection(item.id)}
      >
        {/* Avatar placeholder */}
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-gray-300">
          <Text className="text-lg font-bold text-gray-600">
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{item.username}</Text>
          <Text className="text-sm text-gray-500">
            {item.status === 'accepted' ? 'Friend' : 'User'}
          </Text>
        </View>

        {/* Selection indicator */}
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
          }`}
        >
          {isSelected && <Text className="text-sm text-white">✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading friends...</Text>
      </View>
    );
  }

  const displayData = searchTerm.length >= 2 ? searchResults : friends;
  const hasSelectedFriends = selectedFriends.size > 0;

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
        <TouchableOpacity onPress={handleBack}>
          <Text className="text-lg font-semibold text-blue-500">Back</Text>
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">Send To</Text>

        <TouchableOpacity
          onPress={handleSend}
          disabled={!hasSelectedFriends}
          className={`rounded-full px-4 py-2 ${hasSelectedFriends ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Text className={`font-semibold ${hasSelectedFriends ? 'text-white' : 'text-gray-500'}`}>
            Send ({selectedFriends.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="border-b border-gray-200 p-4">
        <TextInput
          className="rounded-lg bg-gray-100 px-4 py-3 text-gray-800"
          placeholder="Search friends..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Content Preview */}
      <View className="border-b border-gray-200 p-4">
        <Text className="mb-2 text-sm text-gray-600">
          {contentType === 'photo' ? '📸 Photo' : '🎬 Video'}
          {contentType === 'photo' && photoTimer && ` • ${photoTimer}s`}
        </Text>
      </View>

      {/* Friends List */}
      <FlatList
        data={displayData}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        className="flex-1"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            {isSearching ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : searchTerm.length >= 2 ? (
              <Text className="text-center text-gray-500">No users found for "{searchTerm}"</Text>
            ) : (
              <Text className="text-center text-gray-500">
                No friends found. Add some friends to get started!
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
