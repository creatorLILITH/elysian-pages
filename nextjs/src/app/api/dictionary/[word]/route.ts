import { NextResponse, type NextRequest } from "next/server";

interface DictionaryDefinition {
  definition: string;
  example?: string;
}

interface DictionaryEntry {
  partOfSpeech: string;
  definitions?: DictionaryDefinition[];
}

interface DictionaryResponse {
  en?: DictionaryEntry[];
}
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ word: string }> }
) {
  try {
    const { word } = await params;

    const response = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(
        word
      )}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Word not found" },
        { status: response.status }
      );
    }

    const data = (await response.json()) as DictionaryResponse;
    const englishEntries = data.en || [];

    const meanings = englishEntries.map((entry) => ({
      partOfSpeech: entry.partOfSpeech,
      definitions: (entry.definitions || []).map((definition) => ({
        definition: definition.definition
          .replace(/<[^>]*>/g, "")
          .trim(),
        example: definition.example
          ? definition.example.replace(/<[^>]*>/g, "").trim()
          : null,
      })),
    }));

    return NextResponse.json({
      word,
      meanings,
    });
  } catch (error) {
    console.error("Dictionary API error:", error);

    return NextResponse.json(
      { error: "Dictionary lookup failed" },
      { status: 500 }
    );
  }
}
