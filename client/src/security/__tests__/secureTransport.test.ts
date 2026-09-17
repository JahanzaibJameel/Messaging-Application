import { fetch as sslFetch } from "react-native-ssl-pinning";
import { addUserActionBreadcrumb, captureException } from "../../monitoring/sentry";
import { getSSLPinningConfig, type SSLPinningConfig } from "../sslPinningConfig";
import transport, {
  createSecureWebSocket,
  enforceSecureUrl,
  getSecureUrl,
  isSecureUrl,
  secureFetch,
  validateCertificate,
  type SecureRequestOptions,
} from "../secureTransport";

jest.mock("react-native-ssl-pinning", () => ({ fetch: jest.fn() }));
jest.mock("../../monitoring/sentry", () => ({
  captureException: jest.fn(),
  addUserActionBreadcrumb: jest.fn(),
}));
jest.mock("../sslPinningConfig", () => ({ getSSLPinningConfig: jest.fn() }));

type NativeResponse = Awaited<ReturnType<typeof sslFetch>>;

const url = "https://api.example.test/users";
const pin = "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
const nativeFetch = jest.mocked(sslFetch);
const configGetter = jest.mocked(getSSLPinningConfig);
const breadcrumb = jest.mocked(addUserActionBreadcrumb);
const capture = jest.mocked(captureException);
const plainFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
let config: SSLPinningConfig;
let devDescriptor: PropertyDescriptor | undefined;
let fetchDescriptor: PropertyDescriptor | undefined;
let socketDescriptor: PropertyDescriptor | undefined;

class SocketDouble {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  static instances: SocketDouble[] = [];
  static failure: Error | undefined;
  readyState: number = SocketDouble.CONNECTING;
  onopen: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  close = jest.fn(() => {
    this.readyState = SocketDouble.CLOSED;
  });

  constructor(
    readonly url: string,
    readonly protocols?: string | string[]
  ) {
    if (SocketDouble.failure) {
      throw SocketDouble.failure;
    }
    SocketDouble.instances.push(this);
  }

  open(): void {
    this.readyState = SocketDouble.OPEN;
    this.onopen?.();
  }

  disconnect(): void {
    this.readyState = SocketDouble.CLOSED;
    this.onclose?.(new CloseEvent("close", { code: 1000, reason: "finished" }));
  }
}

function socket(): SocketDouble {
  const instance = SocketDouble.instances[SocketDouble.instances.length - 1];
  if (!instance) {
    throw new Error("Expected a WebSocket instance");
  }
  return instance;
}

function nativeResponse(overrides: Partial<NativeResponse> = {}): NativeResponse {
  return {
    status: 200,
    headers: { "content-type": "application/json" },
    url,
    data: '{"ok":true}',
    text: jest.fn(async () => "text fallback"),
    json: jest.fn(async () => ({ ok: true })),
    ...overrides,
  };
}

function browserResponse(data = '{"ok":true}', status = 200, statusText = "OK"): Response {
  return {
    status,
    statusText,
    headers: new Headers({ "content-type": "application/json" }),
    text: jest.fn(async () => data),
  } as unknown as Response;
}

function restoreGlobal(name: string, descriptor: PropertyDescriptor | undefined): void {
  if (descriptor) {
    Object.defineProperty(global, name, descriptor);
  } else {
    Reflect.deleteProperty(global, name);
  }
}

beforeEach(() => {
  devDescriptor = Object.getOwnPropertyDescriptor(global, "__DEV__");
  fetchDescriptor = Object.getOwnPropertyDescriptor(global, "fetch");
  socketDescriptor = Object.getOwnPropertyDescriptor(global, "WebSocket");
  Object.defineProperty(global, "__DEV__", { value: false, writable: true, configurable: true });
  Object.defineProperty(global, "fetch", { value: plainFetch, writable: true, configurable: true });
  Object.defineProperty(global, "WebSocket", {
    value: SocketDouble,
    writable: true,
    configurable: true,
  });
  nativeFetch.mockReset();
  plainFetch.mockReset();
  configGetter.mockReset();
  breadcrumb.mockReset();
  capture.mockReset();
  SocketDouble.instances = [];
  SocketDouble.failure = undefined;
  config = {
    domain: "configured.example.test",
    wsDomain: "configured-ws.example.test",
    enabled: true,
    certificateHashes: [pin],
    allowInsecureConnections: false,
    timeout: 15000,
  };
  configGetter.mockImplementation(() => config);
  nativeFetch.mockResolvedValue(nativeResponse());
  plainFetch.mockResolvedValue(browserResponse());
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
  restoreGlobal("__DEV__", devDescriptor);
  restoreGlobal("fetch", fetchDescriptor);
  restoreGlobal("WebSocket", socketDescriptor);
});

describe("configuration loading and SSL pinning", () => {
  it("uses configured production pins and timeout", async () => {
    await expect(secureFetch({ url })).resolves.toEqual({
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
      data: '{"ok":true}',
    });
    expect(configGetter).toHaveBeenCalledTimes(2);
    expect(nativeFetch).toHaveBeenCalledWith(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: undefined,
      timeoutInterval: 15000,
      sslPinning: { certs: [pin] },
    });
    expect(plainFetch).not.toHaveBeenCalled();
  });

  it.each([undefined, 50])(
    "rejects missing production configuration with timeout %s",
    async (timeout) => {
      const error = new Error("SSL certificate pinning hashes not configured");
      configGetter.mockImplementation(() => {
        throw error;
      });
      const request = secureFetch({ url, timeout });
      await expect(request).rejects.toThrow("SSL certificate pinning hashes not configured");
      await expect(request).rejects.toBe(error);
      expect(nativeFetch).not.toHaveBeenCalled();
    }
  );

  it.each(["certificate pin mismatch", "malformed certificate hash"])(
    "preserves native pinning rejection: %s",
    async (message) => {
      config.certificateHashes = ["malformed-pin"];
      const error = new Error(message);
      nativeFetch.mockRejectedValue(error);
      const request = secureFetch({ url });
      await expect(request).rejects.toThrow(message);
      await expect(request).rejects.toBe(error);
      expect(capture).toHaveBeenCalledWith(error, {
        action: "secure_fetch",
        screen: "security_module",
        additionalData: { url, method: "GET" },
      });
    }
  );

  describe("development", () => {
    beforeEach(() => {
      Object.defineProperty(global, "__DEV__", { value: true, writable: true });
      config.enabled = false;
      config.allowInsecureConnections = true;
      config.certificateHashes = [];
    });

    it("bypasses a failing pinned transport but still loads the default timeout", async () => {
      nativeFetch.mockRejectedValue(new Error("bad certificate"));
      await expect(secureFetch({ url })).resolves.toEqual({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        data: '{"ok":true}',
      });
      expect(nativeFetch).not.toHaveBeenCalled();
      expect(configGetter).toHaveBeenCalledTimes(1);
    });

    it("does not load config with an explicit development timeout", async () => {
      configGetter.mockImplementation(() => {
        throw new Error("unavailable config");
      });
      await expect(secureFetch({ url, timeout: 10 })).resolves.toMatchObject({ status: 200 });
      expect(configGetter).not.toHaveBeenCalled();
    });
  });
});

describe.each([false, true])("secureFetch with __DEV__=%s", (development) => {
  beforeEach(() => {
    Object.defineProperty(global, "__DEV__", { value: development, writable: true });
  });

  it.each<NonNullable<SecureRequestOptions["method"]>>(["GET", "POST", "PUT", "PATCH", "DELETE"])(
    "preserves the %s method, serialized body, custom headers, and query string",
    async (method) => {
      const target = `${url}?name=Jos%C3%A9&tag=a%20b`;
      const body = method === "GET" ? undefined : '{"message":"你好世界"}';
      const headers = { Authorization: "Bearer private-token", "X-Name": "José" };
      await expect(
        secureFetch({ url: target, method, headers, body, timeout: 321 })
      ).resolves.toEqual({
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        data: '{"ok":true}',
      });
      const expected = {
        method,
        body,
        headers: { "Content-Type": "application/json", ...headers },
      };
      if (development) {
        expect(plainFetch).toHaveBeenCalledWith(target, expected);
      } else {
        expect(nativeFetch).toHaveBeenCalledWith(target, {
          ...expected,
          timeoutInterval: 321,
          sslPinning: { certs: [pin] },
        });
      }
      expect(breadcrumb).toHaveBeenCalledWith("secure_fetch_attempt", {
        url: target,
        method,
        hasBody: Boolean(body),
      });
      expect(breadcrumb).toHaveBeenCalledWith("secure_fetch_success", {
        url: target,
        status: 200,
        responseSize: 11,
      });
    }
  );

  it.each(["", undefined])("preserves an empty or absent DELETE body: %s", async (body) => {
    await expect(secureFetch({ url, method: "DELETE", body })).resolves.toMatchObject({
      status: 200,
    });
    expect(development ? plainFetch : nativeFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ body, method: "DELETE" })
    );
  });

  it("allows overriding the default content type", async () => {
    await expect(
      secureFetch({
        url,
        method: "POST",
        body: "plain text",
        headers: { "Content-Type": "text/plain" },
      })
    ).resolves.toMatchObject({ data: '{"ok":true}' });
    expect(development ? plainFetch : nativeFetch).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ headers: { "Content-Type": "text/plain" }, body: "plain text" })
    );
  });

  it.each([400, 401, 403, 404, 500, 503])(
    "returns a resolved HTTP %s response without retrying",
    async (status) => {
      nativeFetch.mockResolvedValue(nativeResponse({ status, data: "failure" }));
      plainFetch.mockResolvedValue(browserResponse("failure", status, "Failure"));
      await expect(secureFetch({ url })).resolves.toEqual({
        status,
        statusText: development ? "Failure" : "OK",
        headers: { "content-type": "application/json" },
        data: "failure",
      });
      expect(development ? plainFetch : nativeFetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each([undefined, "POST"] as const)(
    "rethrows network errors with method %s without exposing headers",
    async (method) => {
      const error = new Error("Network unavailable");
      nativeFetch.mockRejectedValue(error);
      plainFetch.mockRejectedValue(error);
      const request = secureFetch({
        url,
        method,
        headers: { Authorization: "Bearer private-token" },
      });
      await expect(request).rejects.toThrow("Network unavailable");
      await expect(request).rejects.toBe(error);
      expect(error.message).not.toContain("private-token");
      expect(breadcrumb).toHaveBeenCalledWith("secure_fetch_error", { url, error: error.message });
      expect(capture).toHaveBeenCalledWith(error, {
        action: "secure_fetch",
        screen: "security_module",
        additionalData: { url, method: method || "GET" },
      });
      expect(JSON.stringify([breadcrumb.mock.calls, capture.mock.calls])).not.toContain(
        "private-token"
      );
    }
  );

  it("returns malformed JSON as unparsed text", async () => {
    nativeFetch.mockResolvedValue(nativeResponse({ data: "{broken" }));
    plainFetch.mockResolvedValue(browserResponse("{broken"));
    await expect(secureFetch({ url })).resolves.toMatchObject({ data: "{broken" });
  });

  it("propagates response body read failures", async () => {
    const error = new Error("Cannot read body");
    const text = jest.fn<Promise<string>, []>().mockRejectedValue(error);
    nativeFetch.mockResolvedValue(nativeResponse({ data: "", text }));
    plainFetch.mockResolvedValue({ ...browserResponse(), text });
    await expect(secureFetch({ url })).rejects.toThrow("Cannot read body");
  });
});

describe("secureFetch response normalization", () => {
  it.each([
    { input: { data: "preferred", bodyString: "ignored" }, output: "preferred" },
    { input: { data: "", bodyString: "body" }, output: "body" },
    { input: { data: undefined, bodyString: "" }, output: "" },
    { input: { data: undefined }, output: "text fallback" },
  ])("selects the response body with $output", async ({ input, output }) => {
    nativeFetch.mockResolvedValue(nativeResponse(input));
    await expect(secureFetch({ url })).resolves.toMatchObject({ data: output });
  });

  it("tolerates absent native fields and non-callable text", async () => {
    nativeFetch.mockResolvedValue({ data: 42, text: "not callable" } as unknown as NativeResponse);
    await expect(secureFetch({ url })).resolves.toEqual({
      status: 200,
      statusText: "OK",
      headers: {},
      data: "",
    });
  });

  it("normalizes native header values and defaults a zero status", async () => {
    nativeFetch.mockResolvedValue({
      ...nativeResponse(),
      status: 0,
      headers: { "x-count": 3, "x-empty": null },
    } as unknown as NativeResponse);
    await expect(secureFetch({ url })).resolves.toMatchObject({
      status: 200,
      headers: { "x-count": "3", "x-empty": "null" },
    });
  });

  it("retains empty native headers", async () => {
    nativeFetch.mockResolvedValue(nativeResponse({ headers: {} }));
    await expect(secureFetch({ url })).resolves.toMatchObject({ headers: {} });
  });

  describe("development response", () => {
    beforeEach(() => {
      Object.defineProperty(global, "__DEV__", { value: true, writable: true });
    });

    it("defaults missing status text and retains an empty body", async () => {
      plainFetch.mockResolvedValue(browserResponse("", 204, ""));
      await expect(secureFetch({ url })).resolves.toEqual({
        status: 204,
        statusText: "",
        headers: { "content-type": "application/json" },
        data: "",
      });
    });
  });

  it("propagates the native transport timeout at the configured deadline", async () => {
    jest.useFakeTimers();
    nativeFetch.mockImplementation(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          setTimeout(() => reject(new Error("Native request timeout")), options.timeoutInterval);
        })
    );
    const request = secureFetch({ url, timeout: 20 });
    const assertion = expect(request).rejects.toThrow("Native request timeout");
    await jest.advanceTimersByTimeAsync(21);
    await assertion;
    expect(nativeFetch).toHaveBeenCalledTimes(1);
  });
});

describe("createSecureWebSocket", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it.each([undefined, "chat", ["chat", "json"]])(
    "resolves the opened production socket with protocols %s",
    async (protocols) => {
      const target = "wss://socket.example.test/chat";
      const connection = createSecureWebSocket({ url: target, protocols });
      const instance = socket();
      expect(instance.url).toBe(target);
      expect(instance.protocols).toEqual(protocols);
      instance.open();
      await expect(connection).resolves.toBe(instance);
      expect(jest.getTimerCount()).toBe(0);
      expect(breadcrumb).toHaveBeenCalledWith("secure_websocket_connected", { url: target });
    }
  );

  it.each(["ws://example.test", "https://example.test", "invalid"])(
    "rejects insecure production URL %s before creating a socket",
    async (target) => {
      await expect(createSecureWebSocket({ url: target })).rejects.toThrow(
        "WebSocket URL must use wss:// in production"
      );
      expect(SocketDouble.instances).toHaveLength(0);
      expect(capture).toHaveBeenCalledWith(expect.any(Error), {
        action: "secure_websocket",
        screen: "security_module",
        additionalData: { url: target },
      });
    }
  );

  describe("development", () => {
    beforeEach(() => {
      Object.defineProperty(global, "__DEV__", { value: true, writable: true });
    });

    it("allows a plain ws connection", async () => {
      const connection = createSecureWebSocket({ url: "ws://localhost:8080/chat" });
      socket().open();
      await expect(connection).resolves.toBe(socket());
      expect(socket().url).toBe("ws://localhost:8080/chat");
    });
  });

  it.each([undefined, 20, 0])(
    "closes and rejects a connecting socket after timeout %s",
    async (timeout) => {
      const connection = createSecureWebSocket({ url: "wss://example.test", timeout });
      const assertion = expect(connection).rejects.toThrow("WebSocket connection timeout");
      await jest.advanceTimersByTimeAsync((timeout ?? config.timeout) + 1);
      await assertion;
      expect(socket().readyState).toBe(SocketDouble.CLOSED);
      expect(jest.getTimerCount()).toBe(0);
    }
  );

  it("does not close a socket that left CONNECTING before the timeout callback", async () => {
    const connection = createSecureWebSocket({ url: "wss://example.test", timeout: 10 });
    socket().readyState = SocketDouble.OPEN;
    await jest.advanceTimersByTimeAsync(11);
    expect(socket().readyState).toBe(SocketDouble.OPEN);
    expect(socket().close).not.toHaveBeenCalled();
    socket().open();
    await expect(connection).resolves.toBe(socket());
  });

  it("rejects the original error event and cancels its timeout", async () => {
    const connection = createSecureWebSocket({ url: "wss://example.test" });
    const event = new Event("error");
    const assertion = expect(connection).rejects.toBe(event);
    socket().onerror?.(event);
    await assertion;
    expect(jest.getTimerCount()).toBe(0);
    expect(breadcrumb).toHaveBeenCalledWith("secure_websocket_error", {
      url: "wss://example.test",
      error: String(event),
    });
    expect(capture).toHaveBeenCalledWith(new Error("WebSocket connection failed"), {
      action: "secure_websocket",
      screen: "security_module",
      additionalData: { url: "wss://example.test" },
    });
  });

  it("leaves message handling to the returned socket and records close", async () => {
    const connection = createSecureWebSocket({ url: "wss://example.test" });
    socket().open();
    await expect(connection).resolves.toBe(socket());
    const messages: string[] = [];
    socket().onmessage = (event) => messages.push(event.data);
    socket().onmessage?.(new MessageEvent<string>("message", { data: "hello" }));
    expect(messages).toEqual(["hello"]);
    socket().disconnect();
    expect(socket().readyState).toBe(SocketDouble.CLOSED);
    expect(jest.getTimerCount()).toBe(0);
    expect(breadcrumb).toHaveBeenCalledWith("secure_websocket_closed", {
      url: "wss://example.test",
      code: 1000,
      reason: "finished",
    });
  });

  it("characterizes the reported unresolved promise on close before open", async () => {
    let settled = false;
    void createSecureWebSocket({ url: "wss://example.test", timeout: 10 }).then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      }
    );
    socket().disconnect();
    await jest.advanceTimersByTimeAsync(20);
    expect(settled).toBe(false);
    expect(socket().readyState).toBe(SocketDouble.CLOSED);
    expect(jest.getTimerCount()).toBe(0);
    expect(SocketDouble.instances).toHaveLength(1);
  });

  it("captures constructor failures separately from setup failures", async () => {
    const error = new Error("Constructor failed");
    SocketDouble.failure = error;
    const connection = createSecureWebSocket({ url: "wss://example.test" });
    await expect(connection).rejects.toThrow("Constructor failed");
    await expect(connection).rejects.toBe(error);
    expect(capture).toHaveBeenCalledWith(error, {
      action: "secure_websocket_creation",
      screen: "security_module",
      additionalData: { url: "wss://example.test" },
    });
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects and reports configuration setup failures", async () => {
    const error = new Error("Configuration unavailable");
    configGetter.mockImplementation(() => {
      throw error;
    });
    await expect(createSecureWebSocket({ url: "wss://example.test" })).rejects.toThrow(
      "Configuration unavailable"
    );
    expect(capture).toHaveBeenCalledWith(error, {
      action: "secure_websocket_setup",
      screen: "security_module",
      additionalData: { url: "wss://example.test" },
    });
    expect(SocketDouble.instances).toHaveLength(0);
  });
});

describe("validateCertificate", () => {
  it("returns true after a successful pinned health request", async () => {
    await expect(validateCertificate("api.example.test")).resolves.toBe(true);
    expect(nativeFetch).toHaveBeenCalledWith(
      "https://api.example.test/health",
      expect.objectContaining({
        method: "GET",
        timeoutInterval: 5000,
        sslPinning: { certs: [pin] },
      })
    );
    expect(breadcrumb).toHaveBeenCalledWith("certificate_validation_success", {
      domain: "api.example.test",
    });
  });

  it("returns false rather than throwing when the health request fails", async () => {
    nativeFetch.mockRejectedValue(new Error("Certificate rejected"));
    await expect(validateCertificate("api.example.test")).resolves.toBe(false);
    expect(breadcrumb).toHaveBeenCalledWith("certificate_validation_failed", {
      domain: "api.example.test",
      error: "Certificate rejected",
    });
  });
});

describe("getSecureUrl", () => {
  it.each([
    ["https://custom.example.test", "/users", false, "https://custom.example.test/users"],
    [
      "http://custom.example.test:8080/api/",
      "users",
      false,
      "https://custom.example.test:8080/api/users",
    ],
    ["custom.example.test/api///", "users", false, "https://custom.example.test/api/users"],
    ["HTTPS://custom.example.test", "", false, "https://custom.example.test/"],
    [
      "https://custom.example.test/api",
      "/users?q=a%20b",
      false,
      "https://custom.example.test/api/users?q=a%20b",
    ],
    ["ws://custom.example.test/chat/", "events", true, "wss://custom.example.test/chat/events"],
    ["wss://custom.example.test", "/events", true, "wss://custom.example.test/events"],
    ["", "/users", false, "https://configured.example.test/users"],
    ["", "events", true, "wss://configured-ws.example.test/events"],
    ["http://localhost:8080", "users", false, "https://localhost:8080/users"],
  ] as const)("builds %s + %s (WebSocket=%s)", (base, path, websocket, expected) => {
    expect(getSecureUrl(base, path, websocket)).toBe(expected);
  });

  it("uses different supplied bases independently with HTTP as the default mode", () => {
    expect(getSecureUrl("https://one.example.test", "users")).toBe(
      "https://one.example.test/users"
    );
    expect(getSecureUrl("https://two.example.test", "users")).toBe(
      "https://two.example.test/users"
    );
  });

  describe("insecure connections allowed", () => {
    beforeEach(() => {
      config.allowInsecureConnections = true;
    });

    it.each([
      ["http://localhost:8080/api/", false, "http://localhost:8080/api/users"],
      ["127.0.0.1:8080", false, "http://127.0.0.1:8080/users"],
      ["localhost:8080", true, "ws://localhost:8080/users"],
      ["127.0.0.1:8080", true, "ws://127.0.0.1:8080/users"],
      ["remote.example.test", false, "https://remote.example.test/users"],
      ["remote.example.test", true, "wss://remote.example.test/users"],
      ["localhost.example.test", false, "https://localhost.example.test/users"],
      ["127.0.0.1.example.test", false, "https://127.0.0.1.example.test/users"],
      ["remote.example.test/localhost", false, "https://remote.example.test/localhost/users"],
    ] as const)(
      "applies the connection policy to supplied base %s",
      (base, websocket, expected) => {
        expect(getSecureUrl(base, "users", websocket)).toBe(expected);
      }
    );
  });
});

describe("isSecureUrl", () => {
  it.each([
    ["https://example.test", true],
    ["wss://example.test", true],
    ["http://example.test", false],
    ["ws://example.test", false],
    ["ftp://example.test", false],
    ["not a URL", false],
    ["", false],
  ] as const)("classifies %s", (target, expected) => {
    expect(isSecureUrl(target)).toBe(expected);
  });
});

describe("enforceSecureUrl", () => {
  it("upgrades HTTP while retaining path, query, and fragment", () => {
    expect(enforceSecureUrl("http://example.test/path?q=1#section")).toBe(
      "https://example.test/path?q=1#section"
    );
  });

  it.each(["https://example.test", "wss://example.test", "ws://example.test", "invalid", ""])(
    "preserves non-HTTP or invalid input %s",
    (target) => {
      expect(enforceSecureUrl(target)).toBe(target);
    }
  );

  it("preserves HTTP when insecure connections are allowed", () => {
    config.allowInsecureConnections = true;
    expect(enforceSecureUrl("http://localhost:8080/path")).toBe("http://localhost:8080/path");
  });

  it("returns the original URL if configuration throws", () => {
    configGetter.mockImplementation(() => {
      throw new Error("Missing config");
    });
    expect(enforceSecureUrl("http://example.test")).toBe("http://example.test");
  });
});

describe("default export", () => {
  it("exposes the real named transport functions", () => {
    expect(transport).toEqual({
      secureFetch,
      createSecureWebSocket,
      validateCertificate,
      getSecureUrl,
      isSecureUrl,
      enforceSecureUrl,
    });
  });
});
