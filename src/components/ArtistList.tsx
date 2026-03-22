"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { SpotifyArtist } from "@/lib/spotify-api";
import { MAINSTREAM_GENRES } from "@/lib/genre-data";

interface ArtistListProps {
  artists: SpotifyArtist[];
  monthlyListeners?: Record<string, number>;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ArtistList({
  artists,
  monthlyListeners,
}: ArtistListProps) {
  if (artists.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold mb-4">
        Your Top Artists
      </h3>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {artists.slice(0, 20).map((artist, i) => {
          const imageUrl = artist.images?.[0]?.url;
          const genres = artist.genres ?? [];
          const obscureGenres = genres.filter(
            (g) => !MAINSTREAM_GENRES.has(g.toLowerCase())
          );
          const listeners = monthlyListeners?.[artist.id];

          return (
            <motion.a
              key={artist.id}
              href={artist.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-4 flex-shrink-0 w-44 transition-colors group"
              style={{ ["--tw-bg-opacity" as string]: 1 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.05 }}
            >
              <div className="relative w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden bg-themed-elevated">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={artist.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="128px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-themed-muted">
                    <svg
                      className="w-12 h-12"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-center truncate">
                {artist.name}
              </p>
              {listeners && (
                <p className="text-xs text-themed-tertiary text-center mt-1">
                  {formatNumber(listeners)} monthly
                </p>
              )}
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {genres.slice(0, 2).map((g) => (
                  <span
                    key={g}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      MAINSTREAM_GENRES.has(g.toLowerCase())
                        ? "bg-themed-elevated text-themed-tertiary"
                        : "bg-spotify-green/10 text-spotify-green/80"
                    }`}
                  >
                    {g}
                  </span>
                ))}
                {obscureGenres.length > 2 && (
                  <span className="text-[10px] text-themed-muted">
                    +{obscureGenres.length - 2}
                  </span>
                )}
              </div>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}
