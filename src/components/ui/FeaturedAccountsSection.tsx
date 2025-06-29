/**
 * @file FeaturedAccountsSection.tsx
 * @description Discovery section: 2-column grid of featured accounts (pups) with subtle/touch-activated scrollbar, styled per design reference.
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectFeaturedAccountsWithStories,
  selectFeaturedAccountsLoading,
  selectFeaturedAccountsError,
  fetchFeaturedAccountsWithStories,
} from '../../store/featuredAccountSlice';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_MARGIN) / 2; // 32 for px-4, 8 for gap
const CARD_IMAGE_HEIGHT = 160;
const CARD_MIN_HEIGHT = 220;

/**
 * Card for a single featured pup in the Discovery grid.
 * @param {object} props
 * @param {string} props.name - Pup's display name
 * @param {string} props.avatarUrl - Pup's avatar image URL
 * @param {string} props.imageUrl - Main story image URL
 * @param {string} props.bio - Pup's short summary/description
 * @param {string} props.vibeCheck - Vibe Check summary
 * @param {() => void} props.onPress - Card press handler
 */
function FeaturedPupCard({
  name,
  avatarUrl,
  imageUrl,
  bio,
  vibeCheck,
  onPress,
}: {
  name: string;
  avatarUrl: string | null;
  imageUrl: string | null;
  bio?: string | null;
  vibeCheck: string | null;
  onPress: () => void;
}) {
  // Debug: Log bio and summary for each card
  React.useEffect(() => {
    console.log(`[DiscoveryCard] ${name} bio:`, bio);
  }, [name, bio]);

  // Pick a color for avatar background based on first letter
  const colorMap: Record<string, string> = {
    P: '#26C6DA',
    C: '#FF8C69',
    R: '#D05A5A',
    L: '#4A90E2',
  };
  const initial = name?.[0]?.toUpperCase() || 'P';
  const bgColor = colorMap[initial] || '#FFDBC5';

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        margin: CARD_MARGIN / 2,
        maxWidth: CARD_WIDTH,
        minWidth: CARD_WIDTH,
        minHeight: CARD_MIN_HEIGHT,
        backgroundColor: 'white',
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: CARD_IMAGE_HEIGHT, resizeMode: 'cover' }}
        />
      ) : (
        <View style={{ width: '100%', height: CARD_IMAGE_HEIGHT, backgroundColor: '#eee' }} />
      )}
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 24, height: 24, borderRadius: 12 }}
            />
          ) : (
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgColor,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: 'white' }}>{initial}</Text>
            </View>
          )}
          <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#2D2D2D' }} numberOfLines={1}>
            {name}
          </Text>
        </View>
        {bio ? (
          <Text
            style={{
              fontSize: 13,
              color: '#222',
              marginTop: 8,
              marginBottom: vibeCheck ? 2 : 0,
              fontWeight: '500',
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {bio}
          </Text>
        ) : null}
        {vibeCheck ? (
          <Text
            style={{
              fontSize: 12,
              color: '#666',
              marginTop: 0,
              lineHeight: 16,
              fontStyle: 'italic',
            }}
            numberOfLines={2}
          >
            Vibe Check: {vibeCheck}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Discovery section: 2-column grid of featured pups with subtle/touch-activated scrollbar.
 */
export default function FeaturedAccountsSection({
  onCardPress,
}: {
  onCardPress?: (userId: string) => void;
}) {
  const dispatch = useDispatch();
  const featuredAccounts = useSelector(selectFeaturedAccountsWithStories);
  const isLoading = useSelector(selectFeaturedAccountsLoading);
  const error = useSelector(selectFeaturedAccountsError);

  React.useEffect(() => {
    if (!featuredAccounts.length) (dispatch as any)(fetchFeaturedAccountsWithStories());
  }, [dispatch]);

  // 2-column grid layout
  const renderItem = ({ item }: any) => (
    <FeaturedPupCard
      name={item.username}
      avatarUrl={item.avatar_url}
      imageUrl={item.latest_story_image_url || item.avatar_url || null}
      bio={item.bio || item.summary || null}
      vibeCheck={item.vibe_check_summary || null}
      onPress={() => onCardPress?.(item.user_id)}
    />
  );

  const numColumns = 2;
  const data = featuredAccounts.map((acc) => ({
    ...acc,
    latest_story_image_url: (acc as any).latest_story_image_url || acc.avatar_url || null,
    vibe_check_summary: (acc as any).vibe_check_summary || null,
    bio: (acc as any).bio || (acc as any).summary || null,
  }));

  if (isLoading) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF8C69" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#D05A5A', textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }
  if (!data.length) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#AAB0B7', textAlign: 'center' }}>No featured pups yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.user_id}
      numColumns={numColumns}
      horizontal={false}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{
        paddingBottom: 24,
        paddingTop: 4,
        paddingHorizontal: 0,
        marginHorizontal: -CARD_MARGIN / 2,
        overflow: 'hidden',
      }}
      columnWrapperStyle={{ gap: CARD_MARGIN }}
      style={{ flex: 1, overflow: 'hidden' }}
      indicatorStyle="black"
    />
  );
}
