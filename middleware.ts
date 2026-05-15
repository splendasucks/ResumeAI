import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { normalizeBaseUrl } from "@/lib/base-url";

const isProtectedRoute = createRouteMatcher(["/dashboard", "/my-resume/:resumeId/edit"]);

function clerkAuthorizedParties(): string[] {
  const parties = new Set<string>(["http://localhost:3000", "https://resume-ai-app.vercel.app"]);
  const normalized = normalizeBaseUrl(process.env.BASE_URL);
  if (normalized.startsWith("http")) {
    parties.add(normalized.replace(/\/$/, ""));
  }
  return Array.from(parties);
}

export default clerkMiddleware(
  async (auth, request) => {
    if (isProtectedRoute(request)) {
      await auth.protect();
    }
  },
  { authorizedParties: clerkAuthorizedParties() },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
