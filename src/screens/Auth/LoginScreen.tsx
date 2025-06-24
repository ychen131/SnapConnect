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
    <View className="bg-background px-lg flex-1 items-center justify-center">
      <View className="bg-surface p-lg w-full max-w-xs rounded-xl shadow">
        <Text className="font-heading text-brand mb-md text-center text-2xl">
          Welcome to SnapConnect
        </Text>
        <Text className="text-muted mb-lg text-center text-base">Sign in or create an account</Text>
        <TextInput
          className="mb-sm border-brand px-md py-sm w-full rounded border bg-white text-base"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="mb-md border-brand px-md py-sm w-full rounded border bg-white text-base"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable
          className="bg-brand px-md py-sm mb-sm w-full items-center rounded"
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text className="font-heading text-base text-white">Sign In</Text>
        </Pressable>
        <Pressable
          className="bg-accent px-md py-sm w-full items-center rounded"
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text className="font-heading text-base text-white">Sign Up</Text>
        </Pressable>
        {!!message && (
          <Text className="mt-md text-error max-w-xs text-center text-xs">{message}</Text>
        )}
      </View>
    </View>
  );
}
