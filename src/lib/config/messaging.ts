/**
 * Configuration for the messaging feature
 */
const config = {
  // API URLs
  // apiBaseUrl: "https://messaging-a1v0.onrender.com/api",
  apiBaseUrl: "http://localhost:5000/api",
  socketUrl: "https://messaging-a1v0.onrender.com/api",

  // Authorization
  tokenCookieName: "token",
  refreshTokenCookieName: "refresh_token",

  // Socket configuration
  socketOptions: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"],
  },

  // File upload configuration
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      "image/*",
      "audio/*",
      "video/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
    maxFiles: 5,
  },
};

export default config;
