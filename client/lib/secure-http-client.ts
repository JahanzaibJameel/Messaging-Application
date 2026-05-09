/**
 * Secure HTTP Client with Certificate Pinning
 * Provides MITM protection for API calls
 */

import { fetch as fetchWithPinning } from "react-native-ssl-pinning";

interface SecureHttpClientOptions {
  timeout?: number;
  retries?: number;
  enablePinning?: boolean;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class SecureHttpClient {
  private baseUrl: string;
  private defaultOptions: SecureHttpClientOptions;
  private authToken?: string;

  constructor(baseUrl: string, options: SecureHttpClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.defaultOptions = {
      timeout: 10000,
      retries: 3,
      enablePinning: true,
      ...options,
    };
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = undefined;
  }

  /**
   * Build request headers
   */
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "ChatApp/3.0.0",
      ...customHeaders,
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Make secure HTTP request with certificate pinning
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    customHeaders: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(customHeaders);

    const requestOptions: RequestInit = {
      headers,
      ...options,
    };

    try {
      let response;
      let status: number;

      if (this.defaultOptions.enablePinning) {
        // Use certificate pinning for sensitive requests
        response = await fetchWithPinning(url, {
          ...requestOptions,
          timeoutInterval: this.defaultOptions.timeout,
          sslPinning: {
            certs: ["sha256/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX="], // Replace with actual certificate hash
          },
        });
        status = (response as any).status || 200;
      } else {
        // Fallback to regular fetch for development/testing
        response = await fetch(url, {
          ...requestOptions,
          signal: AbortSignal.timeout(this.defaultOptions.timeout!),
        });
        status = response.status;
      }
      let data: T | undefined;
      let error: string | undefined;

      try {
        const responseText = await response.text();

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            // If not JSON, return as text
            data = responseText as any;
          }
        }
      } catch (parseError) {
        error = "Failed to parse response";
      }

      // Handle HTTP errors
      if (status >= 400) {
        error = data?.error || data?.message || `HTTP ${status}`;
      }

      return {
        data,
        error,
        status,
      };
    } catch (error) {
      // Handle network errors, certificate pinning failures, etc.
      const errorMessage = error instanceof Error ? error.message : "Network error";

      return {
        error: errorMessage,
        status: 0,
      };
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    retries: number = this.defaultOptions.retries!
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T>;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await requestFn();

        // If successful or client error (4xx), don't retry
        if (!result.error || (result.status >= 400 && result.status < 500)) {
          return result;
        }

        lastError = result;

        // Exponential backoff
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = {
          error: error instanceof Error ? error.message : "Request failed",
          status: 0,
        };
      }
    }

    return lastError!;
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, string>,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    let url = endpoint;

    if (params) {
      const searchParams = new URLSearchParams(params);
      url = `${endpoint}?${searchParams.toString()}`;
    }

    return this.retryRequest(() => this.makeRequest<T>(url, { method: "GET" }, customHeaders));
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(() =>
      this.makeRequest<T>(
        endpoint,
        {
          method: "POST",
          body: data ? JSON.stringify(data) : undefined,
        },
        customHeaders
      )
    );
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(() =>
      this.makeRequest<T>(
        endpoint,
        {
          method: "PUT",
          body: data ? JSON.stringify(data) : undefined,
        },
        customHeaders
      )
    );
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(() =>
      this.makeRequest<T>(endpoint, { method: "DELETE" }, customHeaders)
    );
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.retryRequest(() =>
      this.makeRequest<T>(
        endpoint,
        {
          method: "PATCH",
          body: data ? JSON.stringify(data) : undefined,
        },
        customHeaders
      )
    );
  }

  /**
   * Upload file with progress tracking
   */
  async upload<T = any>(
    endpoint: string,
    file: any,
    onProgress?: (progress: number) => void,
    customHeaders?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    const headers = {
      ...this.buildHeaders(customHeaders),
      "Content-Type": "multipart/form-data",
    };

    return this.retryRequest(() =>
      this.makeRequest<T>(
        endpoint,
        {
          method: "POST",
          body: formData,
        },
        headers
      )
    );
  }
}

// Create singleton instance for the app
export const secureHttpClient = new SecureHttpClient(
  process.env.EXPO_PUBLIC_API_URL || "https://api.chatapp.com",
  {
    enablePinning: __DEV__ ? false : true, // Disable pinning in development
    timeout: 15000,
    retries: 3,
  }
);

// Export class for creating custom instances
export { SecureHttpClient };
