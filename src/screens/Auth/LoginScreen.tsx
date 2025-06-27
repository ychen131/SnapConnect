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
 * Displays a simple login form with navigation to signup.
 */
export default function LoginScreen({ navigation }: { navigation: any }) {
  // TODO: Remove this once we have a real login screen
  const [email, setEmail] = useState('demo-savor-1x@icloud.com');
  const [password, setPassword] = useState('test123');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

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
    <View className="flex-1 items-center justify-center bg-gray-50 px-6">
      <Card className="w-full max-w-xs rounded-lg bg-white p-6 shadow-sm">
        <Text className="mb-4 text-center text-2xl font-bold text-purple-600">
          Welcome to SnapDog
        </Text>
        <Text className="mb-6 text-center text-base text-gray-600">Sign in to your account</Text>
        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Button
          label="Sign In"
          variant="primary"
          className="mb-4"
          onPress={handleSignIn}
          disabled={isLoading}
        />
        <Button
          label="Create Account"
          variant="text"
          onPress={() => navigation.navigate('Signup')}
          disabled={isLoading}
        />
        {!!message && (
          <Text className="mt-4 max-w-xs text-center text-xs text-red-500">{message}</Text>
        )}
      </Card>
    </View>
  );
}
