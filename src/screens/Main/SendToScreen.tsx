/**
 * @file SendToScreen.tsx
 * @description Screen for selecting friends to send snaps to. Displays friends list with search functionality.
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
import { RootState } from '../../store';
import { getFriendsList, searchUsers, Friend } from '../../services/friendService';
import { uploadMediaToStorage, sendSnapToFriends } from '../../services/snapService';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
  async function handleSend() {
    if (selectedFriends.size === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to send the snap to.');
      return;
    }

    setIsSending(true);
    try {
      const recipientIds = Array.from(selectedFriends);

      await sendSnapToFriends(contentUri, contentType, recipientIds, user!.id, photoTimer);

      setSuccessMessage('Snap sent!');
      setTimeout(() => {
        setIsSending(false);
        setSuccessMessage('');
        navigation.navigate('Chat');
      }, 1200);
    } catch (error) {
      console.error('Error sending snaps:', error);
      Alert.alert('Error', 'Failed to send snap. Please try again.');
    }
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
          isSelected ? 'bg-brand-light' : 'bg-white'
        }`}
        onPress={() => toggleFriendSelection(item.id)}
      >
        {/* Avatar placeholder */}
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-brand-light">
          <Text className="font-heading text-lg font-bold text-brand">
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Friend info */}
        <View className="flex-1">
          <Text className="text-text-primary font-heading text-lg font-semibold">
            {item.username}
          </Text>
          <Text className="font-heading text-sm text-muted">
            {item.status === 'accepted' ? 'Friend' : 'User'}
          </Text>
        </View>

        {/* Selection indicator */}
        <View
          className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
            isSelected ? 'border-brand bg-brand' : 'border-gray-300'
          }`}
        >
          {isSelected && <Text className="font-heading text-sm text-white">✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF8C69" />
        <Text className="mt-4 font-heading text-muted">Loading friends...</Text>
      </View>
    );
  }

  // Show sending spinner
  if (isSending) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF8C69" />
        <Text className="mt-4 font-heading text-muted">Sending snap...</Text>
        {successMessage ? (
          <Text className="mt-4 font-heading text-lg font-semibold text-success">
            {successMessage}
          </Text>
        ) : null}
      </View>
    );
  }

  const displayData = searchTerm.length >= 2 ? searchResults : friends;
  const hasSelectedFriends = selectedFriends.size > 0;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
          <TouchableOpacity onPress={handleBack}>
            <Text className="font-heading text-lg font-semibold text-brand">Back</Text>
          </TouchableOpacity>

          <Text className="text-text-primary font-heading text-lg font-bold">Send To</Text>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!hasSelectedFriends}
            className={`rounded-full px-4 py-2 ${hasSelectedFriends ? 'bg-brand' : 'bg-gray-300'}`}
          >
            <Text
              className={`font-heading font-semibold ${hasSelectedFriends ? 'text-white' : 'text-muted'}`}
            >
              Send ({selectedFriends.size})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Search Bar */}
      <View className="border-b border-gray-200 bg-white p-4">
        <TextInput
          className="text-text-primary rounded-lg bg-gray-100 px-4 py-3 font-heading"
          placeholder="Search friends..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Content Preview */}
      <View className="border-b border-gray-200 bg-white p-4">
        <Text className="mb-2 font-heading text-sm text-muted">
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
              <ActivityIndicator size="large" color="#FF8C69" />
            ) : searchTerm.length >= 2 ? (
              <Text className="text-center font-heading text-muted">
                No users found for "{searchTerm}"
              </Text>
            ) : (
              <Text className="text-center font-heading text-muted">
                No friends found. Add some friends to get started!
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}
