/**
 * Secure transport: HTTP via react-native-ssl-pinning (production) and WebSocket helpers.
 * Pinning is disabled in development via __DEV__ (plain fetch / WebSocket).
 */

import { fetch as sslFetch } from "react-native-ssl-pinning";
import { captureException, addUserActionBreadcrumb } from "../monitoring/sentry";
import { getSSLPinningConfig } from "./sslPinningConfig";

/** Replace with your server leaf/SPKI pin before shipping production. */
export const PLACEHOLDER_SSL_PINS = [
  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=",
];

export interface SecureRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  certificateHashes?: string[];
}

export interface SecureResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
}

export interface SecureWebSocketOptions {
  url: string;
  protocols?: string | string[];
  certificateHashes?: string[];
  timeout?: number;
}

async function readSslResponseBody(res: {
  data?: string;
  bodyString?: string;
  text?: () => Promise<string>;
}): Promise<string> {
  if (typeof res.data === "string" && res.data.length > 0) {
    return res.data;
  }
  if (typeof res.bodyString === "string") {
    return res.bodyString;
  }
  if (typeof res.text === "function") {
    return res.text();
  }
  return "";
}

function normalizeHeaders(h: Record<string, string> | undefined): Record<string, string> {
  if (!h) {
    return {};
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    out[k] = String(v);
  }
  return out;
}

/**
 * HTTP request with SSL pinning in release builds; standard fetch in development (__DEV__).
 */
export const secureFetch = async (options: SecureRequestOptions): Promise<SecureResponse> => {
  try {
    addUserActionBreadcrumb("secure_fetch_attempt", {
      url: options.url,
      method: options.method || "GET",
      hasBody: !!options.body,
    });

    const method = options.method || "GET";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    const timeoutMs = options.timeout ?? getSSLPinningConfig().timeout;

    if (__DEV__) {
      const res = await fetch(options.url, {
        method,
        headers,
        body: options.body,
      });
      const data = await res.text();
      const secureResponse: SecureResponse = {
        status: res.status,
        statusText: res.statusText || "",
        headers: normalizeHeaders(
          Object.fromEntries(res.headers.entries()) as Record<string, string>
        ),
        data,
      };
      addUserActionBreadcrumb("secure_fetch_success", {
        url: options.url,
        status: secureResponse.status,
        responseSize: secureResponse.data.length,
      });
      return secureResponse;
    }

    const certs =
      options.certificateHashes && options.certificateHashes.length > 0
        ? options.certificateHashes
        : PLACEHOLDER_SSL_PINS;

    const sslRes = await sslFetch(options.url, {
      method,
      headers,
      body: options.body,
      timeoutInterval: timeoutMs,
      sslPinning: { certs },
    } as Parameters<typeof sslFetch>[1]);

    const data = await readSslResponseBody(sslRes);
    const secureResponse: SecureResponse = {
      status: sslRes.status || 200,
      statusText: "OK",
      headers: normalizeHeaders(sslRes.headers as Record<string, string>),
      data,
    };

    addUserActionBreadcrumb("secure_fetch_success", {
      url: options.url,
      status: secureResponse.status,
      responseSize: secureResponse.data.length,
    });

    return secureResponse;
  } catch (error) {
    addUserActionBreadcrumb("secure_fetch_error", {
      url: options.url,
      error: (error as Error).message,
    });
    captureException(error as Error, {
      action: "secure_fetch",
      screen: "security_module",
      additionalData: {
        url: options.url,
        method: options.method || "GET",
      },
    });
    throw error;
  }
};

/**
 * Opens a WebSocket. Production builds require wss://; development allows ws:// (e.g. localhost).
 * (Pinning applies to HTTP via sslFetch; RN WebSocket uses the system stack.)
 */
export const createSecureWebSocket = (options: SecureWebSocketOptions): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    try {
      addUserActionBreadcrumb("secure_websocket_attempt", {
        url: options.url,
        protocols: options.protocols,
      });

      if (!__DEV__) {
        if (!options.url.startsWith("wss://")) {
          const err = new Error("WebSocket URL must use wss:// in production");
          captureException(err, {
            action: "secure_websocket",
            screen: "security_module",
            additionalData: { url: options.url },
          });
          reject(err);
          return;
        }
      }

      const config = getSSLPinningConfig();
      const timeoutMs = options.timeout ?? config.timeout;
      let ws: WebSocket;

      try {
        ws = new WebSocket(options.url, options.protocols);
        const timeoutId = setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, timeoutMs);

        ws.onopen = () => {
          clearTimeout(timeoutId);
          addUserActionBreadcrumb("secure_websocket_connected", { url: options.url });
          resolve(ws);
        };

        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          addUserActionBreadcrumb("secure_websocket_error", {
            url: options.url,
            error: String(error),
          });
          captureException(new Error("WebSocket connection failed"), {
            action: "secure_websocket",
            screen: "security_module",
            additionalData: { url: options.url },
          });
          reject(error);
        };

        ws.onclose = (event) => {
          clearTimeout(timeoutId);
          addUserActionBreadcrumb("secure_websocket_closed", {
            url: options.url,
            code: event.code,
            reason: event.reason,
          });
        };
      } catch (error) {
        captureException(error as Error, {
          action: "secure_websocket_creation",
          screen: "security_module",
          additionalData: { url: options.url },
        });
        reject(error);
      }
    } catch (error) {
      captureException(error as Error, {
        action: "secure_websocket_setup",
        screen: "security_module",
        additionalData: { url: options.url },
      });
      reject(error);
    }
  });
};

export const validateCertificate = async (domain: string): Promise<boolean> => {
  try {
    addUserActionBreadcrumb("certificate_validation_attempt", { domain });
    const testUrl = `https://${domain}/health`;
    await secureFetch({ url: testUrl, method: "GET", timeout: 5000 });
    addUserActionBreadcrumb("certificate_validation_success", { domain });
    return true;
  } catch (error) {
    addUserActionBreadcrumb("certificate_validation_failed", {
      domain,
      error: (error as Error).message,
    });
    return false;
  }
};

export const getSecureUrl = (baseUrl: string, path: string, useWebSocket = false): string => {
  const config = getSSLPinningConfig();
  const domain = useWebSocket ? config.wsDomain : config.domain;
  const protocol = useWebSocket ? "wss://" : "https://";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (!config.allowInsecureConnections) {
    return `${protocol}${domain}${cleanPath}`;
  }

  if (domain.includes("localhost") || domain.includes("127.0.0.1")) {
    const devProtocol = useWebSocket ? "ws://" : "http://";
    return `${devProtocol}${domain}${cleanPath}`;
  }

  return `${protocol}${domain}${cleanPath}`;
};

export const isSecureUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "wss:";
  } catch {
    return false;
  }
};

export const enforceSecureUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const config = getSSLPinningConfig();
    if (!config.allowInsecureConnections && parsedUrl.protocol === "http:") {
      parsedUrl.protocol = "https:";
      return parsedUrl.toString();
    }
    return url;
  } catch {
    return url;
  }
};

export default {
  secureFetch,
  createSecureWebSocket,
  validateCertificate,
  getSecureUrl,
  isSecureUrl,
  enforceSecureUrl,
};
