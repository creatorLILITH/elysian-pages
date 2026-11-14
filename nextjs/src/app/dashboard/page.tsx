"use client";

import { useEffect, useState } from "react";
import { useReveal } from "@/lib/motion";
import AppNav from "@/components/ui/AppNav";
import { useRouter } from "next/navigation";
import { putReaderBook } from "@/lib/book-handoff";
import { resolveCoverUrl } from "@/lib/covers";
import type { Book } from "@/lib/types";

function UserDashboard() {
  const pageRef = useReveal<HTMLDivElement>();

  const router = useRouter();
  const [recentBooks, setRecentBooks]=useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);

  useEffect(() => {
    const storedMyBooks: Book[] =
      JSON.parse(
        localStorage.getItem("myLibrary")
          || "[]"
      ) || [];
    setMyBooks(storedMyBooks);
  }, []);

    useEffect(() => {
  const fetchRecentBooks = async () => {
    try {
      const response = await fetch(
        "/api/books"
      );

      const publicBooks = await response.json();

      const storedRecentBooks: Book[] =
        JSON.parse(
          localStorage.getItem("recentBooks") || "[]"
        ) || [];

      const validRecentBooks =
        storedRecentBooks.filter((recentBook) =>
          publicBooks.some(
            (publicBook: Book) =>
              publicBook.title === recentBook.title
          )
        );

      setRecentBooks(validRecentBooks);
    } catch (error) {
      console.error(
        "Error checking recent books:",
        error
      );
    }
  };

  fetchRecentBooks();
}, []);

  const featured = recentBooks[0];
  const openBook = (book: Book) => { putReaderBook(book); router.push("/reader"); };
  const renderShelf = (books: Book[], action: string) => books.map((book, index) => (
    <article className="book-card" key={book.id || index}>
      <div className="book-card__frame">{book.cover_url
        ? <img src={resolveCoverUrl(book.cover_url)} alt={book.title} className="book-card__cover" loading="lazy" />
        : <div className="shelf-placeholder">{book.title}</div>}
      </div>
      <h3 className="book-card__title">{book.title}</h3>
      <p className="book-card__author">{book.author}</p>
      <button className="btn btn--secondary btn--sm" onClick={() => openBook(book)}>{action} ↗</button>
    </article>
  ));

  return (
    <div className="page dashboard-workspace" ref={pageRef}>
      <AppNav />
      <main className="workspace-content">
        <section className="dashboard-opening" data-reveal>
          <div className="dashboard-welcome">
            <p className="eyebrow">THE READING ROOM</p>
            <h1>Happy reading,<br /><span>and welcome back.</span></h1>
            <p>A familiar story. A new perspective. Pick up where you left off, or find something to get lost in.</p>
            <button className="btn btn--primary" onClick={() => featured ? openBook(featured) : router.push("/library")}>{featured ? "Continue reading" : "Explore the library"} <span aria-hidden="true">↗</span></button>
          </div>
          <div className="dashboard-feature">
            {featured ? <>
              {featured.cover_url && <img src={resolveCoverUrl(featured.cover_url)} alt={featured.title} />}
              <div><p className="eyebrow">BACK TO YOUR STORY</p><h2>{featured.title}</h2><p>{featured.author}</p><button className="btn btn--ghost" onClick={() => openBook(featured)}>Open book ↗</button></div>
            </> : <div className="dashboard-book-art" aria-hidden="true"><div className="paper-page"><span>ELYSIAN PAGES</span><strong>One more<br /><em>chapter.</em></strong><i>There is always another world<br />waiting on the next page.</i></div><div className="paper-page"><span>THE READING ROOM</span><div className="paper-lines" /><b>ep.</b></div></div>}
          </div>
        </section>
        <div className="dashboard-shelves">
          <section className="dashboard-saved">
            <div className="section__head"><h2 className="section__title">On your bookshelf <span className="shelf-count">{myBooks.length}</span></h2><button className="btn btn--ghost btn--sm" onClick={() => router.push("/mylibrary")}>View all ↗</button></div>
            {myBooks.length ? <div className="book-grid">{renderShelf(myBooks, "Read")}</div> : <div className="workspace-empty"><span aria-hidden="true">↗</span><h3>A little room for your favourites.</h3><p>Books you save from the public library will be waiting here.</p><button className="btn btn--secondary" onClick={() => router.push("/library")}>Find your next read</button></div>}
          </section>
          <section className="dashboard-recent">
            <div className="section__head"><h2 className="section__title">Recently opened</h2><span className="small muted">{recentBooks.length} books</span></div>
            {recentBooks.length ? <div className="recent-list">{renderShelf(recentBooks, "Continue")}</div> : <div className="workspace-empty"><h3>Your story starts here.</h3><p>Recently read books will appear here, ready for your return.</p></div>}
          </section>
        </div>
      </main>
    </div>
  );
}

/* STYLES */

export default UserDashboard;
