import { NextResponse } from "next/server";

import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query("SELECT * FROM library_books");

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Public book list error:", error);

    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
