// Shared shapes for the data consumed by the ported pages.

/** A public library book (the `books` / `library_books` rows). */
export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  genre: string;
  cover_url: string;
  file_url: string;
}

/** A privately uploaded book (the `private_books` rows). */
export interface PrivateBook {
  id: number;
  user_id: string;
  title: string;
  author: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  storage_path?: string;
  /** Present only on the `/read` response, as a short-lived signed URL. */
  file_url?: string;
}

/** The `profiles` row shown on the Profile page. */
export interface Profile {
  id?: string;
  username: string;
  avatar?: string | null;
  role?: string | null;
}
