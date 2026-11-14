// Client-side text-to-speech playback for the reader.
// Audio is synthesized by `/api/tts` (server-proxied Deepgram) one chunk at a
// time and played back-to-back, prefetching the next chunk while the current
// one plays so speech sounds continuous.

export type SpeechStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface SpeechState {
  status: SpeechStatus;
  /** 1-based index of the chunk being spoken. */
  index: number;
  total: number;
  error?: string;
}

/** Target size of a single synthesized chunk, in characters. */
const MAX_CHUNK_CHARS = 320;

/**
 * Split book text into sentence-sized chunks so each Deepgram request stays
 * small (fast first audio, low latency) and progress can be tracked.
 */
export function splitIntoSpeechChunks(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?…]+[.!?…]+["')\]]*|\S[^.!?…]*$/g) ?? [normalized];

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    const piece = sentence.trim();
    if (!piece) continue;
    if (current && current.length + piece.length + 1 > MAX_CHUNK_CHARS) {
      chunks.push(current);
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
    // A single very long sentence still needs splitting.
    while (current.length > MAX_CHUNK_CHARS) {
      const cut = current.lastIndexOf(" ", MAX_CHUNK_CHARS);
      const at = cut > 40 ? cut : MAX_CHUNK_CHARS;
      chunks.push(current.slice(0, at).trim());
      current = current.slice(at).trim();
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function fetchSpeech(text: string, signal: AbortSignal): Promise<string> {
  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!response.ok) {
    let message = `Voice failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return URL.createObjectURL(await response.blob());
}

/**
 * Plays a list of text chunks sequentially with prefetching. One instance
 * drives the reader's "Listen" button.
 */
export class SpeechPlayer {
  private audio: HTMLAudioElement | null = null;
  private chunks: string[] = [];
  private index = 0;
  private url: string | null = null;
  private prefetched: { index: number; url: string } | null = null;
  private controller: AbortController | null = null;
  private stopped = true;

  constructor(private readonly onState: (state: SpeechState) => void) {}

  private emit(status: SpeechStatus, error?: string) {
    this.onState({ status, index: this.index + 1, total: this.chunks.length, error });
  }

  async start(text: string) {
    this.stop();
    this.chunks = splitIntoSpeechChunks(text);
    this.index = 0;
    this.stopped = false;

    if (this.chunks.length === 0) {
      this.onState({ status: "error", index: 0, total: 0, error: "Nothing to read." });
      return;
    }

    this.emit("loading");
    try {
      const url = await this.load(0);
      if (this.stopped) {
        URL.revokeObjectURL(url);
        return;
      }
      this.url = url;
      await this.play(url);
    } catch (error) {
      this.fail(error);
    }
  }

  private async load(index: number): Promise<string> {
    if (this.prefetched?.index === index) {
      const { url } = this.prefetched;
      this.prefetched = null;
      return url;
    }
    this.controller?.abort();
    this.controller = new AbortController();
    return fetchSpeech(this.chunks[index], this.controller.signal);
  }

  private prefetchNext() {
    const next = this.index + 1;
    if (next >= this.chunks.length || this.prefetched?.index === next) return;
    fetchSpeech(this.chunks[next], new AbortController().signal)
      .then((url) => {
        if (this.stopped) {
          URL.revokeObjectURL(url);
          return;
        }
        if (this.prefetched && this.prefetched.index !== next) URL.revokeObjectURL(this.prefetched.url);
        this.prefetched = { index: next, url };
      })
      .catch(() => {
        // Prefetch is best-effort; the real request happens on advance.
      });
  }

  private async play(url: string) {
    const audio = this.audio ?? new Audio();
    this.audio = audio;
    audio.src = url;
    audio.onended = () => {
      this.releaseCurrent();
      void this.advance();
    };
    this.emit("playing");
    await audio.play();
    this.prefetchNext();
  }

  private releaseCurrent() {
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = null;
  }

  private async advance() {
    if (this.stopped) return;
    this.index += 1;
    if (this.index >= this.chunks.length) {
      this.stopped = true;
      this.index = 0;
      this.emit("idle");
      return;
    }
    this.emit("loading");
    try {
      const url = await this.load(this.index);
      if (this.stopped) {
        URL.revokeObjectURL(url);
        return;
      }
      this.url = url;
      await this.play(url);
    } catch (error) {
      this.fail(error);
    }
  }

  private fail(error: unknown) {
    this.releaseCurrent();
    this.stopped = true;
    this.onState({
      status: "error",
      index: this.index + 1,
      total: this.chunks.length,
      error: error instanceof Error ? error.message : "Voice failed.",
    });
  }

  pause() {
    if (!this.audio || this.stopped) return;
    this.audio.pause();
    this.emit("paused");
  }

  async resume() {
    if (!this.audio || this.stopped) return;
    await this.audio.play();
    this.emit("playing");
  }

  stop() {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
    if (this.audio) {
      this.audio.pause();
      this.audio.onended = null;
      this.audio.removeAttribute("src");
    }
    this.releaseCurrent();
    if (this.prefetched) {
      URL.revokeObjectURL(this.prefetched.url);
      this.prefetched = null;
    }
    this.index = 0;
    if (this.chunks.length > 0) this.emit("idle");
  }
}
