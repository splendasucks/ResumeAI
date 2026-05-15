import { z } from "zod";
import { validateClerkKeysForDeployment } from "./clerk-env";
import { normalizeBaseUrl } from "./base-url";

export { normalizeBaseUrl } from "./base-url";

const serverEnvSchema = z
  .object({
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
      .string({ required_error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required" })
      .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1, "NEXT_PUBLIC_CLERK_SIGN_IN_URL is required"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1, "NEXT_PUBLIC_CLERK_SIGN_UP_URL is required"),
    MONGODB_URL: z
      .string()
      .min(1, "MONGODB_URL is required")
      .regex(
        /^mongodb(\+srv)?:\/\/.+/i,
        "MONGODB_URL must be a mongodb:// or mongodb+srv:// connection string",
      ),
    GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
    BASE_URL: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    BASE_URL: normalizeBaseUrl(data.BASE_URL),
  }))
  .superRefine((data, ctx) => {
    const clerkCheck = validateClerkKeysForDeployment({
      publishableKey: data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      secretKey: data.CLERK_SECRET_KEY,
      baseUrl: data.BASE_URL,
      vercelEnv: process.env.VERCEL_ENV,
      allowDevelopmentKeys: process.env.CLERK_ALLOW_DEVELOPMENT_KEYS,
    });
    if (clerkCheck.ok) return;

    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: clerkCheck.error,
      path: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
    });
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const msg = result.error.issues
      .map((e) => `${e.path.filter(Boolean).join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${msg}`);
  }
  return result.data;
}
