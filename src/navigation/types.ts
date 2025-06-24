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
};

/**
 * Params for the main app tab navigator.
 */
export type MainTabParamList = {
  Camera: NavigatorScreenParams<CameraStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Stories: undefined;
  Profile: undefined;
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
  MainApp: NavigatorScreenParams<MainAppStackParamList>;
};
