/**
 * @file authService.ts
 * @description Service functions for Supabase authentication (sign up, login, logout).
 */
import { supabase } from './supabase';

/**
 * Signs up a new user with email and password.
 * @param email User's email
 * @param password User's password
 */
export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

/**
 * Logs in a user with email and password.
 * @param email User's email
 * @param password User's password
 */
export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Logs out the current user.
 */
export async function signOut() {
  return supabase.auth.signOut();
}
