/**
 * @file App.tsx
 * @description Main entry point. Sets up Redux provider and RootNavigator.
 */
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store';
import './global.css';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
