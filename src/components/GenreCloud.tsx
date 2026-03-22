"use client";

import { motion } from "framer-motion";
import type { GenreCount } from "@/lib/niche-score";

interface GenreCloudProps {
  genres: GenreCount[];
}

export default function GenreCloud({ genres }: GenreCloudProps) {
  if (genres.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold mb-4">
        Your Genres
      </h3>
      <div className="flex flex-wrap gap-2">
        {genres.map((g, i) => (
          <motion.span
            key={g.genre}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              g.isMainstream
                ? "border-themed-border-strong"
                : "bg-spotify-green/10 text-spotify-green border-spotify-green/20"
            }`}
            style={
              g.isMainstream
                ? {
                    backgroundColor: "var(--genre-mainstream-bg)",
                    color: "var(--genre-mainstream-text)",
                  }
                : undefined
            }
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 + i * 0.03 }}
          >
            {g.genre}
            <span className="ml-1.5 text-xs opacity-60">{g.count}</span>
          </motion.span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-themed-muted">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--genre-mainstream-text)" }}
          />
          Mainstream
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-spotify-green" />
          Obscure
        </div>
      </div>
    </motion.div>
  );
}
