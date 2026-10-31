import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Small chunks stay below native Keychain item limits even with Unicode metadata.
// Publish the manifest last, so interrupted writes retain the previous session.
type Manifest = { generation: string; count: number };
const manifestKey = (key: string) => `${key}.secure-v1`;
const chunkKey = (key: string, manifest: Manifest, index: number) =>
  `${manifestKey(key)}.${manifest.generation}.${index}`;
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

async function readManifest(key: string): Promise<Manifest | null> {
  const raw = await SecureStore.getItemAsync(manifestKey(key));
  return raw ? JSON.parse(raw) : null;
}
async function removeChunks(key: string, manifest: Manifest | null) {
  if (!manifest) return;
  await Promise.all(Array.from({ length: manifest.count }, (_, i) =>
    SecureStore.deleteItemAsync(chunkKey(key, manifest, i))));
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const manifest = await readManifest(key);
    if (manifest) {
      const chunks = await Promise.all(Array.from({ length: manifest.count }, (_, i) =>
        SecureStore.getItemAsync(chunkKey(key, manifest, i))));
      if (chunks.some((chunk) => chunk === null)) throw new Error('저장된 로그인 정보를 읽을 수 없습니다.');
      await AsyncStorage.removeItem(key);
      return chunks.join('');
    }
    // Migrate existing installs without logging the user out or retaining a plaintext copy.
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) await secureSessionStorage.setItem(key, legacy);
    return legacy;
  },
  async setItem(key: string, value: string) {
    const previous = await readManifest(key);
    const characters = Array.from(value);
    const next: Manifest = {
      generation: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      count: Math.ceil(characters.length / 400),
    };
    try {
      for (let i = 0; i < next.count; i++) {
        await SecureStore.setItemAsync(chunkKey(key, next, i), characters.slice(i * 400, (i + 1) * 400).join(''), options);
      }
      await SecureStore.setItemAsync(manifestKey(key), JSON.stringify(next), options);
    } catch (error) {
      await removeChunks(key, next).catch(() => {});
      throw error;
    }
    await AsyncStorage.removeItem(key);
    await removeChunks(key, previous).catch(() => {});
  },
  async removeItem(key: string) {
    const manifest = await readManifest(key);
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(manifestKey(key));
    await removeChunks(key, manifest);
  },
};
