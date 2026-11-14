"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, CSSProperties } from "react";
import { useReveal } from "@/lib/motion";
import AppNav from "@/components/ui/AppNav";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { putReaderBook } from "@/lib/book-handoff";
import type { Book, PrivateBook } from "@/lib/types";

function MyLibrary() {
  const pageRef = useReveal<HTMLDivElement>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const [isUploadExpanded, setIsUploadExpanded]=useState(false);

  // Existing books saved from the public library.
  const [myBooks,setMyBooks] = useState<Book[]>([]);

  // Books uploaded privately by this user.
  const [privateBooks, setPrivateBooks] = useState<PrivateBook[]>([]);
  const [loadingPrivateBooks, setLoadingPrivateBooks] =
    useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string|null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [selectedFile, setSelectedFile] = useState<File|null>(null);
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
        `/api/private-books`,
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
      setErrorMessage((error as Error).message || "Could not load uploaded books.");
    } finally {
      setLoadingPrivateBooks(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    loadPrivateBooks();
  }, [loadPrivateBooks]);
  useEffect(() => {
    try {
      const savedBooks = JSON.parse(
        localStorage.getItem("myLibrary") || "[]"
      );
      setMyBooks(Array.isArray(savedBooks) ? savedBooks : []);
    } catch {
      setMyBooks([]);
    }
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setMessage("");
    setErrorMessage("");

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
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

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!selectedFile) {
      setErrorMessage("Please select a PDF or EPUB book first.");
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";

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
        `/api/private-books`,
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
      setErrorMessage((error as Error).message || "Book upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleReadPrivateBook = async (book: PrivateBook) => {
    setMessage("");
    setErrorMessage("");

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `/api/private-books/${encodeURIComponent(String(book.id))}/read`,
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

      putReaderBook({
        ...book,
        ...readableBook,
        file_type: readableBook.file_type || book.file_type,
      });
      router.push("/reader");
    } catch (error) {
      setErrorMessage((error as Error).message || "Could not open this book.");
    }
  };

  const handleDeletePrivateBook = async (book: PrivateBook) => {
    const confirmed = window.confirm(
      `Delete "${book.title}" from your uploaded books? This cannot be undone.`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");
    setDeletingBookId(String(book.id));

    try {
      const token = await getAccessToken();

      const response = await fetch(
        `/api/private-books/${encodeURIComponent(String(book.id))}`,
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
      setErrorMessage((error as Error).message || "Could not delete this book.");
    } finally {
      setDeletingBookId(null);
    }
  };

  const handleReadPublicBook = (book: Book) => {
    putReaderBook(book);
    router.push("/reader");
  };

  const handleRemovePublicBook=(book: Book)=>{
    const confirmed=window.confirm(
      `Remove "${book.title}" from My Library? The public book will remain avaliable to everyone.`
    );
    if (!confirmed) return;
    const updatedBooks=myBooks.filter((item)=>item.id !== book.id);
    setMyBooks(updatedBooks);
    localStorage.setItem("myLibrary",JSON.stringify(updatedBooks));
  };

  return (
    <div className="page" ref={pageRef}><AppNav />
      <main className="container">
        <header className="page-head row row--between">
          <div>
            <p className="eyebrow">YOUR PERSONAL BOOKSHELF</p>
            <h1 className="display t-title" data-reveal>My Library</h1>
            <p className="lede">
              Your saved favourites and your own uploaded books, all in
              one place.
            </p>
          </div>
        </header>

        {message && (
          <div role="status" className="alert alert--success">
            {message}
          </div>
        )}

        {errorMessage && (
          <div role="alert" className="alert alert--error">
            {errorMessage}
          </div>
        )}

        {/* SECTION 1: BOOKS SAVED FROM THE PUBLIC LIBRARY */}
        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">Books from the Public Library</h2>
              <p className="section__desc">
                Books you selected using Add to Library.
              </p>
            </div>
            <span className="tag tag--count">{myBooks.length} books</span>
          </div>

          {myBooks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">📚</div>
              <h3 className="empty-state__title">Your saved shelf is empty</h3>
              <p className="empty-state__text">
                Explore the public library and add books you want to read.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => router.push("/library")}
              >
                Explore Library
              </button>
            </div>
          ) : (
            <div className="book-grid">
              {myBooks.map((book, index) => (
                <article
                  key={book.id || `${book.title}-${index}`}
                  className="book-card" data-reveal
                >
                  {book.cover_url?(
                    <img src={book.cover_url.startsWith("http")
                      ? book.cover_url:
                      `https://elysian-pages.onrender.com/${book.cover_url}`}
                      alt={`Cover of ${book.title||"Untitled Book"}`}
                      className="shelf-cover"
                      onError={(event)=>{
                        event.currentTarget.style.display="none";
                      }}/>
                  ):(
                    <div className="shelf-placeholder">Cover</div>
                  )}
                  <h3 className="book-card__title">
                    {book.title || "Untitled Book"}
                  </h3>
                  <p className="book-card__author">
                    {book.author || "Unknown Author"}
                  </p>
                  <span className="tag">Public library</span>

                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleReadPublicBook(book)}
                  >
                    Read Book
                  </button>
                  <button type="button"
                  className="btn btn--danger"
                  onClick={()=>handleRemovePublicBook(book)}>
                    Remove from My Library
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="divider" />

        {/* SECTION 2: BOOKS UPLOADED BY THIS USER */}
        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">My Uploaded Books</h2>
              <p className="section__desc">
                Private to your account. Upload your own PDF or EPUB files.
              </p>
            </div>
            <span className="tag tag--count">
              {privateBooks.length} books
            </span>
          </div>

          <div className="surface panel">
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
                <h3 className="panel__title">Add book to your shelf</h3>
                <p className="section__desc">
                  PDF or EPUB. Max file size: 50MB
                </p>
              </div>
              <span aria-hidden="true"
              style={{color:"var(--accent-hi)",
                fontSize:"20px",
                paddingLeft:"10px",
              }}>
                {isUploadExpanded?"^":"⌄"}
              </span>
            </button>
            {isUploadExpanded && (
              <form onSubmit={handleUpload}
              style={{marginTop:"4px"}}>
                <div className="form-grid">
                  <label className="field">
                    Book title
                    <input type="text"
                    value={title}
                    onChange={(event)=>setTitle(event.target.value)}
                    placeholder="Enter the book title" aria-label="Enter the book title"
                    maxLength={200}
                    className="input"/>
                  </label>
                  <label className="field">
                    Author
                    <input type="text"
                    value={author}
                    onChange={(event)=>setAuthor(event.target.value)}
                    placeholder="Enter the author's name" aria-label="Enter the author's name"
                    maxLength={200}
                    className="input"/>
                  </label>
                </div>
                <label className="field">
                  Choose your book file
                  <input ref={fileInputRef}
                  type="file"
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onChange={handleFileChange}
                  className="input"/>
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
            <p className="status-text">Loading your uploaded books...</p>
          ) : privateBooks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">✨</div>
              <h3 className="empty-state__title">A shelf waiting for your stories</h3>
              <p className="empty-state__text">
                Upload your first PDF or EPUB above. Your uploaded books
                will appear here and remain separate from the public library.
              </p>
            </div>
          ) : (
            <div className="book-grid">
              {privateBooks.map((book) => (
                <article key={book.id} className="book-card" data-reveal>
                  <div className="shelf-placeholder">
                    {book.file_type === "pdf" ? "📄" : "📘"}
                  </div>

                  <h3 className="book-card__title">
                    {book.title || book.file_name || "Untitled Book"}
                  </h3>

                  <p className="book-card__author">
                    {book.author || "Unknown Author"}
                  </p>

                  <span className="tag">
                    Private · {(book.file_type || "").toUpperCase()}
                  </span>

                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => handleReadPrivateBook(book)}
                  >
                    Read Book
                  </button>

                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => handleDeletePrivateBook(book)}
                    disabled={deletingBookId === String(book.id)}
                  >
                    {deletingBookId === String(book.id)
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

const uploadHeadingStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "22px",
};
const uploadIconStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  flexShrink: 0,
  borderRadius: "12px",
  background: "var(--accent-ring)",
  color: "var(--accent-hi)",
  fontSize: "28px",
};

const selectedFileStyle: CSSProperties = {
  color: "var(--success)",
  fontSize: "13px",
  overflowWrap: "anywhere",
};
const primaryButtonStyle: CSSProperties = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "10px",
  background: "var(--accent)",
  color: "var(--accent-contrast)",
  cursor: "pointer",
  fontWeight: "700",
};

export default MyLibrary;
