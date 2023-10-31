/**
 * @fileoverview This file contains the configuration for the application.
 * @package ymts-connector
 */

/**
 * Configuration for the application
 */
const Config = {
  APP: {
    PORT: process.env.PORT || 5000,
    HOST: process.env.HOST || "http://localhost",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost",
    LOGIN_URL: process.env.LOGIN_URL || "http://localhost:3000/login",
    PRODUCTION: process.env.NODE_ENV === "production",
    MAX_ATTACHMENTS_UPLOAD_LIMIT: process.env.MAX_ATTACHMENT_UPLOAD_LIMIT
      ? parseInt(process.env.MAX_ATTACHMENT_UPLOAD_LIMIT)
      : 5,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE
      ? parseInt(process.env.MAX_FILE_SIZE)
      : 100, // in mbs
  },
  DB: {
    URL: process.env.DB_URL || "mongodb://localhost:27017/ymts-connector",
  },
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET || "ymts-connector",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
    JWT_ISSUER: process.env.JWT_ISSUER || "ymts-connector",
    SALT_ROUNDS: process.env.SALT_ROUNDS || 10, // the more the salt rounds the more the time it takes to hash the password
  },
};

export default Config;
