/**
 * @file useUsernameValidation.ts
 * @description Custom hook for real-time username validation with debouncing.
 */
import { useState, useEffect, useCallback } from 'react';
import { checkUsernameAvailability } from '../services/userService';

/**
 * Hook for real-time username validation
 * @param username The username to validate
 * @param debounceMs Debounce delay in milliseconds (default: 500ms)
 */
export function useUsernameValidation(username: string, debounceMs: number = 500) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setIsAvailable(null);
      setIsChecking(false);
      setError(null);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const available = await checkUsernameAvailability(usernameToCheck);
      setIsAvailable(available);
      if (!available) {
        setError('Username is already taken');
      }
    } catch (err) {
      setError('Error checking username availability');
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, debounceMs, validateUsername]);

  return {
    isAvailable,
    isChecking,
    error,
    validateUsername,
  };
}
