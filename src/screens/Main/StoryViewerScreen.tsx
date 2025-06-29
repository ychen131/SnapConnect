/**
 * @file StoryViewerScreen.tsx
 * @description Full-screen story viewer scaffold for sequential playback.
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { getUserStories } from '../../services/storyService';
import { clearStoryNotification } from '../../services/realtimeService';
import VibeCheckSticker from '../../components/editor/VibeCheckSticker';

type StoryViewerRouteParams = {
  id?: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  usersWithStories: StoryViewerRouteParams[];
  userIndex: number;
  storyIndex?: number;
};

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  timer: number;
  created_at: string;
  // Vibe Check metadata
  vibe_check_summary?: string;
  vibe_check_confidence?: number;
  vibe_check_source_url?: string;
}

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, StoryViewerRouteParams>, string>>();
  const { userId, username, avatarUrl, usersWithStories, userIndex, storyIndex } =
    route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const [swipeY] = useState(new Animated.Value(0));

  // State for current user and stories
  const [currentUserIndex, setCurrentUserIndex] = useState(userIndex || 0);
  const [currentUser, setCurrentUser] = useState(
    usersWithStories
      ? usersWithStories[userIndex || 0]
      : { id: userId, userId, username, avatarUrl },
  );
  const [currentUserStories, setCurrentUserStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(storyIndex ?? 0);

  // Fetch stories for the current user
  useEffect(() => {
    async function fetchStoriesForUser() {
      setIsLoading(true);
      setError(null);
      try {
        const userIdToFetch = currentUser.id || currentUser.userId;
        if (!userIdToFetch) {
          throw new Error('No user ID available');
        }
        const userStories = await getUserStories(userIdToFetch, false);
        const sortedStories = userStories
          .slice()
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // Debug: Log stories with Vibe Check data
        const storiesWithVibeCheck = sortedStories.filter((s) => s.vibe_check_summary);
        if (storiesWithVibeCheck.length > 0) {
          console.log('🎯 Found stories with Vibe Check data:', storiesWithVibeCheck.length);
          storiesWithVibeCheck.forEach((s, i) => {
            console.log(`🎯 Story ${i + 1}:`, {
              id: s.id,
              summary: s.vibe_check_summary,
              confidence: s.vibe_check_confidence,
            });
          });
        }

        setCurrentUserStories(sortedStories);
        setCurrentStoryIndex(storyIndex ?? 0);
        // Clear story notifications for this user's stories
        userStories.forEach((story) => {
          clearStoryNotification(story.id);
        });
      } catch (err) {
        setError('Failed to load stories.');
        Alert.alert('Error', 'Failed to load stories.');
      } finally {
        setIsLoading(false);
      }
    }
    if (currentUser && (currentUser.id || currentUser.userId)) fetchStoriesForUser();
  }, [currentUser, storyIndex]);

  // Handle auto-advance for current user's stories
  useEffect(() => {
    if (!currentUserStories.length) return;
    const story = currentUserStories[currentStoryIndex];
    if (!story) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (story.media_type === 'photo') {
      timerRef.current = setTimeout(
        () => {
          handleNextStory();
        },
        (story.timer || 3) * 1000,
      );
    } else {
      timerRef.current = setTimeout(() => {
        handleNextStory();
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryIndex, currentUserStories]);

  function handleNextStory() {
    if (currentStoryIndex < currentUserStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Try to go to next user if available
      if (usersWithStories && currentUserIndex < usersWithStories.length - 1) {
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentUser(usersWithStories[currentUserIndex + 1]);
      } else {
        navigation.goBack();
      }
    }
  }

  function handlePrevStory() {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else {
      // Try to go to previous user if available
      if (usersWithStories && currentUserIndex > 0) {
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentUser(usersWithStories[currentUserIndex - 1]);
      } else {
        navigation.goBack();
      }
    }
  }

  // Progress bar rendering for current user's stories
  function renderProgressBars() {
    return (
      <View
        style={{
          flexDirection: 'row',
          position: 'absolute',
          top: 8,
          left: 0,
          right: 0,
          paddingHorizontal: 8,
          zIndex: 10,
        }}
      >
        {currentUserStories.map((s, idx) => (
          <View
            key={s.id}
            style={{
              flex: 1,
              height: 3,
              marginHorizontal: 2,
              backgroundColor:
                idx < currentStoryIndex ? '#FF8C69' : idx === currentStoryIndex ? '#fff' : '#555',
              opacity: idx === currentStoryIndex ? 1 : 0.5,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    );
  }

  // Tap areas for navigation
  function renderTapAreas() {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          flexDirection: 'row',
          zIndex: 20,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={handlePrevStory} />
        <Pressable style={{ flex: 1 }} onPress={handleNextStory} />
      </View>
    );
  }

  // PanResponder for swipe-to-close and horizontal swipe between users
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Respond to vertical or horizontal swipes
      const isVertical =
        Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      const isHorizontal =
        Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      return isVertical || (usersWithStories && usersWithStories.length > 1 && isHorizontal);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        swipeY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 80 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
        navigation.goBack();
      } else if (
        usersWithStories &&
        usersWithStories.length > 1 &&
        Math.abs(gestureState.dx) > 60 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      ) {
        if (gestureState.dx < 0 && currentUserIndex < usersWithStories.length - 1) {
          // Swipe left: next user
          setCurrentUserIndex(currentUserIndex + 1);
          setCurrentUser(usersWithStories[currentUserIndex + 1]);
        } else if (gestureState.dx > 0 && currentUserIndex > 0) {
          // Swipe right: previous user
          setCurrentUserIndex(currentUserIndex - 1);
          setCurrentUser(usersWithStories[currentUserIndex - 1]);
        }
        Animated.spring(swipeY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(swipeY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(swipeY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

  // Debug logging for Vibe Check data
  useEffect(() => {
    if (currentUserStories[currentStoryIndex]?.vibe_check_summary) {
      console.log('🎯 Story has Vibe Check data:', {
        summary: currentUserStories[currentStoryIndex].vibe_check_summary,
        confidence: currentUserStories[currentStoryIndex].vibe_check_confidence,
        sourceUrl: currentUserStories[currentStoryIndex].vibe_check_source_url,
      });
    }
  }, [currentStoryIndex, currentUserStories]);

  const story = currentUserStories[currentStoryIndex];

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: 'black',
        transform: [{ translateY: swipeY }],
        opacity: swipeY.interpolate({
          inputRange: [0, 120],
          outputRange: [1, 0.7],
          extrapolate: 'clamp',
        }),
      }}
      {...panResponder.panHandlers}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Progress bars */}
        {currentUserStories.length > 1 && renderProgressBars()}
        {/* Top bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            justifyContent: 'space-between',
            zIndex: 30,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Avatar */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FF8C69',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              {currentUser?.avatarUrl ? (
                <Image
                  source={{ uri: currentUser.avatarUrl }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Text
                  style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Nunito' }}
                >
                  {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : '?'}
                </Text>
              )}
            </View>
            <Text
              style={{ color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito' }}
            >
              {currentUser?.username || 'User'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Nunito' }}>✕</Text>
          </TouchableOpacity>
        </View>
        {/* Story content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF8C69" />
          ) : error ? (
            <Text style={{ color: '#ef4444', fontSize: 18, fontFamily: 'Nunito' }}>{error}</Text>
          ) : !story ? (
            <Text style={{ color: '#AAB0B7', fontSize: 18, fontFamily: 'Nunito' }}>
              No stories to show
            </Text>
          ) : story.media_type === 'photo' ? (
            <View style={{ position: 'relative', width: '90%', height: 400 }}>
              <Image
                source={{ uri: story.media_url }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                resizeMode="cover"
              />
              {/* Vibe Check Sticker - render if story has Vibe Check metadata */}
              {story.vibe_check_summary && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'box-none',
                  }}
                >
                  <VibeCheckSticker
                    summary={story.vibe_check_summary}
                    onLearnWhy={() => {
                      // TODO: Show Vibe Check report modal
                      Alert.alert('Vibe Check Report', 'Detailed report feature coming soon!', [
                        { text: 'OK' },
                      ]);
                    }}
                    initialPosition={{ x: 50, y: 100 }}
                    photoUri={story.media_url}
                    isSuccess={true}
                  />
                </View>
              )}
            </View>
          ) : (
            <Text style={{ color: 'white', fontSize: 18, fontFamily: 'Nunito' }}>
              [Video playback coming soon]
            </Text>
          )}
          {currentUserStories.length > 1 && renderTapAreas()}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}
