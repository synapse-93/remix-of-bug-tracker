import { bugzillaConfig, isBugzillaConfigured } from "./config";

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
};

/** Thin fetch wrapper for the Bugzilla REST API. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!isBugzillaConfigured()) {
    throw new ApiError("Bugzilla API URL is not configured (VITE_BUGZILLA_API_URL).");
  }

  const url = new URL(`${bugzillaConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (bugzillaConfig.apiKey) headers["X-BUGZILLA-API-KEY"] = bugzillaConfig.apiKey;

  const response = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const message =
      (payload as { message?: string } | null)?.message ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
