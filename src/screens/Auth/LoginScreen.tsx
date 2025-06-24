/**
 * @file LoginScreen.tsx
 * @description Login/signup form for Supabase Auth, dispatches user to Redux on success. Dark mode support is present but toggle button is removed for now.
 */
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { signIn, signUp } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

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
      <Card className="dark:bg-surface-dark w-full max-w-xs">
        <Text className="font-heading text-brand mb-md dark:text-accent text-center text-2xl">
          Welcome to SnapConnect
        </Text>
        <Text className="text-muted mb-lg dark:text-muted-dark text-center text-base">
          Sign in or create an account
        </Text>
        <Input
          className="mb-sm"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          className="mb-md"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button
          label="Sign In"
          variant="primary"
          className="mb-sm"
          onPress={handleSignIn}
          disabled={isLoading}
        />
        <Button label="Sign Up" variant="accent" onPress={handleSignUp} disabled={isLoading} />
        {!!message && (
          <Text className="mt-md text-error dark:text-success max-w-xs text-center text-xs">
            {message}
          </Text>
        )}
      </Card>
    </View>
  );
}
