/**
 * @file Avatar.tsx
 * @description Reusable avatar component that displays user images or fallback initials
 */
import React from 'react';
import { View, Text, Image, ImageStyle } from 'react-native';

/**
 * Props for the Avatar component
 */
interface AvatarProps {
  /** URL of the avatar image */
  avatarUrl?: string | null;
  /** Username for fallback initials */
  username: string;
  /** Size of the avatar (width and height) */
  size?: number;
  /** Border color for the avatar */
  borderColor?: string;
  /** Border width */
  borderWidth?: number;
  /** Background color for fallback */
  backgroundColor?: string;
  /** Text color for fallback initials */
  textColor?: string;
  /** Additional styles for the image */
  imageStyle?: ImageStyle;
  /** Additional styles for the container */
  containerStyle?: any;
}

/**
 * Reusable avatar component that displays user images or fallback initials
 */
export default function Avatar({
  avatarUrl,
  username,
  size = 48,
  borderColor = '#E5E7EB',
  borderWidth = 0,
  backgroundColor = '#3B82F6',
  textColor = '#FFFFFF',
  imageStyle,
  containerStyle,
}: AvatarProps) {
  const getInitials = () => {
    if (!username || username.length === 0) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const containerStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor,
    backgroundColor,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...containerStyle,
  };

  const textStyles = {
    fontSize: size * 0.4,
    fontWeight: 'bold' as const,
    color: textColor,
  };

  const imageStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...imageStyle,
  };

  return (
    <View style={containerStyles}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={imageStyles}
          defaultSource={require('../../../assets/icon.png')} // Fallback to app icon
        />
      ) : (
        <Text style={textStyles}>{getInitials()}</Text>
      )}
    </View>
  );
}
