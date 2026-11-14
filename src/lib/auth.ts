import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

import { supabaseAdmin } from "./supabase-admin";

export type SupabaseUserResult =
  | { user: User }
  | { response: NextResponse };

/**
 * Reproduces the Express `requireSupabaseUser` middleware from
 * server/index.js:523-554. Reads `Authorization: Bearer <token>`,
 * verifies it with the admin client, and returns either the user or
 * the exact 401 JSON response the source route would have sent.
 */
export async function requireSupabaseUser(
  request: NextRequest
): Promise<SupabaseUserResult> {
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return {
      response: NextResponse.json(
        { error: "Please sign in to access your bookshelf." },
        { status: 401 }
      ),
    };
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(match[1]);

    if (error || !data?.user) {
      return {
        response: NextResponse.json(
          {
            error:
              "Your session is invalid or expired. Please sign in again.",
          },
          { status: 401 }
        ),
      };
    }

    return { user: data.user };
  } catch (error) {
    console.error(
      "Private bookshelf authentication error:",
      (error as Error).message
    );

    return {
      response: NextResponse.json(
        { error: "Unable to verify your session." },
        { status: 401 }
      ),
    };
  }
}
