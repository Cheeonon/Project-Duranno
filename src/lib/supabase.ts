import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Set them in .env.',
  );
}

// Expo Router's web output pre-renders routes in a Node.js SSR pass, which has
// no `window`/`WebSocket` globals. This app never uses realtime subscriptions,
// so a no-op transport avoids RealtimeClient throwing during that SSR pass.
class NoopSocket {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage's web shim touches `window` unconditionally, which crashes
    // under SSR. On web, omitting `storage` lets supabase-js fall back to its
    // own SSR-safe storage (browser localStorage when available, in-memory otherwise).
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    transport: typeof WebSocket === 'undefined' ? (NoopSocket as unknown as typeof WebSocket) : undefined,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
