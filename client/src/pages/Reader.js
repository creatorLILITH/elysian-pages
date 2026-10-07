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
    console.log("CURRENT BOOK:",book);
    console.log("CURRENT BOOK ID:",book?.id);
  /*--------- STATES ---------*/
  const [locationState, setLocationState] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [darkMode, setDarkMode] = useState(()=>{
    const savedDarkMode= localStorage.getItem("darkMode");
    return savedDarkMode?JSON.parse(savedDarkMode):false;
  });
  const [readerTheme, setReaderTheme] = useState(()=>{
    const savedReaderTheme=localStorage.getItem("readerTheme");
    return savedReaderTheme||"classicLight";
  });
  const readerThemes={
    classicLight:{name:"Classic Light",background:"#FFFFFF",text:"#000000",},
    classicDark:{name:"Classic Dark",background:"#000000",text:"#FFFFFF",},
    mistyBlue:{name:"Misty Blue",background:"#E1E9ED",text:"#303A40",accent:"#668996"},
    dustyRose:{name:"Dusty Rose",background:"#ECDCDF",text:"#403436",accent:"#9B717C",},
    midnightLibrary:{name:"Midnight Library",background:"#171A22",text:"#E3E4EA",accent:"#8995B5",},
    candlelight:{name:"Candlelight",background:"#F1E6CF",text:"#3C3328",accent:"#A3824F",},
    sageGreen:{name:"Sage Green",background:"#E1E8DD",text:"#30382F",accent:"#71856C",},
    coffeeCream:{name:"Coffee & Cream",background:"#F6EFE3",text:"#3B3028",accent:"#A87545",},
    winterMist:{name:"Winter Mist",background:"#E5E7E8",text:"#34383A",accent:"#748999",},
    forestNight:{name:"Forest Night",background:"#18221E",text:"#D7DDD8",accent:"#829B88",},
  };
  useEffect(()=>{
    localStorage.setItem("readerTheme",readerTheme);
  },[readerTheme]);
  const [fontSize, setFontSize] = useState(18);
  const [searchText, setSearchText] = useState("");
  const [searchRequest, setSearchRequest] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlights, setHighlights] = useState(()=>{
    if(!book) return[];
    return JSON.parse(localStorage.getItem(`highlights-${book.id}`))||[];
  });
  useEffect(()=>{
    if (!book) return;
    localStorage.setItem(`highlights-${book.id}`,JSON.stringify(highlights));
  },[highlights, book]);
  const [removeHighlight, setRemoveHighlight]=useState(null);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState("");
  const [dictionaryData, setDictionaryData] = useState(null);

  useEffect(()=>{
    const fetchDefinition=async()=>{
      if (!showDictionary||!dictionaryWord){
        return;
      }
      const word=dictionaryWord.trim().split(/\s+/)[0];
      try{
        setDictionaryData(null);
        const response= await fetch(`http://localhost:5000/dictionary/${encodeURIComponent(word)}`);
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

  const handleSearch=()=>{
    const query=searchText.trim();
    if (!query) return;
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setSearchRequest(query);
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
          )
        ) || [];

      setBookmarks(savedBookmarks);

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
  ? (rawUrl.startsWith("http")
  ? rawUrl
  :`https://elysian-pages.onrender.com/${rawUrl.replaceAll("\\","/")}`)
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
      paddingBottom: "90px",
      backgroundColor: readerThemes[readerTheme].background,
      color: readerThemes[readerTheme].text,
      minHeight: "100vh",
    }}
  >

    {/* READER GRID */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          showHighlights || showBookmarks || showNotes || showDictionary
            ? "minmax(0, 1fr) 320px"
            : "minmax(0, 1fr)",
        gap: "20px",
        alignItems: "start",
        transition: "grid-template-columns 0.3s ease",
      }}
    >

      {/* MAIN BOOK AREA */}
      <div style={{ minWidth: 0 }}>
      
      {/* FALLBACK TEXT */}
    {!isPDF && !isEPUB && (
      <p
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: "1.8",
        }}>
        {book.content}
      </p>
    )}


        {/* BOOK INFORMATION */}
        <div style={{ marginBottom: "5px" }}>
          <h2
            style={{
              opacity: 0.7,
              fontSize: "24px",
            }}
          >
            {book.title}
          </h2>

          <p
            style={{
              opacity: 0.7,
              margin: 0,
              fontSize: "14px",
            }}
          >
            {book.author}
          </p>
        </div>

        <hr />

        {/* SEARCH */}
        {showSearch && (<>
          <SearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          handleSearch={handleSearch}
          darkMode={darkMode}
        />

        <p>
          Search Results:{searchResults.length}
        </p>

        <button onClick={goToNextSearchResult}>
          Next Result
        </button>

        <button onClick={goToPreviousSearchResult}>
          Previous Result
        </button>
        </>
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
        />

        {/* PDF VIEWER */}
        {isPDF && (
          <PDFViewer fileUrl={fileUrl} />
        )}

        {/* EPUB VIEWER */}
        {isEPUB && (
          <div
            style={{
              paddingBottom: "90px",
              minWidth: 0,
            }}
          >
            <EPUBViewer
              fileUrl={fileUrl}
              locationState={locationState}
              setLocationState={setLocationState}
              book={book}
              darkMode={darkMode}
              fontSize={fontSize}
              searchText={searchText}
              setSearchResults={setSearchResults}
              searchResults={searchResults}
              currentSearchIndex={currentSearchIndex}
              setHighlights={setHighlights}
              readerTheme={readerTheme}
              readerThemes={readerThemes}
              setRemoveHighlight={setRemoveHighlight}
              onDictionaryOpen={(word) => {
                setDictionaryWord(word);
                setShowDictionary(true);
              }}
            />
          </div>
        )}

      </div>

      {/* RIGHT-SIDE UTILITY PANEL */}
      {(showHighlights || showBookmarks || showNotes || showDictionary) && (
        <div style={{width:"100%",
          maxHeight:"70vh",
          overflowY: "auto",
            background: readerThemes[readerTheme].background,
            color: readerThemes[readerTheme].text,
            padding: "20px",
            borderRadius: "15px",
            boxSizing: "border-box",
            boxShadow: "0 8px 10px rgba(0,0,0,0.3)",
            border: `1px solid ${
              readerThemes[readerTheme].accent ||
              readerThemes[readerTheme].text
            }`,
            position: "sticky",
            top: "20px",
          }}
        >

          {showHighlights && (
            <div
              style={{
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <button
                onClick={() => setShowHighlights(false)}
                title="Close Highlights"
                aria-label="Close Highlights"
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

              <HighlightSection
                highlights={highlights}
                setHighlights={setHighlights}
                book={book}
                removeHighlight={removeHighlight}
              />
            </div>
          )}

          {showBookmarks && (
            <div
              style={{
                position: "relative",
                marginBottom: "25px",
              }}
            >
              <button
                onClick={() => setShowBookmarks(false)}
                title="Close Bookmarks"
                aria-label="Close Bookmarks"
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

                      {meaning.definitions.map(
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

        </div>
      )}

    </div>
  </div>
);
}

export default Reader;