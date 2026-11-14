import { NextResponse, type NextRequest } from "next/server";
import { hash } from "bcrypt";

import { pool } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    const hashedPassword = await hash(password, 10);

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [username, email, hashedPassword]
    );

    return NextResponse.json({
      message: "Signup Successful!!",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json({ error: "Signup failed!" }, { status: 500 });
  }
}
