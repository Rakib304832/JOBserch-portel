/**
 * ==================================================================
 *  API CLIENT — src/app/(secker)/_lib/api.ts
 * ==================================================================
 *  WHAT IS THIS FILE?
 *  One small "telephone" the whole dashboard uses to talk to the
 *  Express server. Instead of writing `fetch(...)`, checking the status
 *  code and parsing JSON in every page, each page calls:
 *
 *      const data = await api<MeResponse>("/me");
 *
 *  HOW THE CALL TRAVELS
 *  1. `api("/me")` requests `/api/backend/me` on port 3000.
 *  2. next.config.ts rewrites that to `http://localhost:5000/api/me`.
 *  3. The browser automatically attaches the `token` cookie, because the
 *     request goes to the same origin it was logged in on.
 *  4. The server answers `{ ok: true, ... }` or `{ ok: false, message }`.
 *
 *  WHY `credentials: "include"`?
 *  It tells the browser "send cookies with this request". Without it a
 *  fetch() omits the login cookie and every protected endpoint would
 *  answer 401.
 *
 *  WHY `cache: "no-store"`?
 *  Dashboard numbers must always be fresh. Without it Next.js could
 *  reuse an old response and show stale applications.
 * ==================================================================
 */

/** The proxy prefix configured in next.config.ts. */
export const API_BASE = "/api/backend";

/**
 * ApiError — an Error with the HTTP status attached.
 * Pages can check `error.status === 401` to know the session expired,
 * or `402` to show the "upgrade your plan" hint.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** The options `api()` accepts (a tiny subset of fetch's own options). */
type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown; // plain object -> JSON; undefined -> no body
  signal?: AbortSignal; // lets a page cancel an outdated search
};

/**
 * api — call the server and return the parsed JSON.
 *
 * @param path  the API path WITHOUT the proxy prefix, e.g. "/jobs?limit=3"
 * @throws ApiError when the server answers 4xx/5xx, with the server's own
 *         message so the UI can show "Your Free plan allows 3 applications…"
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const hasBody = options.body !== undefined;

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    // Cookies carry the JWT login token.
    credentials: "include",
    // Never reuse a cached dashboard response.
    cache: "no-store",
    // Only send a JSON content-type when there really is a JSON body.
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  // Read the body once. `.catch` covers the rare empty/non-JSON response
  // (for example a proxy error page) so we still produce a useful message.
  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return data as T;
}

/**
 * apiUpload — same idea as `api()`, but for files.
 *
 * WHY A SEPARATE FUNCTION:
 * `JSON.stringify()` cannot encode a file. Browsers send files as
 * `FormData` (multipart/form-data) and set the boundary header themselves,
 * so we must NOT set "Content-Type" manually here.
 *
 * Used by Settings to upload a resume:
 *   const form = new FormData();
 *   form.append("file", pdfFile);
 *   await apiUpload("/upload?folder=resumes", form);
 */
export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: form,
  });

  const data = (await response.json().catch(() => null)) as
    | { message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(
      data?.message ?? `Upload failed with status ${response.status}.`,
      response.status
    );
  }

  return data as T;
}

/**
 * toQuery — turn an object into a URL query string.
 *
 * Example:
 *   toQuery({ q: "react", page: 2, type: undefined })
 *   -> "?q=react&page=2"
 *
 * Empty values are skipped so the URL never contains "type=undefined".
 */
export function toQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * errorMessage — safely pull a readable message out of an unknown error.
 * `catch` gives us `unknown` in TypeScript, so this helper avoids
 * repeating `err instanceof Error ? err.message : "…"` everywhere.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
