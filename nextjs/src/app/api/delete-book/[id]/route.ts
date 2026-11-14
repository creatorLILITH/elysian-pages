import { NextResponse, type NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { pool } from "@/lib/db";

type StorageVerification =
  | { path: string; error: unknown }
  | { path: string; stillExists: boolean };

// Extract only paths belonging to our public Storage bucket.
function getStoragePath(url: unknown): string | null {
  if (!url) return null;
  try {
    const parsedUrl = new URL(String(url));
    const marker = "/storage/v1/object/public/elysian-books/";
    const markerIndex = parsedUrl.pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + marker.length)
    );
  } catch {
    return null;
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Retrieve the book before deleting its database record.
    const result = await pool.query(
      "SELECT * FROM library_books WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Book not found" },
        { status: 404 }
      );
    }

    const book = result.rows[0];

    // 2. Extract only paths belonging to our public Storage bucket.
    const bookPath = getStoragePath(book.file_url);
    const coverPath = getStoragePath(book.cover_url);

    if (!bookPath || !coverPath) {
      return NextResponse.json(
        {
          message:
            "Could not identify the book and Storage paths. Nothing was deleted.",
        },
        { status: 500 }
      );
    }

    const candidatePaths = [...new Set([bookPath, coverPath])];

    // 3. Find which files are still referenced by other records.
    const remaining = await pool.query(
      `SELECT file_url,cover_url
      FROM library_books WHERE id <> $1`,
      [id]
    );

    const stillReferenced = new Set<string>();

    for (const row of remaining.rows) {
      const remainingBookPath = getStoragePath(row.file_url);
      const remainingCoverPath = getStoragePath(row.cover_url);
      if (remainingBookPath) stillReferenced.add(remainingBookPath);
      if (remainingCoverPath) stillReferenced.add(remainingCoverPath);
    }

    const pathsToRemove = candidatePaths.filter(
      (path) => !stillReferenced.has(path)
    );

    // 4. Remove unshared Storage objects first.
    if (pathsToRemove.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("elysian-books")
        .remove(pathsToRemove);

      if (storageError) {
        console.error(
          "Public book Storage deletion error:",
          storageError
        );

        return NextResponse.json(
          {
            message:
              "Could not remove the book files. The database record was kept.",
          },
          { status: 500 }
        );
      }

      // Verify that none of the targeted objects still exists.
      const verificationResults: StorageVerification[] = await Promise.all(
        pathsToRemove.map(async (storagePath) => {
          const lastSlash = storagePath.lastIndexOf("/");
          const folder = storagePath.slice(0, lastSlash);
          const filename = storagePath.slice(lastSlash + 1);

          const { data, error } = await supabaseAdmin.storage
            .from("elysian-books")
            .list(folder, {
              search: filename,
              limit: 100,
            });

          if (error) {
            return { path: storagePath, error };
          }

          const stillExists = (data || []).some(
            (item) => item.name === filename
          );

          return { path: storagePath, stillExists };
        })
      );

      const verificationErrors = verificationResults.filter(
        (verification): verification is { path: string; error: unknown } =>
          "error" in verification
      );

      if (verificationErrors.length > 0) {
        console.error(
          "Storage verification errors:",
          verificationErrors
        );

        return NextResponse.json(
          {
            message:
              "Could not verify Storage cleanup. The database record was kept.",
          },
          { status: 500 }
        );
      }

      const remainingPaths = verificationResults
        .filter(
          (verification): verification is { path: string; stillExists: boolean } =>
            "stillExists" in verification && verification.stillExists
        )
        .map((verification) => verification.path);

      if (remainingPaths.length > 0) {
        console.error(
          "Storage objects still exist after deletion:",
          remainingPaths
        );

        return NextResponse.json(
          {
            message:
              "Some Storage files could not be removed. The database record was kept.",
          },
          { status: 500 }
        );
      }
    }

    // 5. Delete the database row only after Storage removal succeeds.
    const deleteResult = await pool.query(
      "DELETE FROM library_books WHERE id=$1 RETURNING id",
      [id]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json(
        {
          message:
            "Storage cleanup ran, but the database record could not be deleted.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Book and unshared Storage files deleted successfully",
    });
  } catch (error) {
    console.error("Public book delete error:", error);

    return NextResponse.json(
      { message: "Failed to delete book" },
      { status: 500 }
    );
  }
}
