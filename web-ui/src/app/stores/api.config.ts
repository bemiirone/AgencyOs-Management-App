export const API_CONFIG_STORE = {
  baseUrl: '/api',
  timeout: 30000,
  retryAttempts: 3,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/profile',
      refresh: '/auth/refresh',
    },
    projects: {
      list: '/projects',
      detail: '/projects',
      create: '/projects',
      update: '/projects',
      delete: '/projects',
    },
    tasks: {
      list: '/tasks',
      create: '/tasks',
      update: '/tasks',
      delete: '/tasks',
    },
    timeEntries: {
      list: '/time-entries',
      create: '/time-entries',
      update: '/time-entries',
      delete: '/time-entries',
    },
    invoices: {
      list: '/invoices',
      create: '/invoices',
      update: '/invoices',
      delete: '/invoices',
    },
    users: {
      list: '/users',
      create: '/users',
      update: '/users',
      delete: '/users',
    },
  },
};
