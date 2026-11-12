/**
 * ============================================================================
 * api-client.ts — the browser's tiny "telephone" to the server
 * ============================================================================
 *
 * Every dashboard page does the same dance:
 *      1. fetch("/api/something")
 *      2. parse JSON
 *      3. if the server said { error: … }, surface it nicely
 *      4. otherwise hand the data to React
 *
 * Instead of copy-pasting that in 20 places, this file wraps it once.
 * The rest of the app calls:
 *
 *      const jobs = await apiFetch("/api/jobs?type=Remote");
 *      await apiFetch("/api/saved-jobs", { method: "POST", body: { jobId } });
 * ============================================================================
 */

/**
 * Call an API route and return the parsed JSON.
 * Throws an Error whose message is the server's error text, so `catch`
 * blocks can show it directly in a toast.
 */
export async function apiFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  // fetch() is the browser's built-in HTTP function.
  const res = await fetch(path, {
    method: init.method ?? "GET",
    // Same-origin requests include cookies (our session) automatically.
    // 'omit' would log the user out of every call — the opposite of what
    // we want — so we explicitly say "keep cookies".
    credentials: "same-origin",
    headers: init.body ? { "Content-Type": "application/json" } : undefined,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  // Try to read the JSON body. Even error responses usually carry one.
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. a crash page) → fall through to the error below.
  }

  if (!res.ok) {
    // res.ok is true only for 2xx statuses (200, 201…). Anything else is an
    // error the caller should know about, with the server's message.
    const message =
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}
