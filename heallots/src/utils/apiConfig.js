// Configuration for API base URL
// This file helps manage the API endpoint across different environments

const API_CONFIG = {
  development: 'http://localhost:8080',
  production: process.env.REACT_APP_API_URL || 'https://your-backend-url.onrender.com',
  staging: process.env.REACT_APP_API_URL || 'https://your-staging-url.onrender.com',
};

// Get the current environment
const getEnvironment = () => {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.REACT_APP_ENV === 'staging') return 'staging';
  return 'development';
};

// Export the API base URL
export const API_BASE_URL = 
  process.env.REACT_APP_API_URL || 
  API_CONFIG[getEnvironment()] || 
  API_CONFIG.development;

export default API_BASE_URL;
