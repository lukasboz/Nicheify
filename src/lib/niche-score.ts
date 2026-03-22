import type { ScoringData, SpotifyArtist, SpotifyTrack } from "./spotify-api";
import { MAINSTREAM_GENRES } from "./genre-data";

export interface NicheResult {
  overallScore: number;
  tier: NicheTier;
  signals: SignalBreakdown;
  topGenres: GenreCount[];
  artistCount: number;
  trackCount: number;
  hasMonthlyListeners: boolean;
}

export interface SignalBreakdown {
  genreObscurity: SignalDetail;
  genreSpecificity: SignalDetail;
  artistDiversity: SignalDetail;
  releaseRecency: SignalDetail;
  crossTimeframeStability: SignalDetail;
  durationSignals: SignalDetail;
  monthlyListeners?: SignalDetail;
}

export interface SignalDetail {
  score: number;
  weight: number;
  label: string;
  description: string;
}

export interface GenreCount {
  genre: string;
  count: number;
  isMainstream: boolean;
}

export interface NicheTier {
  name: string;
  description: string;
  range: [number, number];
}

export interface MonthlyListenerData {
  [artistId: string]: number;
}

const TIERS: NicheTier[] = [
  {
    name: "Mainstream Maestro",
    description: "You ARE the algorithm",
    range: [0, 15],
  },
  {
    name: "Casual Explorer",
    description: "Dipping toes in the deep end",
    range: [16, 30],
  },
  {
    name: "Off the Beaten Path",
    description: "You know your way around",
    range: [31, 50],
  },
  {
    name: "Underground Regular",
    description: "Your Discover Weekly is confused",
    range: [51, 70],
  },
  {
    name: "Deep Digger",
    description: "Spotify's recommendation engine fears you",
    range: [71, 85],
  },
  {
    name: "Sonic Archaeologist",
    description: "You listen to music that doesn't exist yet",
    range: [86, 100],
  },
];

function getGenres(artist: SpotifyArtist): string[] {
  return artist.genres ?? [];
}

function computeGenreObscurity(artists: SpotifyArtist[]): number {
  if (!artists || artists.length === 0) return 50;

  const scores = artists.map((artist) => {
    const genres = getGenres(artist);
    if (genres.length === 0) return 1.0;
    const nonMainstream = genres.filter(
      (g) => !MAINSTREAM_GENRES.has(g.toLowerCase())
    ).length;
    return nonMainstream / genres.length;
  });

  return (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
}

function computeGenreSpecificity(artists: SpotifyArtist[]): number {
  if (!artists || artists.length === 0) return 50;
  const allGenres = artists.flatMap((a) => getGenres(a));
  if (allGenres.length === 0) return 50;

  const specificities = allGenres.map((genre) => {
    return genre.split(/[\s-]+/).length;
  });

  const avg =
    specificities.reduce((a, b) => a + b, 0) / specificities.length;
  return Math.min(100, Math.max(0, ((avg - 1) / 3) * 100));
}

function computeArtistDiversity(artists: SpotifyArtist[]): number {
  if (!artists || artists.length === 0) return 0;
  const allGenres = new Set(artists.flatMap((a) => getGenres(a)));
  return Math.min(100, Math.max(0, ((allGenres.size - 3) / 77) * 100));
}

function computeReleaseRecency(tracks: SpotifyTrack[]): number {
  if (!tracks || tracks.length === 0) return 50;

  const years = tracks
    .filter((t) => t.album?.release_date)
    .map((t) => parseInt(t.album.release_date.substring(0, 4), 10))
    .filter((y) => !isNaN(y));

  if (years.length < 2) return 50;

  const mean = years.reduce((a, b) => a + b, 0) / years.length;
  const variance =
    years.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0) / years.length;
  const stddev = Math.sqrt(variance);

  return Math.min(100, (stddev / 20) * 100);
}

function computeCrossTimeframeStability(
  shortTermArtists: SpotifyArtist[],
  longTermArtists: SpotifyArtist[],
  genreObscurityScore: number
): number {
  if (!shortTermArtists?.length || !longTermArtists?.length) return 50;

  const shortIds = new Set(shortTermArtists.map((a) => a.id));
  const longIds = new Set(longTermArtists.map((a) => a.id));
  const overlap = [...shortIds].filter((id) => longIds.has(id)).length;
  const overlapRatio = overlap / shortIds.size;

  if (genreObscurityScore > 60) {
    return overlapRatio * 100;
  } else {
    return (1 - overlapRatio) * 60;
  }
}

function computeDurationSignals(
  tracks: SpotifyTrack[],
  _artists: SpotifyArtist[]
): number {
  if (!tracks || tracks.length === 0) return 50;

  const avgDuration =
    tracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / tracks.length;
  const standardDuration = 210000;
  const deviation = Math.abs(avgDuration - standardDuration) / standardDuration;

  const uniqueArtistIds = new Set(
    tracks.flatMap((t) => (t.artists ?? []).map((a) => a.id))
  );
  if (uniqueArtistIds.size === 0) return 50;
  const tracksPerArtist = tracks.length / uniqueArtistIds.size;

  const explorationScore = Math.min(
    100,
    Math.max(0, ((1 / tracksPerArtist) * 2 - 0.5) * 100)
  );
  const durationScore = Math.min(100, deviation * 200);

  return durationScore * 0.4 + explorationScore * 0.6;
}

function computeMonthlyListenersScore(
  artists: SpotifyArtist[],
  monthlyListeners: MonthlyListenerData
): number | null {
  const scores: number[] = [];
  for (const artist of artists) {
    const listeners = monthlyListeners[artist.id];
    if (listeners !== undefined && listeners > 0) {
      const logScore =
        100 -
        ((Math.log10(listeners) - 3) / (Math.log10(80_000_000) - 3)) * 100;
      scores.push(Math.min(100, Math.max(0, logScore)));
    }
  }
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function applySigmoidCurve(
  x: number,
  midpoint = 50,
  steepness = 0.08
): number {
  return 100 / (1 + Math.exp(-steepness * (x - midpoint)));
}

function getTier(score: number): NicheTier {
  return (
    TIERS.find((t) => score >= t.range[0] && score <= t.range[1]) || TIERS[0]
  );
}

function getTopGenres(artists: SpotifyArtist[], limit = 15): GenreCount[] {
  const counts = new Map<string, number>();
  artists.forEach((a) =>
    getGenres(a).forEach((g) => counts.set(g, (counts.get(g) || 0) + 1))
  );
  return Array.from(counts.entries())
    .map(([genre, count]) => ({
      genre,
      count,
      isMainstream: MAINSTREAM_GENRES.has(genre.toLowerCase()),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function calculateNicheScore(
  data: ScoringData,
  monthlyListeners?: MonthlyListenerData
): NicheResult {
  const primaryArtists = data.artists?.medium_term ?? [];
  const primaryTracks = data.tracks?.medium_term ?? [];

  const genreObscurityRaw = computeGenreObscurity(primaryArtists);
  const genreSpecificityRaw = computeGenreSpecificity(primaryArtists);
  const artistDiversityRaw = computeArtistDiversity(primaryArtists);
  const releaseRecencyRaw = computeReleaseRecency(primaryTracks);
  const stabilityRaw = computeCrossTimeframeStability(
    data.artists?.short_term ?? [],
    data.artists?.long_term ?? [],
    genreObscurityRaw
  );
  const durationRaw = computeDurationSignals(primaryTracks, primaryArtists);
  const monthlyListenersRaw = monthlyListeners
    ? computeMonthlyListenersScore(primaryArtists, monthlyListeners)
    : null;

  const hasML = monthlyListenersRaw !== null;

  const signals: SignalBreakdown = {
    genreObscurity: {
      score: Math.round(genreObscurityRaw),
      label: "Genre Obscurity",
      weight: hasML ? 0.25 : 0.4,
      description: "How obscure the genres of your top artists are",
    },
    genreSpecificity: {
      score: Math.round(genreSpecificityRaw),
      label: "Genre Specificity",
      weight: hasML ? 0.1 : 0.15,
      description: "How specific and niche your genre tags are",
    },
    artistDiversity: {
      score: Math.round(artistDiversityRaw),
      label: "Genre Diversity",
      weight: hasML ? 0.1 : 0.15,
      description: "How many different micro-genres you explore",
    },
    releaseRecency: {
      score: Math.round(releaseRecencyRaw),
      label: "Catalog Depth",
      weight: hasML ? 0.05 : 0.1,
      description: "How widely you explore across release years",
    },
    crossTimeframeStability: {
      score: Math.round(stabilityRaw),
      label: "Taste Consistency",
      weight: hasML ? 0.1 : 0.1,
      description: "How your listening taste persists over time",
    },
    durationSignals: {
      score: Math.round(durationRaw),
      label: "Listening Patterns",
      weight: hasML ? 0.05 : 0.1,
      description: "Track length and artist exploration patterns",
    },
  };

  if (hasML) {
    signals.monthlyListeners = {
      score: Math.round(monthlyListenersRaw!),
      label: "Monthly Listeners",
      weight: 0.35,
      description: "How few monthly listeners your artists have",
    };
  }

  let rawScore = 0;
  for (const signal of Object.values(signals)) {
    if (signal) {
      rawScore += signal.score * signal.weight;
    }
  }

  const finalScore = Math.round(applySigmoidCurve(rawScore));
  const tier = getTier(finalScore);

  const allArtists = [
    ...(data.artists?.short_term ?? []),
    ...(data.artists?.medium_term ?? []),
    ...(data.artists?.long_term ?? []),
  ];
  const uniqueArtistMap = new Map(allArtists.map((a) => [a.id, a]));

  return {
    overallScore: finalScore,
    tier,
    signals,
    topGenres: getTopGenres([...uniqueArtistMap.values()]),
    artistCount: primaryArtists.length,
    trackCount: primaryTracks.length,
    hasMonthlyListeners: hasML,
  };
}
