import AsyncStorage from '@react-native-async-storage/async-storage';

const STAY_LOGGED_IN_KEY = 'duranno.auth.stayLoggedIn';
const USER_ID_KEY = 'duranno.auth.userId';
const PASSWORD_KEY_PREFIX = 'duranno.auth.password.';

function passwordKey(userId: string) {
  return `${PASSWORD_KEY_PREFIX}${userId}`;
}

export async function getStayLoggedInPreference() {
  const value = await AsyncStorage.getItem(STAY_LOGGED_IN_KEY);
  return value !== 'false';
}

export async function saveAuthSession(userId: string, stayLoggedIn: boolean) {
  if (stayLoggedIn) {
    await AsyncStorage.multiSet([
      [STAY_LOGGED_IN_KEY, 'true'],
      [USER_ID_KEY, userId],
    ]);
    return;
  }

  await clearAuthSession();
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([STAY_LOGGED_IN_KEY, USER_ID_KEY]);
}

export async function loadPersistedUserId() {
  const [stayLoggedIn, userId] = await AsyncStorage.multiGet([STAY_LOGGED_IN_KEY, USER_ID_KEY]);

  if (stayLoggedIn[1] !== 'true' || !userId[1]) {
    return null;
  }

  return userId[1];
}

export async function loadUserPasswordOverride(userId: string) {
  return AsyncStorage.getItem(passwordKey(userId));
}

export async function saveUserPasswordOverride(userId: string, password: string) {
  await AsyncStorage.setItem(passwordKey(userId), password);
}
