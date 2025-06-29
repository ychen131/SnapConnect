/**
 * @file types.ts
 * @description Navigation param types for RootStack and MainTab navigators.
 */
import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Params for the camera stack navigator.
 */
export type CameraStackParamList = {
  CameraMain: undefined;
  SendTo: {
    contentUri: string;
    contentType: 'photo' | 'video';
    photoTimer?: number;
  };
};

/**
 * Params for the chat stack navigator.
 */
export type ChatStackParamList = {
  ChatList: undefined;
  IndividualChat: {
    conversationId: string;
    otherUserId: string;
    otherUsername: string;
  };
  SnapPhotoViewer: {
    messageId: string;
    photoUrl: string;
    timer: number;
    conversationId: string;
    userId: string;
  };
  SnapVideoViewer: {
    messageId: string;
    videoUrl: string;
    conversationId: string;
    userId: string;
  };
};

/**
 * Params for the profile stack navigator.
 */
export type ProfileStackParamList = {
  ProfileMain: { userId?: string };
  AddFriends: undefined;
  MyStories: undefined;
  StoryViewer: {
    userId: string;
    username?: string;
    avatarUrl?: string;
    usersWithStories: Array<{
      id: string;
      username: string;
      avatarUrl?: string;
      isOwn?: boolean;
      hasStory?: boolean;
    }>;
    userIndex: number;
  };
  Settings: undefined;
};

/**
 * Params for the stories stack navigator.
 */
export type StoriesStackParamList = {
  StoriesMain: undefined;
  StoryViewer: {
    userId: string;
    username?: string;
    avatarUrl?: string;
    usersWithStories: Array<{
      id: string;
      username: string;
      avatarUrl?: string;
      isOwn?: boolean;
      hasStory?: boolean;
    }>;
    userIndex: number;
  };
};

/**
 * Params for the main app tab navigator.
 */
export type MainTabParamList = {
  Stories: NavigatorScreenParams<StoriesStackParamList>;
  Camera: NavigatorScreenParams<CameraStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

/**
 * Params for the main app stack navigator (permissions + main).
 */
export type MainAppStackParamList = {
  Permissions: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

/**
 * Params for the auth stack navigator.
 */
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

/**
 * Params for the root stack navigator.
 */
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
