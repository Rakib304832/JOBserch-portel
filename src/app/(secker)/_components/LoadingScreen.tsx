/**
 * ==================================================================
 *  LOADING SCREEN — src/app/(secker)/_components/LoadingScreen.tsx
 * ==================================================================
 *  The full-page "checking your session" state. It is used twice:
 *    1. as the <Suspense> fallback while the gate component loads,
 *    2. as the visible state during the first `/api/me` request.
 *
 *  No hooks or event handlers here, so it can render on the server too.
 * ==================================================================
 */

import { LoaderCircle } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink">
      <LoaderCircle className="size-7 animate-spin text-brand-violet" />
      <p className="text-sm text-muted-foreground">Checking your session…</p>
    </div>
  );
}
