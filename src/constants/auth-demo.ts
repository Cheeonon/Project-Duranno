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
    loginId: 'eunhye',
    password: 'demo1234',
    firstName: '은혜',
    fullName: '이은혜',
    role: '권사',
  },
];

export function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

export function findDemoUserByLoginId(loginId: string) {
  const normalizedId = normalizeLoginId(loginId);

  return DEMO_AUTH_USERS.find((user) => user.loginId.toLowerCase() === normalizedId);
}

export function findDemoUser(loginId: string, password: string) {
  const user = findDemoUserByLoginId(loginId);

  if (!user || user.password !== password) {
    return undefined;
  }

  return user;
}
