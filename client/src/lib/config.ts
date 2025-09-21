// Application Configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  },

  // JIRA Integration
  jira: {
    enabled: import.meta.env.VITE_JIRA_ENABLED === 'true',
    baseUrl: import.meta.env.VITE_JIRA_BASE_URL || '',
    projectKey: import.meta.env.VITE_JIRA_PROJECT_KEY || 'ITIL',
    cmdbProjectKey: import.meta.env.VITE_JIRA_CMDB_PROJECT_KEY || 'CMDB',
  },

  // UI Configuration
  ui: {
    theme: import.meta.env.VITE_DEFAULT_THEME || 'system',
    sidebarWidth: import.meta.env.VITE_SIDEBAR_WIDTH || '20rem',
    itemsPerPage: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '20'),
    autoRefreshInterval: parseInt(import.meta.env.VITE_AUTO_REFRESH_INTERVAL || '300000'), // 5 minutes
  },

  // Cache Configuration
  cache: {
    defaultStaleTime: parseInt(import.meta.env.VITE_CACHE_STALE_TIME || '300000'), // 5 minutes
    gcTime: parseInt(import.meta.env.VITE_CACHE_GC_TIME || '1800000'), // 30 minutes
  },

  // Feature Flags
  features: {
    enableJiraSync: import.meta.env.VITE_ENABLE_JIRA_SYNC === 'true',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableDarkMode: import.meta.env.VITE_ENABLE_DARK_MODE !== 'false', // default true
    enableExport: import.meta.env.VITE_ENABLE_EXPORT === 'true',
    enableAdvancedFilters: import.meta.env.VITE_ENABLE_ADVANCED_FILTERS === 'true',
  },

  // Development
  development: {
    enableDevTools: import.meta.env.DEV,
    showMockData: import.meta.env.VITE_SHOW_MOCK_DATA === 'true',
    enableDebugLogs: import.meta.env.VITE_DEBUG_LOGS === 'true',
  },

  // Application Info
  app: {
    name: import.meta.env.VITE_APP_NAME || 'JIRA ITIL Management',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Integrated IT Service Management',
    company: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
  },
} as const;

// Type-safe environment checker
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;

// Validation helper
export function validateConfig() {
  const errors: string[] = [];

  // Required configurations
  if (config.features.enableJiraSync && !config.jira.baseUrl) {
    errors.push('JIRA base URL is required when JIRA sync is enabled');
  }

  if (config.api.timeout < 1000) {
    errors.push('API timeout should be at least 1000ms');
  }

  if (config.ui.itemsPerPage < 1 || config.ui.itemsPerPage > 100) {
    errors.push('Items per page should be between 1 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Debug helper
export function logConfig() {
  if (config.development.enableDebugLogs) {
    console.group('🔧 Application Configuration');
    console.log('Environment:', import.meta.env.MODE);
    console.log('API Base URL:', config.api.baseUrl);
    console.log('Features:', config.features);
    console.log('JIRA Integration:', config.jira);
    console.groupEnd();
  }
}
