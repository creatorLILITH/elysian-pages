// Replaces react-router's `navigate("/reader", { state: { book } })`,
// which has no Next App Router equivalent. The book is stored per-tab in
// sessionStorage immediately before `router.push("/reader")` and read once
// by the Reader page. A hard refresh on /reader loses it, matching the
// transient nature of router state.
export const READER_BOOK_KEY = "elysian:reader-book";

export function putReaderBook(book: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(READER_BOOK_KEY, JSON.stringify(book));
}

export function getReaderBook<T>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(READER_BOOK_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
