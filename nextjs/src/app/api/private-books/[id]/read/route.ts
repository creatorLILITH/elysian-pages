import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSupabaseUser(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;

    const { data: book, error: bookError } = await supabaseAdmin
      .from("private_books")
      .select(
        "id, user_id, title, author, file_name, file_type, file_size, storage_path"
      )
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (bookError) throw bookError;

    if (!book) {
      return NextResponse.json(
        { error: "Book not found in your bookshelf." },
        { status: 404 }
      );
    }

    // A signed URL is created only after checking ownership.
    const signedResult = await supabaseAdmin.storage
      .from("private-books")
      .createSignedUrl(book.storage_path, 600);

    if (signedResult.error) throw signedResult.error;

    const { storage_path, user_id, ...safeBook } = book;

    return NextResponse.json({
      book: {
        ...safeBook,
        file_url: signedResult.data.signedUrl,
      },
    });
  } catch (error) {
    console.error("Read private book error:", (error as Error).message);

    return NextResponse.json(
      { error: "Could not open this book." },
      { status: 500 }
    );
  }
}
