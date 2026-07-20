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

const STAY_SIGNED_IN_KEY = 'duranno.auth.staySignedIn';

// Real persistent storage (AsyncStorage on native, localStorage on web). Reads
// `window` lazily inside each call rather than at module load, since Expo
// Router's web output pre-renders routes in a Node.js SSR pass where `window`
// doesn't exist yet.
const persistentStore = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

// Session-only fallback for when the user hasn't opted into "stay signed in" —
// keeps them signed in for the current run without ever touching disk/localStorage,
// so the session doesn't survive a reload or app restart.
const memoryStore = new Map<string, string>();

export async function getStaySignedInPreference() {
  return (await persistentStore.getItem(STAY_SIGNED_IN_KEY)) !== 'false';
}

export async function setStaySignedInPreference(staySignedIn: boolean) {
  await persistentStore.setItem(STAY_SIGNED_IN_KEY, staySignedIn ? 'true' : 'false');
}

// Supabase's own `persistSession` option is all-or-nothing at client creation,
// so "stay signed in" is implemented as a storage adapter that checks the
// preference on every read/write and routes the session token to persistent
// storage or the in-memory fallback accordingly.
const conditionalStorage = {
  async getItem(key: string) {
    if (await getStaySignedInPreference()) {
      return persistentStore.getItem(key);
    }
    return memoryStore.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    if (await getStaySignedInPreference()) {
      await persistentStore.setItem(key, value);
      return;
    }
    memoryStore.set(key, value);
  },
  async removeItem(key: string) {
    memoryStore.delete(key);
    await persistentStore.removeItem(key);
  },
};

// Expo Router's web output pre-renders routes in a Node.js SSR pass, which has
// no `window`/`WebSocket` globals. This app never uses realtime subscriptions,
// so a no-op transport avoids RealtimeClient throwing during that SSR pass.
class NoopSocket {}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: conditionalStorage,
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
