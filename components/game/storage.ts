/** localStorage wrappers that are safe during SSR and in browsers where
 *  storage throws (e.g. Safari private mode, blocked third-party contexts). */

export function storageGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Best-effort persistence — losing a save is fine, crashing is not.
  }
}
