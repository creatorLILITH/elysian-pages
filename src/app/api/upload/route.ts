import { NextResponse, type NextRequest } from "next/server";

import { pool } from "@/lib/db";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  console.log("Upload Route Hit");

  try {
    // multer skips non-multipart requests, so the source route answers the
    // documented "no file" 400 rather than failing to parse the body.
    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("multipart/form-data")
    ) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("book");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const title = file.name;
    const author = "Unknown Author";
    const category = "Fiction";
    const genre = "General";
    const cover_url = "https://covers.openlibrary.org/b/id/7222246-L.jpg";

    // DELIBERATE DEVIATION (the single one for this route) from
    // server/index.js:84-86: multer's memoryStorage never populates
    // `file.filename`, so the legacy route built `/uploads/undefined`.
    // `request.formData()` gives us the browser-provided original filename
    // as `file.name`; we use it for both `title` and the `file_url` path
    // segment. The response shape is unchanged.
    const file_url = `https://elysian-pages.onrender.com/uploads/${file.name}`;

    const result = await pool.query(
      `INSERT INTO books
        (title, author, category, genre, cover_url, file_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, author, category, genre, cover_url, file_url]
    );

    return NextResponse.json({
      message: "Book uploaded successfully",
      book: result.rows[0],
    });
  } catch (error) {
    console.error("Existing upload error:", error);

    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
