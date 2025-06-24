/**
 * @file auth.ts
 * @description Authentication service for Supabase auth operations.
 */

import type { User, Session } from '@supabase/supabase-js';

import { supabase } from '../api/supabase';

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email, password, and username
 */
export async function signUp({
  email,
  password,
  username,
}: SignUpData): Promise<{ user: User | null; error: any }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  return { user: data.user, error };
}

/**
 * Sign in an existing user
 */
export async function signIn({
  email,
  password,
}: SignInData): Promise<{ session: Session | null; error: any }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { session: data.session, error };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error: any }> {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: any }> {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
