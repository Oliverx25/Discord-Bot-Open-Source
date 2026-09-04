import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dnsLookupMock = vi.fn();

vi.mock("node:dns", () => ({
  default: { lookup: (...args: unknown[]) => dnsLookupMock(...args) },
  lookup: (...args: unknown[]) => dnsLookupMock(...args),
}));

interface FakeHopSpec {
  status: number;
  headers?: Record<string, string>;
  body?: Buffer;
}

class FakeClientRequest extends EventEmitter {
  destroyed = false;
  end(): void {}
  destroy(): void {
    this.destroyed = true;
  }
}

class FakeIncomingMessage extends EventEmitter {
  statusCode: number;
  headers: Record<string, string>;
  destroyed = false;
  constructor(status: number, headers: Record<string, string>) {
    super();
    this.statusCode = status;
    this.headers = headers;
  }
  resume(): void {}
  destroy(): void {
    this.destroyed = true;
  }
}

let hopQueue: FakeHopSpec[] = [];
const httpsRequestMock = vi.fn();

vi.mock("node:https", () => ({
  default: { request: (...args: unknown[]) => httpsRequestMock(...args) },
  request: (...args: unknown[]) => httpsRequestMock(...args),
}));

function pngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
}

function htmlBuffer(): Buffer {
  return Buffer.from("<!DOCTYPE html><html>nope</html>");
}

const {
  isBlockedIPv4,
  isBlockedIPv6,
  sniffImageMagic,
  assertSafeUrl,
  validatingLookup,
  safeImageFetch,
  SafeImageFetchError,
} = await import("./safeImageFetch.js");

beforeEach(() => {
  dnsLookupMock.mockReset();
  httpsRequestMock.mockReset();
  hopQueue = [];
});

describe("isBlockedIPv4", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.5",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "224.0.0.1",
    "255.255.255.255",
  ])("blocks %s", (ip) => {
    expect(isBlockedIPv4(ip)).toBe(true);
  });

  it.each(["8.8.8.8", "1.1.1.1", "93.184.216.34"])("allows public %s", (ip) => {
    expect(isBlockedIPv4(ip)).toBe(false);
  });
});

describe("isBlockedIPv6", () => {
  it.each([
    "::1",
    "::",
    "fd12::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "::ffff:10.0.0.1",
  ])("blocks %s", (ip) => {
    expect(isBlockedIPv6(ip)).toBe(true);
  });

  it("allows a public IPv6 address", () => {
    expect(isBlockedIPv6("2606:4700:4700::1111")).toBe(false);
  });

  it("blocks an IPv4-mapped public-looking address if the embedded v4 is private", () => {
    expect(isBlockedIPv6("::ffff:192.168.1.1")).toBe(true);
  });
});

describe("sniffImageMagic", () => {
  it("recognizes PNG/JPEG/GIF/WEBP magic bytes", () => {
    expect(sniffImageMagic(pngBuffer())).toBe("image/png");
    expect(sniffImageMagic(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe(
      "image/jpeg",
    );
    expect(sniffImageMagic(Buffer.from("GIF89a"))).toBe("image/gif");
    const webp = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from("WEBP"),
    ]);
    expect(sniffImageMagic(webp)).toBe("image/webp");
  });

  it("rejects an HTML body even if it were mislabeled as an image (SEC-02)", () => {
    expect(sniffImageMagic(htmlBuffer())).toBeNull();
  });
});

describe("assertSafeUrl", () => {
  it("rejects http:// (https only by default)", () => {
    expect(() => assertSafeUrl("http://example.com/x.png")).toThrow(
      SafeImageFetchError,
    );
  });

  it("rejects credentials in the URL", () => {
    expect(() => assertSafeUrl("https://user:pass@example.com/x.png")).toThrow(
      SafeImageFetchError,
    );
  });

  it("rejects a malformed URL", () => {
    expect(() => assertSafeUrl("not a url")).toThrow(SafeImageFetchError);
  });

  it("accepts a well-formed https URL", () => {
    expect(assertSafeUrl("https://example.com/x.png").hostname).toBe(
      "example.com",
    );
  });
});

describe("validatingLookup", () => {
  it("blocks when the resolved address is private (localhost)", () => {
    dnsLookupMock.mockImplementation((_host, _opts, cb) => {
      cb(null, [{ address: "127.0.0.1", family: 4 }]);
    });
    const callback = vi.fn();
    validatingLookup("localhost", {}, callback);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SSRF_BLOCKED_IP" }),
      "",
      4,
    );
  });

  it("blocks when any of several resolved addresses is private", () => {
    dnsLookupMock.mockImplementation((_host, _opts, cb) => {
      cb(null, [
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 },
      ]);
    });
    const callback = vi.fn();
    validatingLookup("evil.example", {}, callback);
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      code: "SSRF_BLOCKED_IP",
    });
  });

  it("allows a public resolved address and pins it", () => {
    dnsLookupMock.mockImplementation((_host, _opts, cb) => {
      cb(null, [{ address: "93.184.216.34", family: 4 }]);
    });
    const callback = vi.fn();
    validatingLookup("example.com", {}, callback);
    expect(callback).toHaveBeenCalledWith(null, "93.184.216.34", 4);
  });

  it("errors when DNS resolves to nothing", () => {
    dnsLookupMock.mockImplementation((_host, _opts, cb) => {
      cb(null, []);
    });
    const callback = vi.fn();
    validatingLookup("nowhere.example", {}, callback);
    expect(callback.mock.calls[0]?.[0]).toBeInstanceOf(Error);
  });
});

/** Encola una respuesta simple (sin redirect) que la próxima llamada a https.request sirve. */
function queueResponse(spec: FakeHopSpec): void {
  hopQueue.push(spec);
}

function installHttpsRequestFake(options: { hang?: boolean } = {}): void {
  httpsRequestMock.mockImplementation((reqOptions, callback) => {
    const req = new FakeClientRequest();
    const signal = reqOptions.signal as AbortSignal | undefined;
    signal?.addEventListener("abort", () => {
      req.emit(
        "error",
        Object.assign(new Error("aborted"), { name: "AbortError" }),
      );
    });
    if (options.hang) return req; // nunca resuelve ni rechaza por sí solo — solo el timeout lo saca
    // Ejercita el `lookup` real (no mockeado) para validar la integración
    // completa — solo dns.lookup y https.request de bajo nivel están fake.
    reqOptions.lookup(reqOptions.hostname, {}, (err: Error | null) => {
      if (err) {
        queueMicrotask(() => req.emit("error", err));
        return;
      }
      const spec = hopQueue.shift();
      if (!spec) {
        queueMicrotask(() => req.emit("error", new Error("no hop queued")));
        return;
      }
      const res = new FakeIncomingMessage(spec.status, spec.headers ?? {});
      queueMicrotask(() => {
        callback(res);
        if (spec.status >= 300 && spec.status < 400) return; // el caller hace res.resume()
        const body = spec.body ?? Buffer.alloc(0);
        const chunkSize = 1024;
        for (let i = 0; i < body.length; i += chunkSize) {
          res.emit("data", body.subarray(i, i + chunkSize));
        }
        if (!res.destroyed) res.emit("end");
      });
    });
    return req;
  });
}

describe("safeImageFetch (end-to-end sobre https.request/dns.lookup fake)", () => {
  beforeEach(() => {
    installHttpsRequestFake();
  });

  it("accepts a small valid image", async () => {
    dnsLookupMock.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    queueResponse({
      status: 200,
      headers: { "content-type": "image/png" },
      body: pngBuffer(),
    });
    const result = await safeImageFetch("https://example.com/x.png");
    expect(result.contentType).toBe("image/png");
    expect(result.buffer.equals(pngBuffer())).toBe(true);
  });

  it("rejects an HTML body served with an image Content-Type", async () => {
    dnsLookupMock.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    queueResponse({
      status: 200,
      headers: { "content-type": "image/png" },
      body: htmlBuffer(),
    });
    await expect(
      safeImageFetch("https://example.com/fake.png"),
    ).rejects.toMatchObject({
      code: "NOT_AN_IMAGE",
    });
  });

  it("aborts streaming once the byte limit is exceeded", async () => {
    dnsLookupMock.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    const big = Buffer.concat([pngBuffer(), Buffer.alloc(200)]);
    queueResponse({
      status: 200,
      headers: { "content-type": "image/png" },
      body: big,
    });
    await expect(
      safeImageFetch("https://example.com/big.png", { maxBytes: 16 }),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
  });

  it("blocks a redirect that resolves to a private address (público→privado)", async () => {
    dnsLookupMock.mockImplementation((host, _o, cb) => {
      if (host === "example.com")
        return cb(null, [{ address: "93.184.216.34", family: 4 }]);
      return cb(null, [{ address: "127.0.0.1", family: 4 }]); // internal.example
    });
    queueResponse({
      status: 302,
      headers: { location: "https://internal.example/secret.png" },
    });
    await expect(
      safeImageFetch("https://example.com/redirect"),
    ).rejects.toMatchObject({
      code: "SSRF_BLOCKED_IP",
    });
  });

  it("enforces the redirect hop limit", async () => {
    dnsLookupMock.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    queueResponse({
      status: 302,
      headers: { location: "https://example.com/1" },
    });
    queueResponse({
      status: 302,
      headers: { location: "https://example.com/2" },
    });
    queueResponse({
      status: 302,
      headers: { location: "https://example.com/3" },
    });
    queueResponse({
      status: 302,
      headers: { location: "https://example.com/4" },
    });
    await expect(
      safeImageFetch("https://example.com/start", { maxRedirects: 2 }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REDIRECTS" });
  });

  it("rejects a non-image response even with 200", async () => {
    dnsLookupMock.mockImplementation((_h, _o, cb) =>
      cb(null, [{ address: "93.184.216.34", family: 4 }]),
    );
    queueResponse({ status: 500, headers: {} });
    await expect(
      safeImageFetch("https://example.com/err.png"),
    ).rejects.toMatchObject({
      code: "BAD_STATUS",
    });
  });
});

describe("safeImageFetch — timeout libera el request colgado", () => {
  it("aborts and rejects with TIMEOUT when the server never responds", async () => {
    vi.useFakeTimers();
    try {
      dnsLookupMock.mockImplementation((_h, _o, cb) =>
        cb(null, [{ address: "93.184.216.34", family: 4 }]),
      );
      installHttpsRequestFake({ hang: true });
      const pending = safeImageFetch("https://example.com/slow.png", {
        timeoutMs: 5_000,
      });
      const assertion = expect(pending).rejects.toMatchObject({
        code: "TIMEOUT",
      });
      await vi.advanceTimersByTimeAsync(5_001);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
