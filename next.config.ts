import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,

    /**
     * The seeker dashboard (src/app/(secker)) is login-gated and loads its
     * data in the browser, so a fully static "instant" shell is impossible
     * by design: the page must first know who is logged in.
     *
     * `manual-warning` stops Next.js from logging an instant-navigation
     * insight on every dashboard request. Pages that DO want the check can
     * still opt in with `export const instant = true`.
     */
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /**
   * ==================================================================
   *  REDIRECTS
   * ==================================================================
   *  `/secker` is the entrance to the dashboard, but the overview lives at
   *  `/secker/dashbord`. A redirect in the config is handled by Next.js
   *  BEFORE any page renders, so the browser receives a proper 307 and the
   *  URL updates immediately.
   *
   *  WHY NOT `redirect()` INSIDE A PAGE?
   *  With Cache Components + partial prefetching, a tiny redirect page can
   *  be "dropped" from the prerendered shell, and then the redirect never
   *  runs. A config redirect has no such race.
   * ==================================================================
   */
  async redirects() {
    return [
      {
        source: "/secker",
        destination: "/secker/dashbord",
        permanent: false, // 307: temporary, keeps the browser from caching it forever
      },
    ];
  },

  /**
   * ==================================================================
   *  API PROXY (rewrites)
   * ==================================================================
   *  The Express API runs on http://localhost:5000 while this Next.js
   *  client runs on http://localhost:3000. Two ports = two different
   *  origins, so a cookie set by port 5000 is never sent to port 3000 and
   *  CORS would have to be relaxed.
   *
   *  A rewrite fixes that without touching the API. The browser calls OUR
   *  domain and Next.js quietly forwards the request on the server:
   *
   *     browser  ->  /api/backend/me            (same origin, cookie sent)
   *     Next.js  ->  http://localhost:5000/api/me
   *
   *  The "/api/backend" prefix is deliberate: this project already has
   *  Next.js routes under /api/auth, /api/jobs, /api/saved-jobs … (the
   *  public demo site), so proxying the API at /api directly would shadow
   *  them. The dashboard is the only consumer of /api/backend.
   *
   *  Uploaded files (`/uploads/...`) are proxied too, because the API
   *  stores relative paths (a resume URL, for example) that would
   *  otherwise point at port 3000 and 404.
   * ==================================================================
   */
  async rewrites() {
    // One place to change the API location. Override it with the
    // API_SERVER_URL environment variable when the server is deployed.
    const apiServer = process.env.API_SERVER_URL ?? "http://localhost:5000";

    return [
      // /api/backend/jobs  ->  http://localhost:5000/api/jobs
      {
        source: "/api/backend/:path*",
        destination: `${apiServer}/api/:path*`,
      },
      // /uploads/resumes/cv.pdf  ->  http://localhost:5000/uploads/resumes/cv.pdf
      {
        source: "/uploads/:path*",
        destination: `${apiServer}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
