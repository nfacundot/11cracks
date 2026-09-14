const TOKEN_COOKIE = "11cracks_token";
const LOGOUT_COOKIE = "11cracks_logged_out";
const STORAGE_KEY = "11cracks:session-token";

export function snapshotStoredToken(): string | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1]) : null;
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
      return token;
    }
    const loggedOut = document.cookie.includes(`${LOGOUT_COOKIE}=1`);
    if (loggedOut) {
      localStorage.removeItem(STORAGE_KEY);
    }
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}