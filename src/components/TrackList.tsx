"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { SpotifyTrack } from "@/lib/spotify-api";

interface TrackListProps {
  tracks: SpotifyTrack[];
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TrackList({ tracks }: TrackListProps) {
  if (tracks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 1.0 }}
    >
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold mb-4">
        Your Top Tracks
      </h3>
      <div className="space-y-1">
        {tracks.slice(0, 20).map((track, i) => {
          const albumImages = track.album?.images ?? [];
          const albumImage = albumImages[albumImages.length - 1]?.url;
          return (
            <motion.a
              key={track.id}
              href={track.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-3 rounded-lg transition-colors group"
              style={{ ["--hover-bg" as string]: "var(--surface-hover)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--surface-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.1 + i * 0.03 }}
            >
              <span className="text-sm text-themed-muted w-6 text-right tabular-nums">
                {i + 1}
              </span>
              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-themed-elevated flex-shrink-0">
                {albumImage ? (
                  <Image
                    src={albumImage}
                    alt={track.album?.name || "Album"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full bg-themed-elevated" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-spotify-green transition-colors">
                  {track.name}
                </p>
                <p className="text-xs text-themed-tertiary truncate">
                  {(track.artists ?? []).map((a) => a.name).join(", ")}
                </p>
              </div>
              <span className="text-xs text-themed-muted tabular-nums flex-shrink-0">
                {formatDuration(track.duration_ms || 0)}
              </span>
            </motion.a>
          );
        })}
      </div>
    </motion.div>
  );
}
