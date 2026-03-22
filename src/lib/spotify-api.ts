import { getAccessToken, refreshAccessToken } from "./spotify-auth";

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: SpotifyImage[];
  external_urls: { spotify: string };
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: string;
  images: SpotifyImage[];
  album_type: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  explicit: boolean;
  external_urls: { spotify: string };
  disc_number: number;
  track_number: number;
  uri: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string | null;
  previous: string | null;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export class SpotifyApiError extends Error {
  status: number;
  body?: string;
  constructor(message: string, status: number, body?: string) {
    super(message);
    this.name = "SpotifyApiError";
    this.status = status;
    this.body = body;
  }
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function spotifyFetch<T>(url: string, retryCount = 0): Promise<T> {
  let token = getAccessToken();

  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      throw new SpotifyApiError(
        "Authentication expired. Please log in again.",
        401
      );
    }
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 429) {
    if (retryCount >= MAX_RETRIES) {
      throw new SpotifyApiError(
        "Rate limited by Spotify. Please try again later.",
        429
      );
    }
    const retryAfter = parseInt(
      response.headers.get("Retry-After") || "1",
      10
    );
    const delay = Math.max(
      retryAfter * 1000,
      BASE_DELAY_MS * Math.pow(2, retryCount)
    );
    const jitter = delay * (0.8 + Math.random() * 0.4);
    await sleep(jitter);
    return spotifyFetch<T>(url, retryCount + 1);
  }

  if (response.status === 401 && retryCount === 0) {
    try {
      await refreshAccessToken();
      return spotifyFetch<T>(url, retryCount + 1);
    } catch {
      throw new SpotifyApiError(
        "Authentication expired. Please log in again.",
        401
      );
    }
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let message = `Spotify API error: ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      // use default message
    }
    throw new SpotifyApiError(message, response.status, errorBody);
  }

  return response.json();
}

export async function getTopArtists(
  timeRange: TimeRange = "medium_term",
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<SpotifyArtist>> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
    offset: String(offset),
  });
  return spotifyFetch(
    `https://api.spotify.com/v1/me/top/artists?${params}`
  );
}

export async function getTopTracks(
  timeRange: TimeRange = "medium_term",
  limit = 50,
  offset = 0
): Promise<PaginatedResponse<SpotifyTrack>> {
  const params = new URLSearchParams({
    time_range: timeRange,
    limit: String(limit),
    offset: String(offset),
  });
  return spotifyFetch(
    `https://api.spotify.com/v1/me/top/tracks?${params}`
  );
}

export interface ScoringData {
  artists: Record<TimeRange, SpotifyArtist[]>;
  tracks: Record<TimeRange, SpotifyTrack[]>;
}

export async function fetchAllScoringData(): Promise<ScoringData> {
  const [
    shortTermArtists,
    mediumTermArtists,
    longTermArtists,
    shortTermTracks,
    mediumTermTracks,
    longTermTracks,
  ] = await Promise.all([
    getTopArtists("short_term", 50),
    getTopArtists("medium_term", 50),
    getTopArtists("long_term", 50),
    getTopTracks("short_term", 50),
    getTopTracks("medium_term", 50),
    getTopTracks("long_term", 50),
  ]);

  return {
    artists: {
      short_term: shortTermArtists.items ?? [],
      medium_term: mediumTermArtists.items ?? [],
      long_term: longTermArtists.items ?? [],
    },
    tracks: {
      short_term: shortTermTracks.items ?? [],
      medium_term: mediumTermTracks.items ?? [],
      long_term: longTermTracks.items ?? [],
    },
  };
}
