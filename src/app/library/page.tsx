"use client";

import { useEffect, useState } from "react";
import { useReveal } from "@/lib/motion";
import AppNav from "@/components/ui/AppNav";
import { useRouter } from "next/navigation";
import { putReaderBook } from "@/lib/book-handoff";
import type { Book } from "@/lib/types";

function Library() {
  const pageRef = useReveal<HTMLDivElement>();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);

  /* FETCH BOOKS */
  useEffect(()=>{
    const fetchBooks=async()=>{
      try{
        const response=await fetch("/api/books");
        if (!response.ok){
          throw new Error("Failed to fetch books");
        }
        const data=await response.json();
        console.log("BOOKS FROM BACKEND: ",data);
        setBooks(data);
      }
      catch (error){
        console.error("Error fetching books: ",error);
      }
    };
    fetchBooks();
  },[]);

  return (

    <div className="page interior-page" ref={pageRef}><AppNav />

      {/* HEADER */}
      <div className="page-head row row--between">

        <h1 className="display t-title" data-reveal>
          Public Library
        </h1>

        <button
          className="btn btn--secondary"
          onClick={() => router.push("/dashboard")}
        >
          Back
        </button>

      </div>

      {/* SEARCH */}
      <div style={{ padding: "0 40px" }}>

        <input
          type="text"
          placeholder="Search books..." aria-label="Search books..."
          className="input shelf-search"
        />

      </div>

      {/* BOOK GRID */}
      <div className="book-grid">

        {books.length === 0 ? (

          <h2>No books available yet.</h2>

        ) : (

          books.map((book, index) => (

            <div
              key={index}
              className="book-card" data-reveal
            >

              {/* BOOK COVER */}
              <img
                  src={book.cover_url?.startsWith("http")
                        ? book.cover_url
                        : `https://elysian-pages.onrender.com/${book.cover_url}`}
                  alt={book.title}
                  className="shelf-cover"
              />

              {/* TITLE */}
              <h2>{book.title}</h2>

              {/* AUTHOR */}
              <p>{book.author}</p>

              {/* CATEGORY */}
              <span className="tag">
                {book.category}
              </span>

              {/* BUTTONS */}
              <div className="book-card__actions">

                {/* READ */}
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    putReaderBook(book);
                    router.push("/reader");
                  }}
                >
                  Read Now
                </button>

                {/* ADD TO LIBRARY */}
                <button
                  className="btn btn--secondary"

                  onClick={() => {

                    const existingBooks =
                      JSON.parse(
                        localStorage.getItem(
                          "myLibrary"
                        ) || "[]"
                      ) || [];

                    /* Prevent duplicates */
                    const alreadyExists =
                      existingBooks.find(
                        (b: Book) =>
                          b.title === book.title
                      );

                    if (alreadyExists) {

                      alert(
                        "Book already added!"
                      );

                      return;
                    }

                    existingBooks.push(book);

                    localStorage.setItem(
                      "myLibrary",
                      JSON.stringify(existingBooks)
                    );

                    alert(
                      "Book added to My Library!"
                    );
                  }}
                >
                  Add to Library
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

/* ---------------- STYLES ---------------- */

export default Library;
