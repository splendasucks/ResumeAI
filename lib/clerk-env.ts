export type ClerkKeyKind = "development" | "production" | "invalid";

export function clerkKeyKind(publishableKey: string): ClerkKeyKind {
  if (publishableKey.startsWith("pk_live_")) return "production";
  if (publishableKey.startsWith("pk_test_")) return "development";
  return "invalid";
}

export function requiresProductionClerkKeys(options: {
  baseUrl: string;
  vercelEnv: string | undefined;
}): boolean {
  if (options.vercelEnv === "production") return true;
  try {
    const host = new URL(options.baseUrl).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return false;
  }
}

export function allowsDevelopmentClerkKeysOnPublicDeploy(
  allowDevelopmentKeys: string | undefined,
): boolean {
  return allowDevelopmentKeys === "true";
}

export type ClerkKeysValidationInput = {
  publishableKey: string;
  secretKey: string;
  baseUrl: string;
  vercelEnv?: string;
  allowDevelopmentKeys?: string;
};

export type ClerkKeysValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateClerkKeysForDeployment(
  input: ClerkKeysValidationInput,
): ClerkKeysValidationResult {
  if (
    !requiresProductionClerkKeys({
      baseUrl: input.baseUrl,
      vercelEnv: input.vercelEnv,
    })
  ) {
    return { ok: true };
  }

  if (allowsDevelopmentClerkKeysOnPublicDeploy(input.allowDevelopmentKeys)) {
    const publishableKind = clerkKeyKind(input.publishableKey);
    const secretIsTest = input.secretKey.startsWith("sk_test_");
    if (publishableKind === "development" && secretIsTest) {
      return { ok: true };
    }
    if (publishableKind === "production" && input.secretKey.startsWith("sk_live_")) {
      return { ok: true };
    }
    return {
      ok: false,
      error:
        "CLERK_ALLOW_DEVELOPMENT_KEYS is set but keys are not a matching pk_test_/sk_test_ or pk_live_/sk_live_ pair.",
    };
  }

  const publishableKind = clerkKeyKind(input.publishableKey);
  const secretIsLive = input.secretKey.startsWith("sk_live_");

  if (publishableKind === "production" && secretIsLive) {
    return { ok: true };
  }

  const parts: string[] = [];
  if (publishableKind !== "production") {
    parts.push(
      "Production deployment requires Clerk Production keys (pk_live_). Development keys (pk_test_) are limited to 500 users; use a Production Instance in the Clerk Dashboard.",
    );
  }
  if (!secretIsLive) {
    parts.push("Production deployment requires CLERK_SECRET_KEY starting with sk_live_.");
  }

  return { ok: false, error: parts.join(" ") };
}
