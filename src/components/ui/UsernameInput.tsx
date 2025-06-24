/**
 * @file UsernameInput.tsx
 * @description Specialized input component for username with real-time validation.
 */
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Input } from './Input';
import { useUsernameValidation } from '../../hooks/useUsernameValidation';

/**
 * Props for the UsernameInput component.
 */
export interface UsernameInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

/**
 * Username input component with real-time availability checking.
 */
export function UsernameInput({
  value,
  onChangeText,
  placeholder = 'Username',
  className = '',
  error: externalError,
}: UsernameInputProps) {
  const { isAvailable, isChecking, error: validationError } = useUsernameValidation(value);

  // Determine the error to show (external error takes precedence)
  const displayError = externalError || validationError;

  // Determine input styling based on validation state
  const getInputClassName = () => {
    let baseClass = `border px-4 py-3 w-full rounded-lg bg-white text-base ${className}`;

    if (displayError) {
      return `${baseClass} border-red-500`;
    }

    if (isAvailable === true && value.length >= 3) {
      return `${baseClass} border-green-500`;
    }

    if (isAvailable === false && value.length >= 3) {
      return `${baseClass} border-red-500`;
    }

    return `${baseClass} border-gray-300`;
  };

  return (
    <View className="mb-2 w-full">
      <View className="relative">
        <Input
          placeholder={placeholder}
          autoCapitalize="none"
          value={value}
          onChangeText={onChangeText}
          className={getInputClassName()}
        />

        {/* Validation indicator */}
        {isChecking && (
          <View className="absolute right-3 top-3">
            <ActivityIndicator size="small" color="#6b7280" />
          </View>
        )}

        {!isChecking && isAvailable === true && value.length >= 3 && (
          <View className="absolute right-3 top-3">
            <Text className="text-lg text-green-500">✓</Text>
          </View>
        )}

        {!isChecking && isAvailable === false && value.length >= 3 && (
          <View className="absolute right-3 top-3">
            <Text className="text-lg text-red-500">✗</Text>
          </View>
        )}
      </View>

      {/* Status messages */}
      {!displayError && isAvailable === true && value.length >= 3 && (
        <Text className="ml-1 mt-1 text-xs text-green-600">Username is available!</Text>
      )}

      {!displayError && isAvailable === false && value.length >= 3 && (
        <Text className="ml-1 mt-1 text-xs text-red-500">Username is already taken</Text>
      )}

      {displayError && <Text className="ml-1 mt-1 text-xs text-red-500">{displayError}</Text>}

      {/* Help text */}
      {value.length > 0 && value.length < 3 && (
        <Text className="ml-1 mt-1 text-xs text-gray-500">
          Username must be at least 3 characters
        </Text>
      )}
    </View>
  );
}

export default UsernameInput;
