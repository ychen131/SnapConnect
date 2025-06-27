/**
 * @file App.tsx
 * @description Main entry point. Sets up Redux provider and RootNavigator.
 */
import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from './src/store';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <RootNavigator />
      </Provider>
    </GestureHandlerRootView>
  );
}
