/**
 * @file types.ts
 * @description Navigation type definitions for React Navigation.
 */

export type RootStackParamList = {
  // Auth s
  Login: undefined;
  Signup: undefined;

  // Main app s
  Main: undefined;
  Camera: undefined;
  Chat: undefined;
  Stories: undefined;
  Profile: undefined;

  // Modal s
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
