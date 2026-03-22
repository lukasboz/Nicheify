const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI!;
const SCOPES = "user-top-read";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

// Use localStorage for PKCE values (verifier + state) since they must
// survive the full-page redirect chain (app → Spotify → app).
// sessionStorage can be unreliable across cross-origin redirect chains
// in some browsers. These values are single-use and cleaned up immediately
// after token exchange.
const PKCE_STORAGE = localStorage;
const TOKEN_STORAGE = sessionStorage;

function generateCodeVerifier(length = 64): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function initiateLogin(): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  PKCE_STORAGE.setItem("spotify_code_verifier", codeVerifier);
  PKCE_STORAGE.setItem("spotify_auth_state", state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state: state,
  });

  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<TokenResponse> {
  const storedState = PKCE_STORAGE.getItem("spotify_auth_state");
  if (state !== storedState) {
    throw new AuthError("State mismatch — possible CSRF attack");
  }

  const codeVerifier = PKCE_STORAGE.getItem("spotify_code_verifier");
  if (!codeVerifier) {
    throw new AuthError("Code verifier not found — session may have expired");
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new AuthError(
      `Token exchange failed: ${error.error_description || error.error}`
    );
  }

  const tokenData: TokenResponse = await response.json();

  TOKEN_STORAGE.setItem("spotify_access_token", tokenData.access_token);
  TOKEN_STORAGE.setItem("spotify_refresh_token", tokenData.refresh_token);
  TOKEN_STORAGE.setItem(
    "spotify_token_expiry",
    String(Date.now() + tokenData.expires_in * 1000)
  );

  // Clean up single-use PKCE values
  PKCE_STORAGE.removeItem("spotify_code_verifier");
  PKCE_STORAGE.removeItem("spotify_auth_state");

  return tokenData;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = TOKEN_STORAGE.getItem("spotify_refresh_token");
  if (!refreshToken) throw new AuthError("No refresh token available");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new AuthError("Token refresh failed");

  const data = await response.json();
  TOKEN_STORAGE.setItem("spotify_access_token", data.access_token);
  if (data.refresh_token) {
    TOKEN_STORAGE.setItem("spotify_refresh_token", data.refresh_token);
  }
  TOKEN_STORAGE.setItem(
    "spotify_token_expiry",
    String(Date.now() + data.expires_in * 1000)
  );

  return data.access_token;
}

export function getAccessToken(): string | null {
  const token = TOKEN_STORAGE.getItem("spotify_access_token");
  const expiry = TOKEN_STORAGE.getItem("spotify_token_expiry");
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry) - 60000) return null;
  return token;
}

export function hasValidToken(): boolean {
  return getAccessToken() !== null;
}

export function clearAuth(): void {
  TOKEN_STORAGE.removeItem("spotify_access_token");
  TOKEN_STORAGE.removeItem("spotify_refresh_token");
  TOKEN_STORAGE.removeItem("spotify_token_expiry");
  PKCE_STORAGE.removeItem("spotify_code_verifier");
  PKCE_STORAGE.removeItem("spotify_auth_state");
}
