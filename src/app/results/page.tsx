"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { hasValidToken, clearAuth } from "@/lib/spotify-auth";
import {
  fetchAllScoringData,
  SpotifyApiError,
  type ScoringData,
  type TimeRange,
} from "@/lib/spotify-api";
import {
  calculateNicheScore,
  type NicheResult,
  type MonthlyListenerData,
} from "@/lib/niche-score";
import { getStoredCompareData, clearCompareData, type ShareData } from "@/lib/share";
import NicheScore from "@/components/NicheScore";
import StatBreakdown from "@/components/StatBreakdown";
import GenreCloud from "@/components/GenreCloud";
import ArtistList from "@/components/ArtistList";
import TrackList from "@/components/TrackList";
import TimeRangeSelector from "@/components/TimeRangeSelector";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import ShareButton from "@/components/ShareButton";
import CompareView from "@/components/CompareView";
import ThemeToggle from "@/components/ThemeToggle";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      result: NicheResult;
      data: ScoringData;
      monthlyListeners?: MonthlyListenerData;
      compareData: ShareData | null;
    };

export default function ResultsPage() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [displayRange, setDisplayRange] = useState<TimeRange>("medium_term");

  const loadData = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const data = await fetchAllScoringData();

      // Try to fetch monthly listeners (optional)
      let monthlyListeners: MonthlyListenerData | undefined;
      try {
        const artistIds = data.artists.medium_term.map((a) => a.id);
        const response = await fetch("/api/monthly-listeners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artistIds }),
        });
        if (response.ok) {
          const { data: mlData } = await response.json();
          const filtered = Object.fromEntries(
            Object.entries(mlData).filter(
              ([, v]) => v !== null && v !== undefined
            )
          ) as MonthlyListenerData;
          if (Object.keys(filtered).length > 0) {
            monthlyListeners = filtered;
          }
        }
      } catch {
        // Monthly listeners are optional
      }

      const result = calculateNicheScore(data, monthlyListeners);
      const compareData = getStoredCompareData();

      setState({ status: "ready", result, data, monthlyListeners, compareData });
    } catch (err) {
      if (err instanceof SpotifyApiError && err.status === 401) {
        clearAuth();
        router.replace("/");
        return;
      }
      setState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
      });
    }
  }, [router]);

  useEffect(() => {
    if (!hasValidToken()) {
      router.replace("/");
      return;
    }
    loadData();
  }, [router, loadData]);

  if (state.status === "loading") {
    return <LoadingState />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={loadData} />;
  }

  const { result, data, monthlyListeners, compareData } = state;
  const displayArtists = data.artists[displayRange];
  const displayTracks = data.tracks[displayRange];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{
          backgroundColor: "var(--header-bg)",
          borderColor: "var(--border-themed)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a
            href="/"
            className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold gradient-text"
          >
            Nicheify
          </a>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => {
                clearAuth();
                clearCompareData();
                router.replace("/");
              }}
              className="text-sm text-themed-tertiary hover:text-themed-secondary transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* Score section */}
        <section className="flex flex-col items-center">
          <NicheScore score={result.overallScore} tier={result.tier} />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-themed-tertiary">
            <span>{result.artistCount} artists analyzed</span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: "var(--border-strong)" }}
            />
            <span>{result.trackCount} tracks analyzed</span>
            {result.hasMonthlyListeners && (
              <>
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "var(--border-strong)" }}
                />
                <span className="text-spotify-green/60">
                  Monthly listeners included
                </span>
              </>
            )}
          </div>
          {/* Share button */}
          <div className="mt-8">
            <ShareButton result={result} />
          </div>
        </section>

        {/* Compare view */}
        {compareData && (
          <section>
            <CompareView yours={result} theirs={compareData} />
          </section>
        )}

        {/* Stat breakdown */}
        <section>
          <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold mb-6">
            Score Breakdown
          </h3>
          <StatBreakdown signals={result.signals} />
        </section>

        {/* Genre Cloud */}
        <section>
          <GenreCloud genres={result.topGenres} />
        </section>

        {/* Time range selector */}
        <section className="flex flex-col items-center gap-6">
          <TimeRangeSelector value={displayRange} onChange={setDisplayRange} />
        </section>

        {/* Artists */}
        <section>
          <ArtistList
            artists={displayArtists}
            monthlyListeners={monthlyListeners}
          />
        </section>

        {/* Tracks */}
        <section>
          <TrackList tracks={displayTracks} />
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8"
        style={{ borderColor: "var(--border-themed)" }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-themed-faint">
          <p>
            Nicheify uses your Spotify listening data to calculate your Niche
            Score. No data is stored.
          </p>
        </div>
      </footer>
    </div>
  );
}
