export type AuthUser = {
  id: string;
  firstName: string;
  fullName: string;
  role: string;
  loginId: string;
  password: string;
};

export const DEMO_AUTH_USERS: AuthUser[] = [
  {
    id: 'user-1',
    loginId: 'minsu',
    password: 'demo1234',
    firstName: '민수',
    fullName: '김민수',
    role: '집사',
  },
  {
    id: 'user-2',
    loginId: 'euhye',
    password: 'demo1234',
    firstName: '은혜',
    fullName: '이은혜',
    role: '권사',
  },
];

const LOGIN_ID_ALIASES: Record<string, string> = {
  eunhye: 'euhye',
};

export function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

export function resolveLoginId(loginId: string) {
  const normalizedId = normalizeLoginId(loginId);

  if (DEMO_AUTH_USERS.some((user) => user.loginId.toLowerCase() === normalizedId)) {
    return normalizedId;
  }

  return LOGIN_ID_ALIASES[normalizedId] ?? normalizedId;
}

export function findDemoUserByLoginId(loginId: string) {
  const resolvedId = resolveLoginId(loginId);

  return DEMO_AUTH_USERS.find((user) => user.loginId.toLowerCase() === resolvedId);
}

export function findDemoUser(loginId: string, password: string) {
  const user = findDemoUserByLoginId(loginId);

  if (!user || user.password !== password) {
    return undefined;
  }

  return user;
}
