import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/providers";

/**
 * Fonts loaded once here and exposed as CSS variables that globals.css maps
 * into the Tailwind theme (`--font-sans` → font-sans, `--font-geist-mono` → font-mono).
 * Loading fonts at the root means they download exactly once for the whole app.
 */
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Site-wide metadata (the browser tab title + the description search engines
 * show). Every page can override parts of this with its own `export const metadata`.
 */
export const metadata: Metadata = {
  title: {
    default: "HireLoop — Find your dream job, faster",
    // %s is replaced by a page's own title, e.g. "Browse Jobs · HireLoop"
    template: "%s · HireLoop",
  },
  description:
    "HireLoop connects job seekers and employers — smart job search, company profiles, subscription plans, and a full recruiter toolkit.",
};

/**
 * ROOT LAYOUT — the outermost wrapper rendered on EVERY page.
 * It renders <html> and <body> (required exactly once per app) and mounts the
 * providers that pages depend on (auth context, toasts).
 *
 * The `dark` class switches the shadcn color tokens in globals.css to the
 * dark palette — matching the HireLoop Figma design, which is a dark UI.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "dark", // dark mode tokens for the whole app (see globals.css)
        "h-full",
        "antialiased", // smoother font rendering
        geistMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/*
          AuthProvider starts the "who am I?" check as soon as the app loads
          and shares the result with every page. ToastProvider lives inside it
          so any component can fire notifications.
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
