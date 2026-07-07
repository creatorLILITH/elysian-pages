import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import EPUBViewer from "../components/EPUBViewer";
import PDFViewer from "../components/PDFViewer";
import BookmarkSection from "../components/BookmarkSection";
import NotesSection from "../components/NotesSection";
import ReaderToolbar from "../components/ReaderToolbar";
import "./Reader.css";
import SearchBar from "../components/SearchBar";
import HighlightSection from "../components/HighlightSection";

function Reader() {
  const location = useLocation();
  const book =
    location.state?.book || location.state;
  /*--------- STATES ---------*/
  const [locationState, setLocationState] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [searchText, setSearchText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  /*---------- LOAD SAVED HIGHLIGHTS --------------*/

  useEffect(() => {

    if (!book) return;

    const savedHighlights =
      JSON.parse(
        localStorage.getItem(
          `highlights-${book.title}`
        )
      ) || [];

    console.log("Loaded Highlights:",savedHighlights);
    setHighlights(savedHighlights);

  }, [book]);

  /* SAVE RECENTLY OPENED BOOKS */

  useEffect(() => {

    if (!book) return;

    const existing =
      JSON.parse(
        localStorage.getItem(
          "recentBooks"
        )
      ) || [];

    const filtered =
      existing.filter(
        (b) => b.title !== book.title
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

  const handleSearch = () => {

    if (!searchText) return;

    console.log("Searching triggered");

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
          )
        ) || [];

      setBookmarks(savedBookmarks);

      /* Dark mode */

      const savedDarkMode =
        localStorage.getItem("darkMode");

      if (savedDarkMode) {

        setDarkMode(
          JSON.parse(savedDarkMode)
        );

      }

      /* Font size */

      const savedFontSize =
        localStorage.getItem("fontSize");

      if (savedFontSize) {

        setFontSize(savedFontSize);

      }

      /* Notes */

      let savedNotes = [];

      try {

        savedNotes =
          JSON.parse(
            localStorage.getItem(
              `notes-${book.title}`
            )
          ) || [];

      } catch {

        savedNotes = [];

      }

      setNotes(savedNotes);

    }

  }, [book]);

  /* SAVE SETTINGS */

  useEffect(() => {

    localStorage.setItem(
      "darkMode",
      JSON.stringify(darkMode)
    );

    localStorage.setItem(
      "fontSize",
      fontSize
    );

  }, [darkMode, fontSize]);

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
    ? `https://elysian-pages.onrender.com/${rawUrl.replaceAll("\\", "/")}`
    : "";

  const isPDF =
    fileUrl?.toLowerCase().endsWith(".pdf");

  const isEPUB =
    fileUrl?.toLowerCase().endsWith(".epub");

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

  const deleteBookmark = (index) => {

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

  const saveNotes = (updatedNotes) => {

    localStorage.setItem(
      `notes-${book.title}`,
      JSON.stringify(updatedNotes)
    );

  };

  return (

    <div
      style={{
        padding: "20px",
        backgroundColor:
          darkMode ? "#111" : "#fff",
        color:
          darkMode ? "white" : "black",
        minHeight: "100vh",
      }}
    >

<button
  onClick={() => setShowMenu(!showMenu)}
  style={{
    position: "fixed",
    top: "20px",
    left: "20px",
    zIndex: 9999,
    background: "#3d2b1f",
    color: "#f5d7a1",
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "22px",
  }}
>
  ☰
</button>

{showMenu && (
  <div
    style={{
      position: "fixed",
      top: "80px",
      left: "20px",
      width: "250px",
      background: "#3d2b1f",
      color: "#f5d7a1",
      padding: "20px",
      borderRadius: "15px",
      zIndex: 9998,
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
    }}
  >
    {showHighlights && (
  <HighlightSection
    highlights={highlights}
    setHighlights={setHighlights}
    book={book}
  />
)}
{showBookmarks && (
  <BookmarkSection
    isEPUB={isEPUB}
    bookmarks={bookmarks}
    addBookmark={addBookmark}
    deleteBookmark={deleteBookmark}
    setLocationState={setLocationState}
  />
)}
{showNotes && (
  <NotesSection
    notes={notes}
    setNotes={setNotes}
    saveNotes={saveNotes}
  />
)}
    <h3>Reader Menu</h3>

    <button
  onClick={() => setShowHighlights(!showHighlights)}
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  }}
>
  Highlights
</button>

    <button
  onClick={() =>
    setShowBookmarks(
      !showBookmarks
    )
  }
  style={{
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  }}
>
  Bookmarks
</button>

    <button
  onClick={() =>
    setShowNotes(!showNotes)
  }
  style={{
    width: "100%",
    padding: "10px",
  }}
>
  Notes
</button>
  </div>
)}

      <div
  style={{
    marginBottom: "5px",
  }}
>
  <h2 style={{margin:0,
    fontSize:"24px",
  }}>
    {book.title}
  </h2>

  <p style={{opacity:0.7,
    margin:0,
    fontSize:"14px",
  }}>
    {book.author}
  </p>
</div>

<hr />

      {/* SEARCH */}

      <SearchBar
        searchText={searchText}
        setSearchText={setSearchText}
        handleSearch={handleSearch}
        darkMode={darkMode}
      />

{/*READER TOOLBAR TEMPORARILY HIDDEN */}
<ReaderToolbar
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  fontSize={fontSize}
  setFontSize={setFontSize}
/>
{/* PDF VIEWER */}

{isPDF && (
  <PDFViewer fileUrl={fileUrl} />
)}

{/* EPUB VIEWER */}

{isEPUB && (

  <EPUBViewer
    fileUrl={fileUrl}
    locationState={locationState}
    setLocationState={setLocationState}
    book={book}
    darkMode={darkMode}
    fontSize={fontSize}
    searchText={searchText}
    setHighlights={setHighlights}
  />

)}

      {/* FALLBACK TEXT */}

      {!isPDF && !isEPUB && (

        <p
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: "1.8",
          }}
        >
          {book.content}
        </p>

      )}
    </div>
  );

}

export default Reader;