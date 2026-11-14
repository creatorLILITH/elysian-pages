import { NextResponse, type NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { pool } from "@/lib/db";

export const maxDuration = 60;

function textField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

export async function POST(request: NextRequest) {
  let bookPath: string | null = null;
  let coverPath: string | null = null;

  try {
    // multer skips non-multipart requests, so the source route answers the
    // documented 400 rather than failing to parse the body.
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("multipart/form-data")
    ) {
      return NextResponse.json(
        { error: "Both a book file and cover image are required." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const title = textField(formData, "title");
    const author = textField(formData, "author");
    const category = textField(formData, "category");
    const bookFile = formData.get("book");
    const coverFile = formData.get("cover");

    if (!(bookFile instanceof File) || !(coverFile instanceof File)) {
      return NextResponse.json(
        { error: "Both a book file and cover image are required." },
        { status: 400 }
      );
    }

    const safeBookName = bookFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    const safeCoverName = coverFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");

    bookPath = `books/${Date.now()}-${safeBookName}`;
    coverPath = `covers/${Date.now()}-${safeCoverName}`;

    const { error: bookError } = await supabaseAdmin.storage
      .from("elysian-books")
      .upload(bookPath, await bookFile.arrayBuffer(), {
        contentType: bookFile.type,
        upsert: false,
      });

    if (bookError) {
      console.error("BOOK STORAGE ERROR:", bookError.message);

      return NextResponse.json(
        { error: "Failed to upload book to storage" },
        { status: 500 }
      );
    }

    const { error: coverError } = await supabaseAdmin.storage
      .from("elysian-books")
      .upload(coverPath, await coverFile.arrayBuffer(), {
        contentType: coverFile.type,
        upsert: false,
      });

    if (coverError) {
      console.error("COVER STORAGE ERROR:", coverError.message);

      await supabaseAdmin.storage.from("elysian-books").remove([bookPath]);

      return NextResponse.json(
        { error: "Failed to upload cover to storage" },
        { status: 500 }
      );
    }

    const { data: publicBookUrlData } = supabaseAdmin.storage
      .from("elysian-books")
      .getPublicUrl(bookPath);

    const { data: publicCoverUrlData } = supabaseAdmin.storage
      .from("elysian-books")
      .getPublicUrl(coverPath);

    const fileUrl = publicBookUrlData.publicUrl;
    const coverUrl = publicCoverUrlData.publicUrl;

    await pool.query(
      `INSERT INTO library_books
        (title, author, category, file_url, cover_url,
         uploaded_by, is_public, is_archived)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [title, author, category, fileUrl, coverUrl, null, true, false]
    );

    return NextResponse.json({
      message: "Book uploaded successfully",
    });
  } catch (error) {
    console.error("Public book upload error:", error);

    // Clean up uploaded objects if the database insert fails.
    const pathsToRemove = [bookPath, coverPath].filter(
      (path): path is string => Boolean(path)
    );

    if (pathsToRemove.length > 0) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from("elysian-books")
        .remove(pathsToRemove);

      if (cleanupError) {
        console.error(
          "Public upload cleanup error:",
          cleanupError.message
        );
      }
    }

    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
