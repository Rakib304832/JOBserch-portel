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
 * This layout is a Server Component: it renders no interactivity itself
 * (Navbar is its own client component), so it ships no JavaScript of its own.
 */

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

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
