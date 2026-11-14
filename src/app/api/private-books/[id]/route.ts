import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSupabaseUser(request);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await params;

    const { data: book, error: findError } = await supabaseAdmin
      .from("private_books")
      .select("id, user_id, storage_path")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (findError) throw findError;

    if (!book) {
      return NextResponse.json(
        { error: "Book not found in your bookshelf." },
        { status: 404 }
      );
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from("private-books")
      .remove([book.storage_path]);

    if (storageError) throw storageError;

    const { error: deleteError } = await supabaseAdmin
      .from("private_books")
      .delete()
      .eq("id", book.id)
      .eq("user_id", auth.user.id);

    if (deleteError) {
      console.error(
        "Book metadata delete error after Storage removal:",
        deleteError.message
      );

      return NextResponse.json(
        {
          error:
            "The file was removed, but its bookshelf record could not be deleted. Please contact support.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Book deleted successfully.",
    });
  } catch (error) {
    console.error("Delete private book error:", (error as Error).message);

    return NextResponse.json(
      { error: "Could not delete this book." },
      { status: 500 }
    );
  }
}
