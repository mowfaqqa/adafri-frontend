/**
 * Configuration for the messaging feature
 */
const config = {
  // API URLs
  apiBaseUrl: process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:5000/api',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  
  // Authorization
  tokenCookieName: 'token',
  refreshTokenCookieName: 'refresh_token',
  
  // Socket configuration
  socketOptions: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket'],
  },
  
  // File upload configuration
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'image/*',
      'audio/*',
      'video/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    maxFiles: 5,
  },
};

export default config;