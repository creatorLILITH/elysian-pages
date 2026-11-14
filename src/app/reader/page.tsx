"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BookmarkSection from "@/components/BookmarkSection";
import NotesSection from "@/components/NotesSection";
import ReaderToolbar from "@/components/ReaderToolbar";
import "@/components/Reader.css";
import SearchBar from "@/components/SearchBar";
import HighlightSection from "@/components/HighlightSection";
import { getReaderBook } from "@/lib/book-handoff";
import { SpeechPlayer, type SpeechState } from "@/lib/reader-tts";

// Browser-only viewers: react-pdf / react-reader / epubjs touch window and
// document at import time, so they must never be server-rendered.
const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
});
const EPUBViewer = dynamic(() => import("@/components/EPUBViewer"), {
  ssr: false,
});

interface ReaderTheme {
  name: string;
  background: string;
  text: string;
  accent?: string;
}

interface HighlightItem {
  text?: string;
  color?: string;
  cfi?: string;
  pageNumber?: number;
  type?: string;
}

interface Note {
  title: string;
  content: string;
}

interface EpubSearchMatch {
  cfi: string;
  excerpt: string;
}

interface ReaderBook {
  id: string | number;
  title: string;
  author: string;
  content?: string;
  cover_url?: string;
  file_url?: string;
  fileurl?: string;
  fileUrl?: string;
  file_type?: string;
  fileType?: string;
  file_name?: string;
}

// Module-level so the identity is stable across renders. epubjs re-applies
// themes whenever the theme object identity changes, which caused the reader
// to flicker/re-layout on every state update.
const READER_THEMES: Record<string, ReaderTheme> = {
  classicLight: { name: "Classic Light", background: "#FFFFFF", text: "#000000" },
  classicDark: { name: "Classic Dark", background: "#000000", text: "#FFFFFF" },
  mistyBlue: { name: "Misty Blue", background: "#E1E9ED", text: "#303A40", accent: "#668996" },
  dustyRose: { name: "Dusty Rose", background: "#ECDCDF", text: "#403436", accent: "#9B717C" },
  midnightLibrary: { name: "Midnight Library", background: "#171A22", text: "#E3E4EA", accent: "#8995B5" },
  candlelight: { name: "Candlelight", background: "#F1E6CF", text: "#3C3328", accent: "#A3824F" },
  sageGreen: { name: "Sage Green", background: "#E1E8DD", text: "#30382F", accent: "#71856C" },
  coffeeCream: { name: "Coffee & Cream", background: "#F6EFE3", text: "#3B3028", accent: "#A87545" },
  winterMist: { name: "Winter Mist", background: "#E5E7E8", text: "#34383A", accent: "#748999" },
  forestNight: { name: "Forest Night", background: "#18221E", text: "#D7DDD8", accent: "#829B88" },
};

function Reader() {
  const [book, setBook] = useState<ReaderBook | null>(null);
  // Tracks whether the post-mount storage hydration has completed. Storage
  // writers must wait for it so they cannot clobber saved values on mount.
  const [mounted, setMounted] = useState(false);
  /*--------- STATES ---------*/
  const [locationState, setLocationState] = useState<string|null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<string>("classicLight");
  const readerThemes = READER_THEMES;
  useEffect(()=>{
    if (!mounted) return;
    localStorage.setItem("readerTheme",readerTheme);
  },[readerTheme,mounted]);
  const [fontSize, setFontSize] = useState<number|string>(18);
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  // The EPUB search only runs on a committed query, not on every keystroke:
  // searching fired a full-book spine scan per character and froze the page.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchRunId, setSearchRunId] = useState(0);
  const [searchResults, setSearchResults] = useState<EpubSearchMatch[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  useEffect(()=>{
    if (!mounted) return;
    if (!book) return;
    localStorage.setItem(`highlights-${book.id}`,JSON.stringify(highlights));
  },[highlights, book, mounted]);
  const [removeHighlight, setRemoveHighlight]=useState<((cfi?:string)=>void)|null>(null);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState("");
  const [dictionaryData, setDictionaryData] = useState<{
    meanings?: {
      partOfSpeech?: string;
      definitions?: {
        definition?: string;
      }[];
    }[];
  }|null>(null);

  /* ---------- VOICE (TEXT TO SPEECH) ---------- */
  const [showVoice, setShowVoice] = useState(false);
  const [speech, setSpeech] = useState<SpeechState>({
    status: "idle",
    index: 0,
    total: 0,
  });
  const playerRef = useRef<SpeechPlayer | null>(null);
  const textSourceRef = useRef<(() => string) | null>(null);

  const getPlayer = useCallback(() => {
    if (!playerRef.current) playerRef.current = new SpeechPlayer(setSpeech);
    return playerRef.current;
  }, []);

  const registerTextSource = useCallback((getText: () => string) => {
    textSourceRef.current = getText;
  }, []);

  // Stop audio if the reader unmounts (e.g. navigating away).
  useEffect(() => {
    return () => {
      playerRef.current?.stop();
    };
  }, []);

  // Stop audio whenever the voice panel is closed.
  useEffect(() => {
    if (!showVoice) playerRef.current?.stop();
  }, [showVoice]);

  /* HYDRATE BROWSER STORAGE AFTER MOUNT */

  useEffect(() => {

    setMounted(true);

    const savedBook = getReaderBook<ReaderBook>();

    setBook(savedBook);

    const savedDarkMode =
      localStorage.getItem("darkMode");

    setDarkMode(
      savedDarkMode
        ? JSON.parse(savedDarkMode)
        : false
    );

    const savedReaderTheme =
      localStorage.getItem("readerTheme");

    setReaderTheme(
      savedReaderTheme || "classicLight"
    );

    if (savedBook) {

      setHighlights(
        JSON.parse(
          localStorage.getItem(
            `highlights-${savedBook.id}`
          ) || "[]"
        ) || []
      );

    }

  }, []);

  useEffect(()=>{
    const fetchDefinition=async()=>{
      if (!showDictionary||!dictionaryWord){
        return;
      }
      const word=dictionaryWord.trim().split(/\s+/)[0];
      try{
        setDictionaryData(null);
        const response= await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
        if (!response.ok){
          throw new Error("Word Not Found");
        }
        const data=await response.json();
        setDictionaryData(data);
      }
      catch(error){
        console.error("Dictionary Error:",error);
        setDictionaryData(null);
      }
    };
    fetchDefinition();
  },[showDictionary,dictionaryWord]);

  /* SAVE RECENTLY OPENED BOOKS */
  useEffect(() => {

    if (!book) return;

    const existing =
      JSON.parse(
        localStorage.getItem(
          "recentBooks"
        ) || "[]"
      ) || [];

    const filtered =
      existing.filter(
        (b: ReaderBook) => b.title !== book.title
      );

    const updated = [
      book,
      ...filtered,
    ];

    localStorage.setItem(
      "recentBooks",
      JSON.stringify(
        updated.slice(0, 5)
      )
    );

  }, [book]);

  /* SEARCH */

  const handleSearch=()=>{
    const query=searchText.trim();
    if (!query) return;
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setSearchQuery(query);
    setSearchRunId((run)=>run+1);
  };
  const goToNextSearchResult=()=>{
    if (searchResults.length===0) return;
    setCurrentSearchIndex((prevIndex)=>
    prevIndex+1<searchResults.length?prevIndex+1:0);
  };
  const goToPreviousSearchResult=()=>{
    if (searchResults.length===0) return;
    setCurrentSearchIndex((prevIndex)=>prevIndex-1>=0
  ?prevIndex-1:searchResults.length-1);
  };

  /* LOAD SAVED DATA */
  useEffect(() => {

    if (book) {

      /* Reading progress */

      const savedLocation =
        localStorage.getItem(book.title);

      if (savedLocation) {
        setLocationState(savedLocation);
      }

      /* Bookmarks */

      const savedBookmarks =
        JSON.parse(
          localStorage.getItem(
            `bookmarks-${book.title}`
          ) || "[]"
        ) || [];

      setBookmarks(savedBookmarks);

      /* Font size */

      const savedFontSize =
        localStorage.getItem("fontSize");

      if (savedFontSize) {

        setFontSize(savedFontSize);

      }

      /* Notes */

      let savedNotes: Note[] = [];

      try {

        savedNotes =
          JSON.parse(
            localStorage.getItem(
              `notes-${book.title}`
            ) || "[]"
          ) || [];

      } catch {

        savedNotes = [];

      }

      setNotes(savedNotes);

    }

  }, [book]);

  /* SAVE SETTINGS */

  useEffect(() => {

    if (!mounted) return;

    localStorage.setItem(
      "darkMode",
      JSON.stringify(darkMode)
    );

    localStorage.setItem(
      "fontSize",
      String(fontSize)
    );

  }, [darkMode, fontSize, mounted]);

  /* WAIT FOR CLIENT HYDRATION */

  if (!mounted) {

    return null;

  }

  /* BOOK NOT FOUND */

  if (!book) {

    return (

      <div style={{ padding: "20px" }}>
        <h2>Book data not found.</h2>
      </div>

    );

  }


  /* FILE URL */

  const rawUrl =
    book.file_url ||
    book.fileurl ||
    book.fileUrl;

  const fileUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `https://elysian-pages.onrender.com/${rawUrl.replaceAll("\\", "/")}`
    : "";

  // Prefer the explicit file type supplied by the backend.
  // Fall back to the URL pathname for existing public-library books.
  const declaredFileType = (
    book.file_type ||
    book.fileType ||
    ""
  ).toLowerCase();

  let filePath = fileUrl;

  try {
    if (fileUrl) {
      filePath = new URL(fileUrl).pathname.toLowerCase();
    }
  } catch {
    filePath = fileUrl.split("?")[0].toLowerCase();
  }

  const isPDF =
    declaredFileType === "pdf" ||
    (!declaredFileType && filePath.endsWith(".pdf"));

  const isEPUB =
    declaredFileType === "epub" ||
    (!declaredFileType && filePath.endsWith(".epub"));

  /* ADD BOOKMARK */

  const addBookmark = () => {

    if (!locationState) return;

    const newBookmarks = [
      ...bookmarks,
      locationState,
    ];

    setBookmarks(newBookmarks);

    localStorage.setItem(
      `bookmarks-${book.title}`,
      JSON.stringify(newBookmarks)
    );

  };

  /* DELETE BOOKMARK */

  const deleteBookmark = (index: number) => {

    const updatedBookmarks =
      bookmarks.filter(
        (_, i) => i !== index
      );

    setBookmarks(updatedBookmarks);

    localStorage.setItem(
      `bookmarks-${book.title}`,
      JSON.stringify(updatedBookmarks)
    );

  };

  /* SAVE NOTES */

  const saveNotes = (updatedNotes: Note[]) => {

    localStorage.setItem(
      `notes-${book.title}`,
      JSON.stringify(updatedNotes)
    );

  };

  /* VOICE (TEXT TO SPEECH) */

  const collectReadableText = () => {
    const fromViewer = textSourceRef.current?.() ?? "";
    if (fromViewer.trim()) {
      return fromViewer;
    }
    return book.content ?? "";
  };

  const startListening = () => {
    void getPlayer().start(collectReadableText());
  };

  const toggleListening = () => {
    const player = getPlayer();
    if (speech.status === "playing") {
      player.pause();
    } else if (speech.status === "paused") {
      void player.resume();
    } else {
      startListening();
    }
  };

  const stopListening = () => {
    getPlayer().stop();
  };

  const closeVoice = () => {
    playerRef.current?.stop();
    setShowVoice(false);
  };

  const speechLabel = (() => {
    switch (speech.status) {
      case "loading":
        return `Preparing ${speech.index}/${speech.total}…`;
      case "playing":
        return `Speaking ${speech.index}/${speech.total}`;
      case "paused":
        return `Paused at ${speech.index}/${speech.total}`;
      case "error":
        return speech.error ?? "Voice failed.";
      default:
        return "Press Listen to hear this book";
    }
  })();

return (
  <div
    className="reader"
    style={
      {
        "--r-bg": readerThemes[readerTheme].background,
        "--r-fg": readerThemes[readerTheme].text,
        "--r-accent":
          readerThemes[readerTheme].accent || readerThemes[readerTheme].text,
      } as CSSProperties
    }
  >
    <nav className="reader-topbar" aria-label="Reader navigation">
      <Link href="/mylibrary" className="reader-back"><span aria-hidden="true">←</span> My Library</Link>
      <span className="reader-topbar__brand">elysian<span>pages.</span></span>
      <span className="reader-topbar__mode"><span aria-hidden="true" /> Reading room</span>
    </nav>
    {/* READER GRID */}
    <div
      className="reader__layout"
      data-panel={
        showHighlights || showBookmarks || showNotes || showDictionary
          ? "open"
          : "closed"
      }
    >
      {/* MAIN BOOK AREA */}
      <div className="reader__main">
        <div className="reader__sheet">

        {/* BOOK INFORMATION */}
        <header className="reader__book">
          <p className="reader__eyebrow">{isPDF ? "PDF EDITION" : isEPUB ? "EPUB EDITION" : "THE READING ROOM"}</p>
          <h1 className="reader__book-title">{book.title}</h1>
          <p className="reader__book-author">{book.author}</p>
        </header>

        <hr className="reader__rule" />

        {/* FALLBACK TEXT */}
        {!isPDF && !isEPUB && (
          <p
            className="reader-prose"
            style={{ fontSize: `${fontSize}px` }}
          >
            {book.content}
          </p>
        )}

        {/* SEARCH */}
        {showSearch && (
          <div className="reader__search">
            <SearchBar
              darkMode={darkMode}
              searchText={searchText}
              setSearchText={setSearchText}
              handleSearch={handleSearch}
            />

            <p className="reader__search-count">
              Search Results: {searchResults.length}
            </p>

            <div className="toolbar">
              <button
                type="button"
                className="btn"
                onClick={goToNextSearchResult}
              >
                Next Result
              </button>

              <button
                type="button"
                className="btn"
                onClick={goToPreviousSearchResult}
              >
                Previous Result
              </button>
            </div>
          </div>
        )}

        {/* READER TOOLBAR */}
        <ReaderToolbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          fontSize={fontSize}
          setFontSize={setFontSize}
          readerTheme={readerTheme}
          setReaderTheme={setReaderTheme}
          readerThemes={readerThemes}
          showHighlights={showHighlights}
          setShowHighlights={setShowHighlights}
          showBookmarks={showBookmarks}
          setShowBookmarks={setShowBookmarks}
          showNotes={showNotes}
          setShowNotes={setShowNotes}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showVoice={showVoice}
          setShowVoice={setShowVoice}
        />

        {/* VOICE PANEL */}
        {showVoice && (
          <div className="reader-voice">
            <span style={{ fontSize: "1.1rem" }} aria-hidden="true">
              🔊
            </span>

            <button
              type="button"
              className="btn btn--primary"
              onClick={toggleListening}
            >
              {speech.status === "playing"
                ? "⏸ Pause"
                : speech.status === "paused"
                  ? "▶ Resume"
                  : speech.status === "loading"
                    ? "… Loading"
                    : "▶ Listen"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={stopListening}
              disabled={speech.status === "idle"}
            >
              ⏹ Stop
            </button>

            <span
              className="reader-voice__status"
              role="status"
              aria-live="polite"
            >
              {speechLabel}
            </span>

            <button
              type="button"
              className="reader__panel-close reader-voice__close"
              onClick={closeVoice}
              title="Close voice"
              aria-label="Close voice"
            >
              ×
            </button>
          </div>
        )}

        {/* PDF VIEWER */}
        {isPDF && (
          <PDFViewer fileUrl={fileUrl}
          readerTheme={readerTheme}
          readerThemes={readerThemes}
          book={book}
          setHighlights={setHighlights}
          onTextSource={registerTextSource}
          onDictionaryOpen={(word)=>{
            setDictionaryWord(word);
            setShowDictionary(true);
          }}/>
        )}

        {/* EPUB VIEWER */}
        {isEPUB && (
          <div className="reader__epub">
            <EPUBViewer
              fileUrl={fileUrl}
              locationState={locationState}
              setLocationState={setLocationState}
              book={book}
              darkMode={darkMode}
              fontSize={fontSize}
              searchQuery={searchQuery}
              searchRunId={searchRunId}
              setSearchResults={setSearchResults}
              searchResults={searchResults}
              currentSearchIndex={currentSearchIndex}
              setHighlights={setHighlights}
              readerTheme={readerTheme}
              readerThemes={readerThemes}
              setRemoveHighlight={setRemoveHighlight}
              onTextSource={registerTextSource}
              onDictionaryOpen={(word) => {
                setDictionaryWord(word);
                setShowDictionary(true);
              }}
            />
          </div>
        )}

        </div>
      </div>

      {/* RIGHT-SIDE UTILITY PANEL */}
      {(showHighlights || showBookmarks || showNotes || showDictionary) && (
        <aside className="reader__panel">

          {showHighlights && (
            <div className="reader__panel-section">
              <button
                type="button"
                onClick={() => setShowHighlights(false)}
                title="Close Highlights"
                aria-label="Close Highlights"
                className="reader__panel-close"
              >
                ×
              </button>

              <HighlightSection
                highlights={highlights}
                setHighlights={setHighlights}
                book={book}
                removeHighlight={removeHighlight}
              />
            </div>
          )}

          {showBookmarks && (
            <div className="reader__panel-section">
              <button
                type="button"
                onClick={() => setShowBookmarks(false)}
                title="Close Bookmarks"
                aria-label="Close Bookmarks"
                className="reader__panel-close"
              >
                ×
              </button>

              <BookmarkSection
                isEPUB={isEPUB}
                bookmarks={bookmarks}
                addBookmark={addBookmark}
                deleteBookmark={deleteBookmark}
                setLocationState={setLocationState}
              />
            </div>
          )}

          {showNotes && (
            <div
              style={{
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <button
                onClick={() => setShowNotes(false)}
                title="Close Notes"
                aria-label="Close Notes"
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  background: "transparent",
                  border: "none",
                  color: readerThemes[readerTheme].text,
                  fontSize: "24px",
                  cursor: "pointer",
                  lineHeight: "1",
                  padding: "2px 6px",
                  zIndex: 2,
                }}
              >
                ×
              </button>

              <NotesSection
                notes={notes}
                setNotes={setNotes}
                saveNotes={saveNotes}
              />
            </div>
          )}

          {showDictionary && (
            <div
              style={{
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <button
                onClick={() => setShowDictionary(false)}
                title="Close Dictionary"
                aria-label="Close Dictionary"
                style={{
                  position: "absolute",
                  top: "0",
                  right: "0",
                  background: "transparent",
                  border: "none",
                  color: readerThemes[readerTheme].text,
                  fontSize: "24px",
                  cursor: "pointer",
                  lineHeight: "1",
                  padding: "2px 6px",
                  zIndex: 2,
                }}
              >
                ×
              </button>

              <h2 style={{ marginTop: 0 }}>
                Dictionary
              </h2>

              <h3>
                {dictionaryWord}
              </h3>

              {!dictionaryData && (
                <p style={{ opacity: 0.7 }}>
                  Looking up definition....
                </p>
              )}

              {dictionaryData && dictionaryData.meanings && (
                <div>
                  {dictionaryData.meanings.map((meaning, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "20px",
                      }}
                    >
                      <p
                        style={{
                          fontStyle: "italic",
                          fontWeight: "bold",
                        }}
                      >
                        {meaning.partOfSpeech}
                      </p>

                      {meaning.definitions?.map(
                        (definition, definitionIndex) => (
                          <p
                            key={definitionIndex}
                            style={{
                              lineHeight: "1.6",
                            }}
                          >
                            <strong>
                              {definitionIndex + 1}.
                            </strong>{" "}
                            {definition.definition}
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </aside>
      )}

    </div>
  </div>
);
}

export default Reader;
