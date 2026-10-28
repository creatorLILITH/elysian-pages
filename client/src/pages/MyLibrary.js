
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const API_BASE_URL = "https://elysian-pages.onrender.com";

function MyLibrary() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isUploadExpanded, setIsUploadExpanded]=useState(false);

  // Existing books saved from the public library.
  const [myBooks,setMyBooks] = useState(() => {
    try {
      const savedBooks = JSON.parse(
        localStorage.getItem("myLibrary") || "[]"
      );
      return Array.isArray(savedBooks) ? savedBooks : [];
    } catch {
      return [];
    }
  });

  // Books uploaded privately by this user.
  const [privateBooks, setPrivateBooks] = useState([]);
  const [loadingPrivateBooks, setLoadingPrivateBooks] =
    useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error("Could not verify your login. Please try again.");
    }

    if (!session?.access_token) {
      throw new Error("Please log in again to manage your books.");
    }

    return session.access_token;
  }, []);

  const loadPrivateBooks = useCallback(async () => {
    setLoadingPrivateBooks(true);
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/private-books`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Could not load your uploaded books."
        );
      }

      // The backend returns an array of private book records.
      setPrivateBooks(Array.isArray(result) ? result : result.books || []);
    } catch (error) {
      setErrorMessage(error.message || "Could not load uploaded books.");
    } finally {
      setLoadingPrivateBooks(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadPrivateBooks();
  }, [loadPrivateBooks]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setMessage("");
    setErrorMessage("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExtension = ["pdf", "epub"].includes(extension);
    const validMimeTypes = [
      "application/pdf",
      "application/epub+zip",
    ];

    if (!validExtension) {
      setSelectedFile(null);
      setErrorMessage("Please choose a PDF or EPUB file.");
      event.target.value = "";
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setSelectedFile(null);
      setErrorMessage("The file must be 50 MB or smaller.");
      event.target.value = "";
      return;
    }

    // Some browsers report an empty MIME type for EPUB files.
    if (
      file.type &&
      !validMimeTypes.includes(file.type)
    ) {
      setSelectedFile(null);
      setErrorMessage(
        "The selected file has an unsupported file type."
      );
      event.target.value = "";
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!selectedFile) {
      setErrorMessage("Please select a PDF or EPUB book first.");
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "epub"].includes(extension)) {
      setErrorMessage("Only PDF and EPUB files are supported.");
      return;
    }

    setUploading(true);

    try {
      const token = await getAccessToken();
      const formData = new FormData();

      formData.append("book", selectedFile);

      if (title.trim()) {
        formData.append("title", title.trim());
      }

      if (author.trim()) {
        formData.append("author", author.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/private-books`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Book upload failed. Please try again."
        );
      }

      setTitle("");
      setAuthor("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("Your book has been uploaded successfully!");
      await loadPrivateBooks();
    } catch (error) {
      setErrorMessage(error.message || "Book upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleReadPrivateBook = async (book) => {
    setMessage("");
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/private-books/${encodeURIComponent(book.id)}/read`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Could not open this book."
        );
      }

      // The backend returns a short-lived signed URL.
      const readableBook = result.book || result;

      if (!readableBook.file_url) {
        throw new Error("The reader URL was not returned by the server.");
      }

      navigate("/reader", {
        state: {
          book: {
            ...book,
            ...readableBook,
            file_type: readableBook.file_type || book.file_type,
          },
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not open this book.");
    }
  };

  const handleDeletePrivateBook = async (book) => {
    const confirmed = window.confirm(
      `Delete "${book.title}" from your uploaded books? This cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");
    setDeletingBookId(book.id);

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `${API_BASE_URL}/private-books/${encodeURIComponent(book.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.error || "Could not delete this book."
        );
      }

      setPrivateBooks((currentBooks) =>
        currentBooks.filter((item) => item.id !== book.id)
      );

      setMessage("The uploaded book has been deleted.");
    } catch (error) {
      setErrorMessage(error.message || "Could not delete this book.");
    } finally {
      setDeletingBookId(null);
    }
  };

  const handleReadPublicBook = (book) => {
    navigate("/reader", {
      state: {
        book,
      },
    });
  };

  const handleRemovePublicBook=(book)=>{
    const confirmed=window.confirm(
      `Remove "${book.title}" from My Library? The public book will remain avaliable to everyone.`
    );
    if (!confirmed) return;
    const updatedBooks=myBooks.filter((item)=>item.id !== book.id);
    setMyBooks(updatedBooks);
    localStorage.setItem("myLibrary",JSON.stringify(updatedBooks));
  };

  return (
    <div style={pageStyle}>
      <main style={mainStyle}>
        <header style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>YOUR PERSONAL BOOKSHELF</p>
            <h1 style={pageTitleStyle}>My Library</h1>
            <p style={introStyle}>
              Your saved favourites and your own uploaded books, all in
              one place.
            </p>
          </div>
        </header>

        {message && (
          <div role="status" style={successMessageStyle}>
            {message}
          </div>
        )}

        {errorMessage && (
          <div role="alert" style={errorMessageStyle}>
            {errorMessage}
          </div>
        )}

        {/* SECTION 1: BOOKS SAVED FROM THE PUBLIC LIBRARY */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitle}>Books from the Public Library</h2>
              <p style={sectionDescription}>
                Books you selected using Add to Library.
              </p>
            </div>
            <span style={countStyle}>{myBooks.length} books</span>
          </div>

          {myBooks.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>📚</div>
              <h3 style={emptyTitleStyle}>Your saved shelf is empty</h3>
              <p style={emptyTextStyle}>
                Explore the public library and add books you want to read.
              </p>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => navigate("/library")}
              >
                Explore Library
              </button>
            </div>
          ) : (
            <div style={bookGrid}>
              {myBooks.map((book, index) => (
                <article
                  key={book.id || `${book.title}-${index}`}
                  style={bookCard}
                >
                  {book.cover_url?(
                    <img src={book.cover_url.startsWith("http")
                      ? book.cover_url:
                      `https://elysian-pages.onrender.com/${book.cover_url}`}
                      alt={`Cover of ${book.title||"Untitled Book"}`}
                      style={publicBookCoverStyle}
                      onError={(event)=>{
                        event.currentTarget.style.display="none";
                      }}/>
                  ):(
                    <div style={bookIcon}>Cover</div>
                  )}
                  <h3 style={bookTitleStyle}>
                    {book.title || "Untitled Book"}
                  </h3>
                  <p style={bookAuthorStyle}>
                    {book.author || "Unknown Author"}
                  </p>
                  <span style={publicTagStyle}>Public library</span>

                  <button
                    type="button"
                    style={readButtonStyle}
                    onClick={() => handleReadPublicBook(book)}
                  >
                    Read Book
                  </button>
                  <button type="button"
                  style={deleteButtonStyle}
                  onClick={()=>handleRemovePublicBook(book)}>
                    Remove from My Library
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={sectionDividerStyle} />

        {/* SECTION 2: BOOKS UPLOADED BY THIS USER */}
        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitle}>My Uploaded Books</h2>
              <p style={sectionDescription}>
                Private to your account. Upload your own PDF or EPUB files.
              </p>
            </div>
            <span style={countStyle}>
              {privateBooks.length} books
            </span>
          </div>

          <div style={uploadPanelStyle}>
            <button type="button"
            onClick={()=>setIsUploadExpanded((expanded)=>!expanded)}
            aria-expanded={isUploadExpanded}
            style={{
              ...uploadHeadingStyle,
              width:"100%",
              marginBottom:isUploadExpanded?"22px":0,
              padding:0,
              border:"none",
              background:"transparent",
              color:"inherit",
              textAlign:"left",
              cursor:"pointer",
            }}>
              <span style={uploadIconStyle}>
                {isUploadExpanded?"-":"+"}
              </span>
              <div style={{flex:1}}>
                <h3 style={uploadTitleStyle}>Add book to your shelf</h3>
                <p style={uploadDescriptionStyle}>
                  PDF or EPUB. Max file size: 50MB
                </p>
              </div>
              <span aria-hidden="true"
              style={{color:"#f5d7a1",
                fontSize:"20px",
                paddingLeft:"10px",
              }}>
                {isUploadExpanded?"^":"⌄"}
              </span>
            </button>
            {isUploadExpanded && (
              <form onSubmit={handleUpload}
              style={{marginTop:"4px"}}>
                <div style={formGridStyle}>
                  <label style={labelStyle}>
                    Book title
                    <input type="text"
                    value={title}
                    onChange={(event)=>setTitle(event.target.value)}
                    placeholder="Enter the book title"
                    maxLength={200}
                    style={inputStyle}/>
                  </label>
                  <label style={labelStyle}>
                    Author
                    <input type="text"
                    value={author}
                    onChange={(event)=>setAuthor(event.target.value)}
                    placeholder="Enter the author's name"
                    maxLength={200}
                    style={inputStyle}/>
                  </label>
                </div>
                <label style={labelStyle}>
                  Choose your book file
                  <input ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onChange={handleFileChange}
                  style={fileInputStyle}/>
                </label>
                {selectedFile && (
                  <p style={selectedFileStyle}>
                    Selected:{selectedFile.name}(
                      {(selectedFile.size/(1024*1024)).toFixed(2)} MB)
                  </p>
                )}
                <button type="submit"
                style={{...primaryButtonStyle,
                  opacity:uploading? 0.65: 1,
                  cursor:uploading?"wait":"pointer",
                }}
                disabled={uploading}>
                  {uploading?"Uploading...":"Upload Book"}
                </button>
              </form>
            )}
            </div>
          {loadingPrivateBooks ? (
            <p style={statusTextStyle}>Loading your uploaded books...</p>
          ) : privateBooks.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>✨</div>
              <h3 style={emptyTitleStyle}>A shelf waiting for your stories</h3>
              <p style={emptyTextStyle}>
                Upload your first PDF or EPUB above. Your uploaded books
                will appear here and remain separate from the public library.
              </p>
            </div>
          ) : (
            <div style={bookGrid}>
              {privateBooks.map((book) => (
                <article key={book.id} style={bookCard}>
                  <div style={bookIcon}>
                    {book.file_type === "pdf" ? "📄" : "📘"}
                  </div>

                  <h3 style={bookTitleStyle}>
                    {book.title || book.file_name || "Untitled Book"}
                  </h3>

                  <p style={bookAuthorStyle}>
                    {book.author || "Unknown Author"}
                  </p>

                  <span style={privateTagStyle}>
                    Private · {(book.file_type || "").toUpperCase()}
                  </span>

                  <button
                    type="button"
                    style={readButtonStyle}
                    onClick={() => handleReadPrivateBook(book)}
                  >
                    Read Book
                  </button>

                  <button
                    type="button"
                    style={deleteButtonStyle}
                    onClick={() => handleDeletePrivateBook(book)}
                    disabled={deletingBookId === book.id}
                  >
                    {deletingBookId === book.id
                      ? "Deleting..."
                      : "Delete Book"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #24170f 0%, #3f2805 55%, #522c08 100%)",
  color: "#fff8ed",
};
const mainStyle = {
  width: "100%",
  maxWidth: "1400px",
  boxSizing: "border-box",
  margin: "0 auto",
  padding: "40px",
};
const headerStyle = {
  marginBottom: "42px",
};
const eyebrowStyle = {
  color: "#c9a77b",
  letterSpacing: "3px",
  fontSize: "12px",
  fontWeight: "700",
  marginBottom: "10px",
};
const pageTitleStyle = {
  color: "#f5d7a1",
  fontSize: "clamp(32px, 5vw, 46px)",
  margin: "0 0 12px",
};
const introStyle = {
  color: "#e2d0ba",
  lineHeight: "1.7",
  maxWidth: "650px",
  margin: 0,
};
const sectionStyle = {
  marginBottom: "38px",
};
const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
};
const sectionTitle = {
  color: "#f5d7a1",
  fontSize: "25px",
  margin: "0 0 8px",
};
const sectionDescription = {
  color: "#d9c4a9",
  margin: 0,
  lineHeight: "1.6",
};
const countStyle = {
  color: "#f5d7a1",
  border: "1px solid rgba(245,215,161,0.3)",
  borderRadius: "30px",
  padding: "8px 14px",
  fontSize: "13px",
  whiteSpace: "nowrap",
};
const bookGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "22px",
};
const bookCard = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "rgba(255,255,255,0.055)",
  padding: "26px 22px",
  borderRadius: "18px",
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
  minWidth: 0,
};
const bookIcon = {
  fontSize: "48px",
  marginBottom: "14px",
};
const publicBookCoverStyle={
  width:"120px",
  height:"170px",
  objectFit:"cover",
  borderRadius:"12px",
  marginBottom:"14px",
};
const bookTitleStyle = {
  color: "#fff2dd",
  fontSize: "18px",
  lineHeight: "1.5",
  overflowWrap: "anywhere",
  margin: "0 0 8px",
};
const bookAuthorStyle = {
  color: "#d9c4a9",
  fontSize: "14px",
  margin: "0 0 14px",
  overflowWrap: "anywhere",
};
const publicTagStyle = {
  color: "#e6d1ad",
  background: "rgba(164,113,72,0.2)",
  borderRadius: "20px",
  padding: "5px 10px",
  fontSize: "11px",
  marginBottom: "16px",
};
const privateTagStyle = {
  color: "#d9c9ff",
  background: "rgba(128,95,190,0.2)",
  border: "1px solid rgba(190,165,255,0.18)",
  borderRadius: "20px",
  padding: "5px 10px",
  fontSize: "11px",
  marginBottom: "16px",
};
const readButtonStyle = {
  width: "100%",
  marginTop: "auto",
  padding: "12px 18px",
  border: "none",
  borderRadius: "10px",
  background: "#a47148",
  color: "white",
  cursor: "pointer",
  fontWeight: "700",
};
const deleteButtonStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px 16px",
  border: "1px solid rgba(255,160,160,0.35)",
  borderRadius: "10px",
  background: "rgba(130,35,35,0.2)",
  color: "#ffc6c6",
  cursor: "pointer",
  fontWeight: "600",
};
const emptyStateStyle = {
  padding: "35px 24px",
  textAlign: "center",
  background: "rgba(255,255,255,0.035)",
  border: "1px dashed rgba(245,215,161,0.25)",
  borderRadius: "18px",
};
const emptyIconStyle = {
  fontSize: "38px",
  marginBottom: "10px",
};
const emptyTitleStyle = {
  color: "#f5d7a1",
  margin: "0 0 10px",
};
const emptyTextStyle = {
  color: "#d9c4a9",
  maxWidth: "520px",
  lineHeight: "1.7",
  margin: "0 auto 18px",
};
const uploadPanelStyle = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(245,215,161,0.2)",
  borderRadius: "18px",
  padding: "26px",
  marginBottom: "26px",
};
const uploadHeadingStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "22px",
};
const uploadIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "rgba(164,113,72,0.25)",
  color: "#f5d7a1",
  fontSize: "28px",
};
const uploadTitleStyle = {
  color: "#fff2dd",
  margin: "0 0 5px",
  fontSize: "18px",
};
const uploadDescriptionStyle = {
  color: "#d9c4a9",
  margin: 0,
  fontSize: "13px",
};
const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "18px",
};
const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "9px",
  color: "#f0ddc4",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "18px",
};
const inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px 13px",
  background: "rgba(0,0,0,0.2)",
  color: "#fff8ed",
  border: "1px solid rgba(245,215,161,0.25)",
  borderRadius: "9px",
  outlineColor: "#c9a77b",
};
const fileInputStyle = {
  boxSizing: "border-box",
  width: "100%",
  padding: "12px",
  background: "rgba(0,0,0,0.2)",
  color: "#e9d7c0",
  border: "1px dashed rgba(245,215,161,0.3)",
  borderRadius: "9px",
};
const selectedFileStyle = {
  color: "#cce7c7",
  fontSize: "13px",
  overflowWrap: "anywhere",
};
const primaryButtonStyle = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "10px",
  background: "#a47148",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "700",
};
const statusTextStyle = {
  color: "#e2d0ba",
  padding: "16px 0",
};
const successMessageStyle = {
  padding: "13px 16px",
  marginBottom: "20px",
  borderRadius: "10px",
  background: "rgba(70,130,75,0.18)",
  border: "1px solid rgba(140,220,140,0.3)",
  color: "#d5f3d5",
};
const errorMessageStyle = {
  padding: "13px 16px",
  marginBottom: "20px",
  borderRadius: "10px",
  background: "rgba(150,45,45,0.18)",
  border: "1px solid rgba(255,150,150,0.3)",
  color: "#ffd1d1",
};
const sectionDividerStyle = {
  height: "1px",
  background: "rgba(245,215,161,0.18)",
  margin: "38px 0",
};
export default MyLibrary;
