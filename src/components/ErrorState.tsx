"use client";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-8 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Something Went Wrong</h2>
        <p className="text-themed-secondary text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 rounded-full bg-spotify-green text-black font-semibold hover:bg-spotify-green-light transition-colors"
            >
              Try Again
            </button>
          )}
          <a
            href="/"
            className="px-6 py-3 rounded-full border font-semibold text-themed-secondary hover:bg-themed-elevated transition-colors"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  );
}
