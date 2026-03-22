"use client";

import { useState } from "react";
import { shareResults } from "@/lib/share";
import type { NicheResult } from "@/lib/niche-score";

interface ShareButtonProps {
  result: NicheResult;
}

export default function ShareButton({ result }: ShareButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "failed">(
    "idle"
  );

  async function handleShare() {
    const outcome = await shareResults(result);
    setStatus(outcome);
    if (outcome === "copied") {
      setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-spotify-green text-black font-semibold hover:bg-spotify-green-light transition-all hover:scale-105 active:scale-100"
    >
      {status === "copied" ? (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Link Copied!
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
            />
          </svg>
          Challenge a Friend
        </>
      )}
    </button>
  );
}
