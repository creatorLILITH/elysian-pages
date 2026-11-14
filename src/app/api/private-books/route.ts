import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { requireSupabaseUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const maxDuration = 60;

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getPrivateBookType(file: File): "pdf" | "epub" | null {
  const extension = extname(file.name || "").toLowerCase();

  if (extension === ".pdf" && file.type === "application/pdf") {
    return "pdf";
  }

  if (extension === ".epub" && file.type === "application/epub+zip") {
    return "epub";
  }

  return null;
}

function safePrivateFilename(filename: string): string {
  return basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function textField(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

export async function GET(request: NextRequest) {
  const auth = await requireSupabaseUser(request);
  if ("response" in auth) return auth.response;

  try {
    const { data, error } = await supabaseAdmin
      .from("private_books")
      .select(
        "id, user_id, title, author, file_name, file_type, file_size, created_at"
      )
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("List private books error:", (error as Error).message);

    return NextResponse.json(
      { error: "Could not load your private bookshelf." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSupabaseUser(request);
  if ("response" in auth) return auth.response;

  let uploadedStoragePath: string | null = null;

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
        { error: "Choose a PDF or EPUB file to upload." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("book");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Choose a PDF or EPUB file to upload." },
        { status: 400 }
      );
    }

    // multer's `limits.fileSize` equivalent: 50 MB.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Files must be 50 MB or smaller." },
        { status: 413 }
      );
    }

    const fileType = getPrivateBookType(file);

    if (!fileType) {
      return NextResponse.json(
        { error: "Only PDF and EPUB files are allowed." },
        { status: 400 }
      );
    }

    const defaultTitle = basename(file.name, extname(file.name));

    const title = String(
      textField(formData, "title") || defaultTitle
    ).trim();

    const author = String(
      textField(formData, "author") || "Unknown Author"
    ).trim();

    if (!title) {
      return NextResponse.json(
        { error: "Please provide a book title." },
        { status: 400 }
      );
    }

    const storagePath = `${auth.user.id}/${randomUUID()}-${safePrivateFilename(
      file.name
    )}`;

    uploadedStoragePath = storagePath;

    const { error: storageError } = await supabaseAdmin.storage
      .from("private-books")
      .upload(storagePath, await file.arrayBuffer(), {
        contentType:
          fileType === "pdf"
            ? "application/pdf"
            : "application/epub+zip",
        upsert: false,
      });

    if (storageError) throw storageError;

    const { data: book, error: insertError } = await supabaseAdmin
      .from("private_books")
      .insert({
        user_id: auth.user.id,
        title,
        author: author || "Unknown Author",
        file_name: file.name,
        storage_path: storagePath,
        file_type: fileType,
        file_size: file.size,
      })
      .select(
        "id, user_id, title, author, file_name, file_type, file_size, created_at"
      )
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(
      {
        message: "Book uploaded successfully.",
        book,
      },
      { status: 201 }
    );
  } catch (error) {
    // Remove the uploaded file if saving its metadata fails.
    if (uploadedStoragePath) {
      const { error: cleanupError } = await supabaseAdmin.storage
        .from("private-books")
        .remove([uploadedStoragePath]);

      if (cleanupError) {
        console.error(
          "Private book upload cleanup error:",
          cleanupError.message
        );
      }
    }

    console.error(
      "Upload private book error:",
      (error as Error).message
    );

    return NextResponse.json(
      { error: "The book could not be uploaded." },
      { status: 500 }
    );
  }
}
