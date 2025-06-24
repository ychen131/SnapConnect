/**
 * @file types.ts
 * @description Navigation type definitions for React Navigation.
 */

export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Signup: undefined;

  // Main app screens
  Main: undefined;
  Camera: undefined;
  Chat: undefined;
  Stories: undefined;
  Profile: undefined;

  // Modal screens
  SendTo: {
    mediaUrl: string;
    mediaType: 'photo' | 'video';
    duration: number;
  };
  AddFriends: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Camera: undefined;
  Chat: undefined;
  Stories: undefined;
  Profile: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: {
    userId: string;
    username: string;
  };
  GroupChat: {
    groupId: string;
    groupName: string;
  };
};
