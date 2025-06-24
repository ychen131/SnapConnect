/**
 * @file SignupScreen.tsx
 * @description Complete signup form with email, password, username, and date of birth validation.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/authSlice';
import { signUp } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

/**
 * Validates if a username is valid (alphanumeric, 3-20 characters)
 */
function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

/**
 * Validates if user is at least 13 years old
 */
function isValidAge(dateOfBirth: string): boolean {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 13;
  }
  return age >= 13;
}

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength (minimum 8 characters, at least one letter and one number)
 */
function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Displays a complete signup form with validation for SnapConnect.
 */
export default function SignupScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useDispatch();

  /**
   * Validates all form fields and returns true if valid
   */
  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (!isValidUsername(username)) {
      newErrors.username =
        'Username must be 3-20 characters, letters, numbers, and underscores only';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Password must be at least 8 characters with letters and numbers';
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Date of birth validation
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else if (!isValidAge(dateOfBirth)) {
      newErrors.dateOfBirth = 'You must be at least 13 years old to use SnapConnect';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /**
   * Handles the signup process with validation
   */
  async function handleSignUp() {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await signUp(email, password);

      if (error) {
        Alert.alert('Signup Error', error.message);
      } else if (data?.user) {
        // TODO: Save additional user data (username, DOB) to user profile
        dispatch(
          setUser({
            id: data.user.id,
            email: data.user.email ?? '',
            username: username,
            dateOfBirth: dateOfBirth,
          }),
        );
        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="min-h-screen items-center justify-center px-6 py-8">
        <Card className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
          <Text className="mb-4 text-center text-2xl font-bold text-purple-600">
            Create Account
          </Text>
          <Text className="mb-6 text-center text-base text-gray-600">Join SnapConnect today</Text>

          <Input
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
          />

          <Input
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
            error={errors.username}
          />

          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          <Input
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          <Input
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            error={errors.dateOfBirth}
          />

          <Button
            label="Create Account"
            variant="primary"
            className="mb-4"
            onPress={handleSignUp}
            disabled={isLoading}
          />

          <Button
            label="Already have an account? Sign In"
            variant="text"
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          />
        </Card>
      </View>
    </ScrollView>
  );
}
