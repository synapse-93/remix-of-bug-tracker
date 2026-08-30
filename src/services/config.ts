/**
 * Frontend data-layer configuration.
 *
 * The application data will be served by an existing Bugzilla backend.
 * Set VITE_BUGZILLA_API_URL (and optionally VITE_BUGZILLA_API_KEY) to point
 * the frontend at that backend. No Supabase usage belongs in this layer.
 */
export const bugzillaConfig = {
  baseUrl: (import.meta.env.VITE_BUGZILLA_API_URL as string | undefined)?.replace(/\/$/, "") ?? "",
  apiKey: (import.meta.env.VITE_BUGZILLA_API_KEY as string | undefined) ?? "",
};

export const isBugzillaConfigured = () => Boolean(bugzillaConfig.baseUrl);
