export function normalizeBaseUrl(v: string | undefined): string {
  const t = v?.trim() ?? "";
  if (!t || /^\/+$/.test(t)) return "http://localhost:3000";
  if (/^https?:\/\//i.test(t)) {
    try {
      const parsed = new URL(t);
      if (!parsed.hostname) return "http://localhost:3000";
    } catch {
      return "http://localhost:3000";
    }
    return t;
  }
  return `http://${t}`;
}
