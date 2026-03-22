"use client";

import { motion } from "framer-motion";
import type { ShareData } from "@/lib/share";
import type { NicheResult } from "@/lib/niche-score";

interface CompareViewProps {
  yours: NicheResult;
  theirs: ShareData;
}

const SIGNAL_LABELS: Record<string, string> = {
  genreObscurity: "Genre Obscurity",
  genreSpecificity: "Genre Specificity",
  artistDiversity: "Genre Diversity",
  releaseRecency: "Catalog Depth",
  crossTimeframeStability: "Taste Consistency",
  durationSignals: "Listening Patterns",
  monthlyListeners: "Monthly Listeners",
};

export default function CompareView({ yours, theirs }: CompareViewProps) {
  const diff = yours.overallScore - theirs.s;
  const youWin = diff > 0;
  const tie = diff === 0;

  return (
    <motion.div
      className="glass-card p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-center mb-6">
        Score Comparison
      </h3>

      {/* Score face-off */}
      <div className="flex items-center justify-center gap-6 sm:gap-12 mb-8">
        {/* Your score */}
        <div className="text-center">
          <p className="text-sm text-themed-secondary mb-1">You</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold gradient-text">
            {yours.overallScore}
          </p>
          <p className="text-xs text-themed-tertiary mt-1">{yours.tier.name}</p>
        </div>

        {/* VS */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-bold text-themed-muted">VS</span>
        </div>

        {/* Their score */}
        <div className="text-center">
          <p className="text-sm text-themed-secondary mb-1">Friend</p>
          <p className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold text-themed-secondary">
            {theirs.s}
          </p>
          <p className="text-xs text-themed-tertiary mt-1">{theirs.t}</p>
        </div>
      </div>

      {/* Verdict */}
      <div className="text-center mb-8">
        <p className="text-lg font-semibold">
          {tie
            ? "It's a tie! You're equally niche."
            : youWin
              ? `You're ${Math.abs(diff)} points more niche!`
              : `Your friend is ${Math.abs(diff)} points more niche!`}
        </p>
      </div>

      {/* Signal comparison bars */}
      <div className="space-y-4">
        {Object.entries(theirs.sg).map(([key, theirScore]) => {
          const yourSignal = yours.signals[key as keyof typeof yours.signals];
          const yourScore = yourSignal?.score ?? 0;
          const label = SIGNAL_LABELS[key] || key;

          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-themed-secondary">{label}</span>
                <span className="text-themed-tertiary">
                  {yourScore} vs {theirScore}
                </span>
              </div>
              <div className="flex gap-1 h-2">
                {/* Your bar */}
                <div className="flex-1 rounded-full bg-themed-elevated overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-spotify-green to-emerald-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${yourScore}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
                {/* Their bar */}
                <div className="flex-1 rounded-full bg-themed-elevated overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-zinc-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${theirScore}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-themed-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-full bg-gradient-to-r from-spotify-green to-emerald-400" />
          You
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-full bg-zinc-500" />
          Friend
        </div>
      </div>
    </motion.div>
  );
}
