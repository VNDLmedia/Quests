// ═══════════════════════════════════════════════════════════════════════════
// ETHERNAL PATHS - Supabase Configuration
// ═══════════════════════════════════════════════════════════════════════════
//
// Authentication & Database Configuration
// 
// The anon key below is safe to include in client-side code - it's a public key
// that only allows operations permitted by Row Level Security (RLS) policies.
// 
// To use your own Supabase project:
// 1. Create a project at https://supabase.com
// 2. Replace SUPABASE_URL with your project URL (Settings → API → Project URL)
// 3. Replace SUPABASE_ANON_KEY with your anon/public key (Settings → API → anon key)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase Project Credentials
const SUPABASE_URL = 'https://jxccwiownwbijszepdlu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Y2N3aW93bndiaWpzemVwZGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NTc3MTcsImV4cCI6MjA4NDQzMzcxN30.QD8yehRhBjkoeASz2bUxYL6LMA2D94RV6OccWa1h41w';

// Create Supabase client with AsyncStorage for persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper: Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL.length > 0 && 
         SUPABASE_ANON_KEY.length > 0 &&
         !SUPABASE_URL.includes('YOUR_PROJECT');
};

// Helper: Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper: Get current session
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper: Sign up with email and password
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

// Helper: Sign in with email and password
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

// Helper: Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper: Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

export default supabase;

