"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { NicheTier } from "@/lib/niche-score";

interface NicheScoreProps {
  score: number;
  tier: NicheTier;
}

export default function NicheScore({ score, tier }: NicheScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="relative w-56 h-56 sm:w-64 sm:h-64">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <defs>
            <linearGradient
              id="scoreGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#1DB954" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
          </defs>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--score-ring-bg)"
            strokeWidth="8"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-[1500ms] ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-[family-name:var(--font-space-grotesk)] text-6xl sm:text-7xl font-bold">
            {displayScore}
          </span>
          <span className="text-themed-tertiary text-sm mt-1">/ 100</span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl sm:text-3xl font-bold gradient-text">
          {tier.name}
        </h2>
        <p className="text-themed-secondary mt-2 text-lg">{tier.description}</p>
      </div>
    </motion.div>
  );
}
