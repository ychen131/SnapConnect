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
