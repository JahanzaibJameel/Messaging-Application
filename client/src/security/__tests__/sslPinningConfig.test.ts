const originalEnv = process.env;
const originalDev = (global as any).__DEV__;

function loadModule(development: boolean, certificateHashes?: string) {
  jest.resetModules();
  (global as any).__DEV__ = development;
  process.env = { ...originalEnv };
  process.env.EXPO_PUBLIC_BACKEND_DOMAIN = "api.chatapp.com";
  process.env.EXPO_PUBLIC_BACKEND_WS_DOMAIN = "ws.chatapp.com";
  if (certificateHashes === undefined) {
    delete process.env.EXPO_PUBLIC_CERT_HASHES;
  } else {
    process.env.EXPO_PUBLIC_CERT_HASHES = certificateHashes;
  }

  return require("../sslPinningConfig");
}

describe("SSLPinningConfig", () => {
  afterEach(() => {
    process.env = originalEnv;
    (global as any).__DEV__ = originalDev;
    jest.resetModules();
  });

  describe("development configuration", () => {
    it("returns insecure localhost configuration", () => {
      const mod = loadModule(true);
      expect(mod.getSSLPinningConfig()).toEqual({
        domain: "localhost:8080",
        wsDomain: "localhost:8080",
        enabled: false,
        certificateHashes: [],
        allowInsecureConnections: true,
        timeout: 10000,
      });
      expect(mod.validateSSLPinningConfig()).toBe(true);
      expect(mod.shouldUseSSLPinning("localhost:8080")).toBe(false);
      expect(mod.getCertificateHashForDomain("localhost:8080")).toEqual([]);
      expect(mod.getSecureUrl("/messages")).toBe("https://localhost:8080/messages");
      expect(mod.getSecureUrl("messages", true)).toBe("wss://localhost:8080/messages");
    });
  });

  describe("production configuration", () => {
    it("throws when certificate hashes are missing", () => {
      const mod = loadModule(false);
      expect(() => mod.getSSLPinningConfig()).toThrow(
        "SSL certificate pinning hashes not configured. Set EXPO_PUBLIC_CERT_HASHES environment variable in production."
      );
      expect(() => mod.validateSSLPinningConfig()).toThrow(
        "SSL certificate pinning hashes not configured. Set EXPO_PUBLIC_CERT_HASHES environment variable in production."
      );
    });

    it("returns secure backend configuration and validates it", () => {
      const mod = loadModule(false, "hash-one,hash-two");
      const config = mod.getSSLPinningConfig();
      expect(config).toEqual({
        domain: "api.chatapp.com",
        wsDomain: "ws.chatapp.com",
        enabled: true,
        certificateHashes: ["hash-one", "hash-two"],
        allowInsecureConnections: false,
        timeout: 15000,
      });
      expect(mod.validateSSLPinningConfig()).toBe(true);
    });

    it("returns hashes only for matching domain", () => {
      const mod = loadModule(false, "hash-one");
      expect(mod.getCertificateHashForDomain("api.chatapp.com")).toEqual(["hash-one"]);
      expect(mod.getCertificateHashForDomain("sub.api.chatapp.com")).toEqual(["hash-one"]);
      expect(mod.getCertificateHashForDomain("ws.chatapp.com")).toEqual([]);
      expect(mod.getCertificateHashForDomain("example.com")).toEqual([]);
    });

    it("checks SSL pinning for various domains", () => {
      const mod = loadModule(false, "hash-one");
      expect(mod.shouldUseSSLPinning("api.chatapp.com/messages")).toBe(true);
      expect(mod.shouldUseSSLPinning("ws.chatapp.com/socket")).toBe(true);
      expect(mod.shouldUseSSLPinning("sub.api.chatapp.com")).toBe(true);
      expect(mod.shouldUseSSLPinning("example.com")).toBe(false);
    });

    it("builds secure HTTP and WebSocket URLs", () => {
      const mod = loadModule(false, "hash-one");
      expect(mod.getSecureUrl("/messages")).toBe("https://api.chatapp.com/messages");
      expect(mod.getSecureUrl("messages")).toBe("https://api.chatapp.com/messages");
      expect(mod.getSecureUrl("/socket", true)).toBe("wss://ws.chatapp.com/socket");
    });

    it("returns staging and production environment configurations", () => {
      const mod = loadModule(true);
      const stagingConfig = mod.getSSLPinningConfigForEnv("staging");
      expect(stagingConfig).toEqual({
        domain: "api.chatapp.com",
        wsDomain: "ws.chatapp.com",
        enabled: true,
        certificateHashes: [],
        allowInsecureConnections: false,
        timeout: 12000,
      });
      const prodConfig = mod.getSSLPinningConfigForEnv("production");
      expect(prodConfig).toEqual({
        domain: "api.chatapp.com",
        wsDomain: "ws.chatapp.com",
        enabled: true,
        certificateHashes: [],
        allowInsecureConnections: false,
        timeout: 15000,
      });
    });
  });

  describe("getSSLPinningConfigForEnv development", () => {
    it("returns development environment configuration", () => {
      const mod = loadModule(true);
      expect(mod.getSSLPinningConfigForEnv("development")).toEqual({
        domain: "localhost:8080",
        wsDomain: "localhost:8080",
        enabled: false,
        certificateHashes: [],
        allowInsecureConnections: true,
        timeout: 10000,
      });
    });
  });

  describe("SSL_CONFIG", () => {
    it("defines development, staging, and production defaults", () => {
      const mod = loadModule(true, "configured-hash");
      expect(mod.SSL_CONFIG).toEqual({
        development: {
          enabled: false,
          allowInsecureConnections: true,
          certificateHashes: [],
          timeout: 10000,
        },
        staging: {
          enabled: true,
          allowInsecureConnections: false,
          certificateHashes: ["configured-hash"],
          timeout: 12000,
        },
        production: {
          enabled: true,
          allowInsecureConnections: false,
          certificateHashes: ["configured-hash"],
          timeout: 15000,
        },
      });
    });
  });

  it("exposes the same helpers through the default export", () => {
    const mod = loadModule(true);
    expect(mod.default.getSSLPinningConfig).toBe(mod.getSSLPinningConfig);
    expect(mod.default.validateSSLPinningConfig).toBe(mod.validateSSLPinningConfig);
    expect(mod.default.getCertificateHashForDomain).toBe(mod.getCertificateHashForDomain);
    expect(mod.default.shouldUseSSLPinning).toBe(mod.shouldUseSSLPinning);
    expect(mod.default.getSecureUrl).toBe(mod.getSecureUrl);
    expect(mod.default.getSSLPinningConfigForEnv).toBe(mod.getSSLPinningConfigForEnv);
    expect(mod.default.SSL_CONFIG).toBe(mod.SSL_CONFIG);
  });
});
