"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  exchangeCodeForToken,
  hasValidToken,
  AuthError,
} from "@/lib/spotify-auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode —
    // Spotify authorization codes are single-use, so a second
    // exchange attempt would fail.
    if (handledRef.current) return;
    handledRef.current = true;

    async function handleCallback() {
      // If we already have a valid token (e.g. from the first Strict Mode run),
      // skip straight to results
      if (hasValidToken()) {
        router.replace("/results");
        return;
      }

      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const spotifyError = searchParams.get("error");

      if (spotifyError) {
        setError(
          spotifyError === "access_denied"
            ? "You denied access to your Spotify account. We need permission to read your top artists and tracks to calculate your Niche Score."
            : `Spotify authorization error: ${spotifyError}`
        );
        return;
      }

      if (!code || !state) {
        setError("Missing authorization parameters. Please try again.");
        return;
      }

      try {
        await exchangeCodeForToken(code, state);
        router.replace("/results");
      } catch (err) {
        // If the exchange failed but we already have a valid token
        // (e.g. a prior Strict Mode mount succeeded), just redirect.
        if (hasValidToken()) {
          router.replace("/results");
          return;
        }
        if (err instanceof AuthError) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred during authentication.");
        }
      }
    }

    handleCallback();
  }, [searchParams, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-themed-secondary text-sm mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spotify-green text-black font-semibold hover:bg-spotify-green-light transition-colors"
          >
            Try Again
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        <p className="text-themed-secondary text-sm">Connecting to Spotify...</p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
