"use client";

/**
 * ==================================================================
 *  APPLY DIALOG — src/app/(secker)/_components/ApplyDialog.tsx
 * ==================================================================
 *  WHAT IS THIS?
 *  The small modal that opens when a seeker clicks "Apply". It shows
 *  which job they are applying to and lets them add an optional cover
 *  letter before the request is sent.
 *
 *  HOW IT WORKS
 *  1. The page opens it by rendering `<ApplyDialog job={job} … />`.
 *  2. The user types a cover letter (0–2000 characters, matching the
 *     server's validator).
 *  3. Submit calls `onSubmit(coverLetter)` — the PAGE owns the API call,
 *     so it can refresh its own lists and show the result where the list
 *     lives. The dialog only handles the form and its pending state.
 *  4. On success the page closes the dialog; on error the dialog shows
 *     the server's message (e.g. "plan limit reached").
 * ==================================================================
 */

import { useState } from "react";
import { CircleX, LoaderCircle, Send, X } from "lucide-react";
import type { Job } from "../_lib/types";
import { errorMessage } from "../_lib/api";

export function ApplyDialog({
  job,
  onClose,
  onSubmit,
}: {
  job: Job;
  onClose: () => void;
  onSubmit: (coverLetter: string) => Promise<void>;
}) {
  // The textarea value. Empty is allowed — a cover letter is optional.
  const [coverLetter, setCoverLetter] = useState("");

  // True while the network request is in flight (disables the buttons).
  const [submitting, setSubmitting] = useState(false);

  // The last error message from the server, shown inside the dialog.
  const [error, setError] = useState("");

  /** Handle the form submit: validate locally, then delegate to the page. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser's full-page reload

    setError("");

    // The server also checks this, but stopping here saves a round trip.
    if (coverLetter.length > 2000) {
      setError("Keep the cover letter under 2000 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(coverLetter.trim());
    } catch (err) {
      // The page re-throws API errors so we can print the real reason.
      setError(errorMessage(err));
    } finally {
      // Always unlock the form, even when the request failed.
      setSubmitting(false);
    }
  }

  return (
    <div
      // A full-screen transparent layer: clicking outside the card closes it.
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        // `stopPropagation` keeps clicks inside the card from closing it.
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-dialog-title"
        className="w-full max-w-lg rounded-2xl border border-line bg-panel p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-violet">
              Apply to this role
            </p>

            <h2
              id="apply-dialog-title"
              className="mt-1 text-xl font-semibold text-white"
            >
              {job.title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {job.company?.name}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-elevated hover:text-white"
            aria-label="Close apply dialog"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-white">
              Cover letter{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </span>

            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Tell the recruiter why you are a good fit — two or three sentences go a long way."
              className="mt-2 w-full resize-none rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-white placeholder:text-muted-foreground/60 focus:border-brand-violet focus:outline-none"
            />

            {/* Live character counter, matching the server limit. */}
            <span className="mt-1 block text-right text-xs text-muted-foreground">
              {coverLetter.length}/2000
            </span>
          </label>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              <CircleX className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {/* Plan limits are enforced by the server; this note sets expectations. */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Your application counts towards this month&apos;s plan quota. You can only
            apply to each job once.
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-elevated disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4d6bff] to-[#7c5cff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-8px_#5a6bff] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
