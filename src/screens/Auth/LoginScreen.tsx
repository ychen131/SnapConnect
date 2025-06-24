/**
 * @file LoginScreen.tsx
 * @description Login/signup form for Supabase Auth, dispatches user to Redux on success.
 */
import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { signIn, signUp } from '../../services/authService';

/**
 * Displays a simple login/signup form for testing Supabase Auth.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  async function handleSignUp() {
    setIsLoading(true);
    setMessage('');
    const { data, error } = await signUp(email, password);
    setIsLoading(false);
    if (error) {
      setMessage(`Sign up error: ${error.message}`);
    } else if (data?.user) {
      dispatch(setUser({ id: data.user.id, email: data.user.email ?? '' }));
      setMessage('Sign up successful! Check your email.');
    }
  }

  async function handleSignIn() {
    setIsLoading(true);
    setMessage('');
    const { data, error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setMessage(`Login error: ${error.message}`);
    } else if (data?.user) {
      dispatch(setUser({ id: data.user.id, email: data.user.email ?? '' }));
      setMessage('Login successful!');
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-4">
      <Text className="mb-4 text-xl font-bold">Login / Signup</Text>
      <TextInput
        className="mb-2 w-full max-w-xs rounded border px-3 py-2"
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mb-4 w-full max-w-xs rounded border px-3 py-2"
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        className="mb-2 w-full max-w-xs items-center rounded bg-blue-500 px-4 py-2"
        onPress={handleSignIn}
        disabled={isLoading}
      >
        <Text className="text-white">Sign In</Text>
      </Pressable>
      <Pressable
        className="w-full max-w-xs items-center rounded bg-gray-500 px-4 py-2"
        onPress={handleSignUp}
        disabled={isLoading}
      >
        <Text className="text-white">Sign Up</Text>
      </Pressable>
      {!!message && (
        <Text className="mt-4 max-w-xs text-center text-xs text-gray-600">{message}</Text>
      )}
    </View>
  );
}
