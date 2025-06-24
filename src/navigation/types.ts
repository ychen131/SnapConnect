/**
 * @file types.ts
 * @description Navigation param types for RootStack and MainTab navigators.
 */
import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Params for the main app tab navigator.
 */
export type MainTabParamList = {
  Camera: undefined;
  Chat: undefined;
  Stories: undefined;
  Profile: undefined;
};

/**
 * Params for the root stack navigator.
 */
export type RootStackParamList = {
  Auth: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};
