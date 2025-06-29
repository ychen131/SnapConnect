/**
 * @file LoginScreen.tsx
 * @description Login/signup form for Supabase Auth, dispatches user to Redux on success. Dark mode support is present but toggle button is removed for now.
 */
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { signIn, signUp } from '../../services/authService';
import { getUserProfile } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Eye, EyeOff } from 'lucide-react-native';

/**
 * Displays a simple login form with navigation to signup.
 */
export default function LoginScreen({ navigation }: { navigation: any }) {
  // TODO: Remove this once we have a real login screen
  const [email, setEmail] = useState('demo-savor-1x@icloud.com');
  const [password, setPassword] = useState('test123');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();

  async function handleSignIn() {
    setIsLoading(true);
    setMessage('');
    const { data, error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setMessage(`Login error: ${error.message}`);
    } else if (data?.user) {
      // Fetch full user profile from Supabase
      const { data: profile } = await getUserProfile(data.user.id);
      if (profile) {
        dispatch(setUser(profile));
      } else {
        dispatch(setUser({ id: data.user.id, email: data.user.email ?? '' }));
      }
      setMessage('Login successful!');
    }
  }

  return (
    <SafeAreaView className="h-full w-full flex-1 bg-[#FFE9DA]">
      <View className="h-full w-full flex-1 items-center justify-center">
        <View className="h-full w-full items-center justify-center p-8">
          <Image
            source={require('../../../assets/snapdog-logo.png')}
            style={{ width: 100, height: 100, marginBottom: 24 }}
            resizeMode="contain"
            accessible
            accessibilityLabel="SnapDog logo"
          />
          <Text className="mb-2 text-center font-heading text-3xl font-extrabold text-brand">
            SnapDog, Welcoms You!
          </Text>
          <Text className="mb-6 text-center font-heading text-base text-gray-400">
            Sign in to see what your furry friends are up to.
          </Text>
          <View className="mb-4 w-full">
            <Text className="mb-1 font-heading text-sm text-gray-700">Email Address</Text>
            <Input
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="rounded-xl bg-white shadow-sm"
            />
          </View>
          <View className="mb-2 w-full">
            <Text className="mb-1 font-heading text-sm text-gray-700">Password</Text>
            <View className="relative">
              <Input
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                className="rounded-xl bg-white pr-10 shadow-sm"
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 12, top: 14 }}
                onPress={() => setShowPassword((v) => !v)}
                accessible
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} color="#888" /> : <Eye size={20} color="#888" />}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity className="mb-6 self-end" onPress={() => {}}>
            <Text className="font-heading text-xs text-brand">Forgot Password?</Text>
          </TouchableOpacity>
          <Button
            label={isLoading ? 'Signing In...' : 'Sign In'}
            variant="primary"
            className="mb-4 w-full rounded-xl text-base"
            onPress={handleSignIn}
            disabled={isLoading}
          />
          {!!message && (
            <View
              className={`mt-2 w-full max-w-xs rounded px-3 py-2 bg-${message.includes('error') ? 'red-100' : 'green-100'} border border-${message.includes('error') ? 'red-300' : 'green-300'}`}
            >
              <Text
                className={`text-center font-heading text-xs ${message.includes('error') ? 'text-red-700' : 'text-green-700'}`}
              >
                {message}
              </Text>
            </View>
          )}
          <Text className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Text
              className="font-semibold text-brand"
              onPress={() => navigation.navigate('Signup')}
            >
              Create one!
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
