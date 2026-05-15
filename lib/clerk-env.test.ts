import { describe, expect, it } from "vitest";
import {
  clerkKeyKind,
  requiresProductionClerkKeys,
  validateClerkKeysForDeployment,
} from "./clerk-env";

describe("clerkKeyKind", () => {
  it("returns development for pk_test_ keys", () => {
    expect(clerkKeyKind("pk_test_abc")).toBe("development");
  });

  it("returns production for pk_live_ keys", () => {
    expect(clerkKeyKind("pk_live_abc")).toBe("production");
  });

  it("returns invalid for unknown prefixes", () => {
    expect(clerkKeyKind("pk_unknown")).toBe("invalid");
    expect(clerkKeyKind("")).toBe("invalid");
  });
});

describe("requiresProductionClerkKeys", () => {
  it("is true for public production BASE_URL", () => {
    expect(
      requiresProductionClerkKeys({
        baseUrl: "https://resume-ai-app.vercel.app",
        vercelEnv: undefined,
      }),
    ).toBe(true);
  });

  it("is false for localhost BASE_URL without VERCEL_ENV=production", () => {
    expect(
      requiresProductionClerkKeys({
        baseUrl: "http://localhost:3000",
        vercelEnv: undefined,
      }),
    ).toBe(false);
  });

  it("is true when VERCEL_ENV is production even on localhost BASE_URL", () => {
    expect(
      requiresProductionClerkKeys({
        baseUrl: "http://localhost:3000",
        vercelEnv: "production",
      }),
    ).toBe(true);
  });
});

describe("validateClerkKeysForDeployment", () => {
  it("fails with 500-user guidance when test keys used on production host", () => {
    const result = validateClerkKeysForDeployment({
      publishableKey: "pk_test_abc",
      secretKey: "sk_test_abc",
      baseUrl: "https://resume-ai-app.vercel.app",
      vercelEnv: undefined,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/500 users/i);
      expect(result.error).toMatch(/pk_live_/i);
    }
  });

  it("passes when live keys used on production host", () => {
    expect(
      validateClerkKeysForDeployment({
        publishableKey: "pk_live_abc",
        secretKey: "sk_live_abc",
        baseUrl: "https://resume-ai-app.vercel.app",
        vercelEnv: undefined,
      }),
    ).toEqual({ ok: true });
  });

  it("passes when test keys used on localhost", () => {
    expect(
      validateClerkKeysForDeployment({
        publishableKey: "pk_test_abc",
        secretKey: "sk_test_abc",
        baseUrl: "http://localhost:3000",
        vercelEnv: undefined,
      }),
    ).toEqual({ ok: true });
  });

  it("passes when test keys used on production host with CLERK_ALLOW_DEVELOPMENT_KEYS", () => {
    expect(
      validateClerkKeysForDeployment({
        publishableKey: "pk_test_abc",
        secretKey: "sk_test_abc",
        baseUrl: "https://resume-ai-app.vercel.app",
        vercelEnv: undefined,
        allowDevelopmentKeys: "true",
      }),
    ).toEqual({ ok: true });
  });

  it("fails when allow flag is set but keys are mismatched", () => {
    const result = validateClerkKeysForDeployment({
      publishableKey: "pk_test_abc",
      secretKey: "sk_live_abc",
      baseUrl: "https://resume-ai-app.vercel.app",
      allowDevelopmentKeys: "true",
    });
    expect(result.ok).toBe(false);
  });
});
