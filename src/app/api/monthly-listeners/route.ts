import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistIds } = body;

    if (!Array.isArray(artistIds) || artistIds.length === 0) {
      return NextResponse.json(
        { error: "artistIds array is required" },
        { status: 400 }
      );
    }

    const ids = artistIds.slice(0, 50);
    const results: Record<string, number | null> = {};

    // Process in batches of 5 with delays between batches
    for (let i = 0; i < ids.length; i += 5) {
      const batch = ids.slice(i, i + 5);
      const batchResults = await Promise.allSettled(
        batch.map((id: string) => fetchMonthlyListeners(id))
      );

      batch.forEach((id: string, idx: number) => {
        const result = batchResults[idx];
        results[id] =
          result.status === "fulfilled" ? result.value : null;
      });

      // Delay between batches to avoid rate limiting
      if (i + 5 < ids.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return NextResponse.json({ data: results });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch monthly listeners" },
      { status: 500 }
    );
  }
}

async function fetchMonthlyListeners(
  artistId: string
): Promise<number | null> {
  try {
    const url = `https://open.spotify.com/artist/${artistId}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Try to extract from __NEXT_DATA__ JSON
    const nextDataMatch = html.match(
      /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s
    );
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1]);
        const listeners = extractNestedValue(data, "monthlyListeners");
        if (typeof listeners === "number" && listeners > 0) return listeners;
      } catch {
        // JSON parse failed, try regex fallback
      }
    }

    // Regex fallback for rendered text or JSON-LD
    const listenerMatch = html.match(/([\d,]+)\s*monthly\s*listener/i);
    if (listenerMatch) {
      return parseInt(listenerMatch[1].replace(/,/g, ""), 10);
    }

    // Try extracting from any JSON-like structure in the page
    const jsonMatch = html.match(/"monthlyListeners"\s*:\s*(\d+)/);
    if (jsonMatch) {
      return parseInt(jsonMatch[1], 10);
    }

    return null;
  } catch {
    return null;
  }
}

function extractNestedValue(obj: unknown, key: string): unknown {
  if (obj === null || obj === undefined) return undefined;
  if (typeof obj !== "object") return undefined;

  const record = obj as Record<string, unknown>;
  if (key in record) return record[key];

  for (const val of Object.values(record)) {
    const found = extractNestedValue(val, key);
    if (found !== undefined) return found;
  }
  return undefined;
}
