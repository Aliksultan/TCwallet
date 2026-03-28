// Mock Telegram Auth context for local development
// In production, replace with real Telegram.WebApp.initData validation

export const MOCK_USERS = {
  member: {
    id: 'user-member-001',
    telegram_id: '100000001',
    username: 'alikhan_m',
    display_name: 'Alikhan',
    role: 'MEMBER',
    language: 'ru',
  },
  organiser: {
    id: 'user-org-001',
    telegram_id: '100000002',
    username: 'sara_org',
    display_name: 'Sara (Organiser)',
    role: 'ORGANISER',
    language: 'kk',
  },
  manager: {
    id: 'user-mgr-001',
    telegram_id: '100000003',
    username: 'damir_mgr',
    display_name: 'Damir (Manager)',
    role: 'MANAGER',
    language: 'ru',
  },
  admin: {
    id: 'user-admin-001',
    telegram_id: '100000004',
    username: 'tulga_admin',
    display_name: 'Super Admin',
    role: 'SUPER_ADMIN',
    language: 'ru',
  },
}

export type MockRole = keyof typeof MOCK_USERS
