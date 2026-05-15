import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_xxx",
  CLERK_SECRET_KEY: "sk_test_xxx",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  MONGODB_URL: "mongodb+srv://user:pass@cluster.example/resume",
  GEMINI_API_KEY: "gemini-key",
};

describe("getServerEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses when all required variables are set", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    const { getServerEnv } = await import("./env");
    const env = getServerEnv();
    expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_xxx");
    expect(env.MONGODB_URL).toBe(validEnv.MONGODB_URL);
    expect(env.GEMINI_API_KEY).toBe("gemini-key");
  });

  it("throws a clear error when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is empty", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, key === "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ? "" : value);
    }
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow(/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/i);
  });

  it("throws when MONGODB_URL is not a mongodb connection string", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, key === "MONGODB_URL" ? "https://wrong.example" : value);
    }
    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow(/mongo/i);
  });

  it("defaults BASE_URL when unset", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    const { getServerEnv } = await import("./env");
    expect(getServerEnv().BASE_URL).toBe("http://localhost:3000");
  });

  it("normalizes BASE_URL without scheme to http", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BASE_URL", "localhost:3000");
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(getServerEnv().BASE_URL).toBe("http://localhost:3000");
  });

  it("rejects pk_test keys when BASE_URL is a production host", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BASE_URL", "https://resume-ai-app.vercel.app");
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow(/pk_live_/i);
  });

  it("rejects pk_test keys when VERCEL_ENV is production", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BASE_URL", "http://localhost:3000");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow(/pk_live_/i);
  });

  it("accepts pk_test keys for production BASE_URL when CLERK_ALLOW_DEVELOPMENT_KEYS is true", async () => {
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BASE_URL", "https://resume-ai-app.vercel.app");
    vi.stubEnv("CLERK_ALLOW_DEVELOPMENT_KEYS", "true");
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(getServerEnv().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_test_xxx");
  });

  it("accepts pk_live keys for production BASE_URL", async () => {
    const prodEnv = {
      ...validEnv,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_prodkey",
      CLERK_SECRET_KEY: "sk_live_prodkey",
    };
    for (const [key, value] of Object.entries(prodEnv)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BASE_URL", "https://resume-ai-app.vercel.app");
    vi.resetModules();
    const { getServerEnv } = await import("./env");
    expect(getServerEnv().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe("pk_live_prodkey");
  });
});
