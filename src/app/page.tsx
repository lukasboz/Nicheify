"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initiateLogin, hasValidToken } from "@/lib/spotify-auth";
import { decodeShareData, storeCompareData, type ShareData } from "@/lib/share";
import ThemeToggle from "@/components/ThemeToggle";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [compareData, setCompareData] = useState<ShareData | null>(null);

  useEffect(() => {
    // Check for compare parameter
    const compareParam = searchParams.get("c");
    if (compareParam) {
      const data = decodeShareData(compareParam);
      if (data) {
        setCompareData(data);
        storeCompareData(data);
      }
    }

    if (hasValidToken()) {
      router.replace("/results");
    } else {
      setChecking(false);
    }
  }, [router, searchParams]);

  if (checking) return null;

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[800px] h-[800px] rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: "var(--glow-color)" }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, var(--surface) 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
        {/* Compare challenge banner */}
        {compareData && (
          <div className="mb-6 glass-card px-6 py-4 text-center">
            <p className="text-sm text-themed-secondary mb-1">
              Your friend scored
            </p>
            <p className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold gradient-text">
              {compareData.s}/100
            </p>
            <p className="text-sm text-themed-tertiary mt-1">
              &ldquo;{compareData.t}&rdquo;
            </p>
          </div>
        )}

        {/* Pill badge */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-themed-border bg-themed-card text-sm text-themed-secondary">
          Your music taste, quantified
        </div>

        {/* Headline */}
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          {compareData ? (
            <>
              Can you{" "}
              <span className="gradient-text">beat their score</span>?
            </>
          ) : (
            <>
              How niche is your{" "}
              <span className="gradient-text">music taste</span>?
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-themed-secondary max-w-md mb-10 leading-relaxed">
          {compareData
            ? "Connect your Spotify to see who has the more underground taste."
            : "Connect your Spotify account to discover your Niche Score \u2014 a breakdown of how underground your listening really is."}
        </p>

        {/* CTA Button */}
        <button
          onClick={() => initiateLogin()}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-spotify-green text-black font-semibold text-lg transition-all hover:bg-spotify-green-light hover:scale-105 hover:shadow-[0_0_40px_rgba(29,185,84,0.3)] active:scale-100"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          {compareData ? "Connect & Compare" : "Connect with Spotify"}
        </button>

        {/* Disclaimer */}
        <p className="mt-8 text-xs text-themed-muted max-w-sm">
          We only read your top artists and tracks. No data is stored. Your
          listening data never leaves your browser.
        </p>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-themed-faint">
        Built for fun :)
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
