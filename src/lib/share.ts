import type { NicheResult } from "./niche-score";

export interface ShareData {
  s: number; // score
  t: string; // tier name
  g: string[]; // top 5 genres
  sg: Record<string, number>; // signal scores
}

export function encodeShareData(result: NicheResult): string {
  const data: ShareData = {
    s: result.overallScore,
    t: result.tier.name,
    g: result.topGenres.slice(0, 5).map((g) => g.genre),
    sg: {},
  };

  for (const [key, signal] of Object.entries(result.signals)) {
    if (signal) {
      data.sg[key] = signal.score;
    }
  }

  const json = JSON.stringify(data);
  // Use base64url encoding (URL-safe)
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShareData(encoded: string): ShareData | null {
  try {
    // Restore base64 padding
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const json = atob(base64);
    const data = JSON.parse(json);
    if (typeof data.s !== "number" || typeof data.t !== "string") {
      return null;
    }
    return data as ShareData;
  } catch {
    return null;
  }
}

export function getShareUrl(result: NicheResult): string {
  const encoded = encodeShareData(result);
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://127.0.0.1:3000";
  return `${base}/?c=${encoded}`;
}

export async function shareResults(result: NicheResult): Promise<"shared" | "copied" | "failed"> {
  const url = getShareUrl(result);
  const text = `I got a Niche Score of ${result.overallScore}/100 — "${result.tier.name}" on Nicheify! Can you beat it?`;

  // Try Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({ title: "My Nicheify Score", text, url });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "failed";
      }
      // Fall through to clipboard
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}

export function storeCompareData(data: ShareData): void {
  sessionStorage.setItem("nicheify_compare", JSON.stringify(data));
}

export function getStoredCompareData(): ShareData | null {
  try {
    const stored = sessionStorage.getItem("nicheify_compare");
    if (!stored) return null;
    return JSON.parse(stored) as ShareData;
  } catch {
    return null;
  }
}

export function clearCompareData(): void {
  sessionStorage.removeItem("nicheify_compare");
}
