"use client";

import { motion } from "framer-motion";
import type { SignalBreakdown } from "@/lib/niche-score";

interface StatBreakdownProps {
  signals: SignalBreakdown;
}

interface StatCardProps {
  label: string;
  score: number;
  weight: number;
  description: string;
  index: number;
}

function StatCard({ label, score, weight, description, index }: StatCardProps) {
  return (
    <motion.div
      className="glass-card p-5 sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-themed-secondary">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-themed-muted">
            {Math.round(weight * 100)}% weight
          </span>
          <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
            {score}
          </span>
        </div>
      </div>
      <div className="stat-bar">
        <motion.div
          className="stat-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{
            duration: 1,
            delay: 0.3 + index * 0.08,
            ease: "easeOut",
          }}
        />
      </div>
      <p className="text-xs text-themed-tertiary mt-3">{description}</p>
    </motion.div>
  );
}

export default function StatBreakdown({ signals }: StatBreakdownProps) {
  const signalEntries = Object.values(signals).filter(
    (s): s is NonNullable<typeof s> => s !== undefined
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {signalEntries.map((signal, i) => (
        <StatCard
          key={signal.label}
          label={signal.label}
          score={signal.score}
          weight={signal.weight}
          description={signal.description}
          index={i}
        />
      ))}
    </div>
  );
}
