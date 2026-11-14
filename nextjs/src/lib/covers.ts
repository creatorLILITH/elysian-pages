/**
 * Cover URLs arrive from the backend either as absolute URLs or as storage
 * paths relative to the API host. Every shelf needs the same resolution, so it
 * lives here instead of being re-implemented per page.
 */

const API_HOST = "https://elysian-pages.onrender.com";

export function resolveCoverUrl(coverUrl?: string | null): string | undefined {
  if (!coverUrl) return undefined;
  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
    return coverUrl;
  }
  return `${API_HOST}/${coverUrl.replaceAll("\\", "/")}`;
}

/** Same rule for the book files themselves (EPUB/PDF). */
export function resolveFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }
  return `${API_HOST}/${fileUrl.replaceAll("\\", "/")}`;
}
