import { NextResponse, type NextRequest } from "next/server";

import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId, bookId } = await request.json();

    await pool.query(
      `INSERT INTO user_library (user_id, book_id)
       VALUES ($1, $2)`,
      [userId, bookId]
    );

    return NextResponse.json({
      message: "Book added to library",
    });
  } catch (error) {
    console.error("Add to library error:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
