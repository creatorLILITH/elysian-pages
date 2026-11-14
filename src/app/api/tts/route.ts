import { NextResponse, type NextRequest } from "next/server";

// Server-side proxy for Deepgram text-to-speech. The API key never reaches the
// browser: the client posts the sentence to speak and receives audio/mpeg.
export const maxDuration = 60;

const DEEPGRAM_SPEAK_URL = "https://api.deepgram.com/v2/speak";
const MAX_CHARS = 2000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Voice is not configured on this server." },
      { status: 503 }
    );
  }

  let text = "";
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && "text" in body && typeof body.text === "string") {
      text = body.text;
    }
  } catch {
    // fall through to the empty-text error below
  }

  text = text.trim();
  if (!text) {
    return NextResponse.json({ error: "No text provided." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
  }

  const model = process.env.DEEPGRAM_TTS_MODEL || "flux-hannah-en";
  const speed = process.env.DEEPGRAM_TTS_SPEED || "1";
  const url = `${DEEPGRAM_SPEAK_URL}?model=${encodeURIComponent(model)}&speed=${encodeURIComponent(speed)}&expressivity=0`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("Deepgram speak error:", upstream.status, detail.slice(0, 300));
      return NextResponse.json(
        { error: "Voice synthesis failed." },
        { status: 502 }
      );
    }

    const audio = await upstream.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Content-Length": String(audio.byteLength),
      },
    });
  } catch (error) {
    console.error("Voice synthesis request failed:", (error as Error).message);
    return NextResponse.json(
      { error: "Could not reach the voice service." },
      { status: 502 }
    );
  }
}
