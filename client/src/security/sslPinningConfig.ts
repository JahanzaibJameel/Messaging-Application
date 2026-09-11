/**
 * SSL Pinning Configuration
 * Defines certificate pinning settings for secure network communication
 */

// Environment detection
const isDevelopment = __DEV__;
const isProduction = !isDevelopment;

// Backend domains from environment
const BACKEND_DOMAIN = process.env.EXPO_PUBLIC_BACKEND_DOMAIN || "api.chatapp.com";
const BACKEND_WS_DOMAIN = process.env.EXPO_PUBLIC_BACKEND_WS_DOMAIN || "ws.chatapp.com";

// SSL certificate pinning hashes
// In production, these MUST be provided via environment variables or config file
// If no hashes are provided in production, an error will be thrown during configuration validation
const PROD_CERT_HASHES: string[] = process.env.EXPO_PUBLIC_CERT_HASHES
  ? process.env.EXPO_PUBLIC_CERT_HASHES.split(",")
  : [];

/**
 * SSL Pinning configuration interface
 */
export interface SSLPinningConfig {
  domain: string;
  wsDomain: string;
  enabled: boolean;
  certificateHashes: string[];
  allowInsecureConnections: boolean;
  timeout: number;
}

/**
 * Get SSL pinning configuration for the current environment
 */
export const getSSLPinningConfig = (): SSLPinningConfig => {
  if (isDevelopment) {
    return {
      domain: "localhost:8080",
      wsDomain: "localhost:8080",
      enabled: false, // Disable pinning in development
      certificateHashes: [],
      allowInsecureConnections: true, // Allow HTTP in development
      timeout: 10000,
    };
  }

  if (isProduction && PROD_CERT_HASHES.length === 0) {
    throw new Error(
      "SSL certificate pinning hashes not configured. Set EXPO_PUBLIC_CERT_HASHES environment variable in production."
    );
  }

  return {
    domain: BACKEND_DOMAIN,
    wsDomain: BACKEND_WS_DOMAIN,
    enabled: isProduction,
    certificateHashes: PROD_CERT_HASHES,
    allowInsecureConnections: false, // Force HTTPS in production
    timeout: 15000,
  };
};

/**
 * Validate if SSL pinning is properly configured
 */
export const validateSSLPinningConfig = (): boolean => {
  const config = getSSLPinningConfig();

  // In production, ensure pinning is enabled and has certificate hashes
  if (isProduction) {
    if (!config.enabled) {
      console.error("SSL pinning must be enabled in production");
      return false;
    }

    if (config.certificateHashes.length === 0) {
      console.error("Production SSL pinning must use real certificate hashes");
      return false;
    }

    if (config.allowInsecureConnections) {
      console.error("Insecure connections not allowed in production");
      return false;
    }
  }

  return true;
};

/**
 * Get certificate hash for a specific domain
 */
export const getCertificateHashForDomain = (domain: string): string[] => {
  const config = getSSLPinningConfig();

  if (domain.includes(config.domain) || domain === config.domain) {
    return config.certificateHashes;
  }

  // Return empty array for unknown domains
  return [];
};

/**
 * Check if a domain should use SSL pinning
 */
export const shouldUseSSLPinning = (domain: string): boolean => {
  const config = getSSLPinningConfig();

  if (!config.enabled) {
    return false;
  }

  return (
    domain.includes(config.domain) ||
    domain.includes(config.wsDomain) ||
    domain === config.domain ||
    domain === config.wsDomain
  );
};

/**
 * Get secure URL for HTTP requests
 */
export const getSecureUrl = (path: string, useWebSocket = false): string => {
  const config = getSSLPinningConfig();
  const domain = useWebSocket ? config.wsDomain : config.domain;
  const protocol = useWebSocket ? "wss://" : "https://";

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${protocol}${domain}${cleanPath}`;
};

/**
 * Configuration for different environments
 */
export const SSL_CONFIG = {
  development: {
    enabled: false,
    allowInsecureConnections: true,
    certificateHashes: [] as string[],
    timeout: 10000,
  },
  staging: {
    enabled: true,
    allowInsecureConnections: false,
    certificateHashes: PROD_CERT_HASHES,
    timeout: 12000,
  },
  production: {
    enabled: true,
    allowInsecureConnections: false,
    certificateHashes: PROD_CERT_HASHES,
    timeout: 15000,
  },
};

/**
 * Get configuration for specific environment
 */
export const getSSLPinningConfigForEnv = (
  env: "development" | "staging" | "production"
): SSLPinningConfig => {
  const envConfig = SSL_CONFIG[env];

  return {
    domain: env === "development" ? "localhost:8080" : BACKEND_DOMAIN,
    wsDomain: env === "development" ? "localhost:8080" : BACKEND_WS_DOMAIN,
    enabled: envConfig.enabled,
    certificateHashes: envConfig.certificateHashes,
    allowInsecureConnections: envConfig.allowInsecureConnections,
    timeout: envConfig.timeout,
  };
};

export default {
  getSSLPinningConfig,
  validateSSLPinningConfig,
  getCertificateHashForDomain,
  shouldUseSSLPinning,
  getSecureUrl,
  getSSLPinningConfigForEnv,
  SSL_CONFIG,
};
