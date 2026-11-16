/**
 * (public)/layout.tsx — shared chrome for every PUBLIC page:
 * the sticky Navbar on top, the Footer at the bottom, and the page content
 * in between (that's the `children` slot).
 *
 * WHY A ROUTE GROUP?
 * Folders in (parentheses) don't affect the URL — (public)/jobs still serves
 * /jobs. Groups exist purely to give different parts of the site different
 * LAYOUTS: public pages get navbar+footer, dashboard pages get a sidebar
 * instead, without duplicating anything.
 *
 * WHICH PAGES LIVE IN THIS GROUP
 *   /                     → page.tsx (landing)
 *   /jobs                 → jobs/page.tsx
 *   /jobs/[jobId]         → jobs/[jobId]/page.tsx
 *   /companies            → companies/page.tsx
 *   /companies/[companyId]→ companies/[companyId]/page.tsx
 *   /pricing              → pricing/page.tsx
 *   /checkout             → checkout/page.tsx
 *   /checkout/success     → checkout/success/page.tsx
 *
 * This layout is a Server Component: it renders no interactivity itself
 * (Navbar is its own client component), so it ships no JavaScript of its own.
 */

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // flex + flex-col + flex-1 child makes the footer stick to the bottom of
    // the viewport even on short pages (classic "sticky footer" trick).
    <>
      <Navbar />
      {/* flex-1 = take up all remaining vertical space above the footer */}
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
