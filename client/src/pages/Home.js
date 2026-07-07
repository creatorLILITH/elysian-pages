import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {

  const [books, setBooks] =
    useState([]);

  const [favoriteBooks, setFavoriteBooks] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const navigate =
    useNavigate();

  /* ---------------- OPEN READER ---------------- */

  const openBook =
    (book) => {

      navigate("/reader", {
        state: book,
      });
    };

  /* ---------------- FETCH BOOKS ---------------- */

  useEffect(() => {

    fetch(
      "http://https://elysian-pages.onrender.com/books"
    )
      .then((res) =>
        res.json()
      )

      .then((data) => {

        console.log(
          "Fetched books:",
          data
        );

        // Prevent undefined entries
        const cleanBooks =
          data.filter(
            (book) =>
              book &&
              book.title
          );

        setBooks(cleanBooks);
      })

      .catch((err) => {

        console.error(
          "Failed to fetch books:",
          err
        );
      });

    /* Load Favorites */

    const savedFavorites =
      JSON.parse(
        localStorage.getItem(
          "favoriteBooks"
        )
      ) || [];

    setFavoriteBooks(
      savedFavorites
    );

  }, []);

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload =
    async (e) => {

      const file =
        e.target.files[0];

      if (!file) return;

      const formData =
        new FormData();

      formData.append(
        "book",
        file
      );

      try {

        const res =
          await fetch(
            "http://https://elysian-pages.onrender.com/upload",
            {
              method: "POST",
              body: formData,
            }
          );

        const data =
          await res.json();

        console.log(
          "Uploaded:",
          data
        );

        if (
          data.book &&
          data.book.title
        ) {

          setBooks((prev) => [
            data.book,
            ...prev,
          ]);

          alert(
            "Book uploaded successfully!"
          );

        } else {

          alert(
            "Upload succeeded but returned invalid data."
          );
        }

      } catch (err) {

        console.error(err);

        alert(
          "Upload failed!"
        );
      }
    };

  /* ---------------- FAVORITES ---------------- */

  const toggleFavorite =
    (book) => {

      let updatedFavorites =
        [...favoriteBooks];

      const exists =
        updatedFavorites.find(
          (b) =>
            b.title ===
            book.title
        );

      if (exists) {

        updatedFavorites =
          updatedFavorites.filter(
            (b) =>
              b.title !==
              book.title
          );

      } else {

        updatedFavorites.unshift(
          book
        );
      }

      setFavoriteBooks(
        updatedFavorites
      );

      localStorage.setItem(
        "favoriteBooks",

        JSON.stringify(
          updatedFavorites
        )
      );
    };

  /* ---------------- CHECK FAVORITE ---------------- */

  const isFavorite =
    (book) => {

      return favoriteBooks.some(
        (b) =>
          b.title ===
          book.title
      );
    };

  /* ---------------- SEARCH FILTER ---------------- */

  const filteredBooks =
    books.filter(
      (book) =>
        book &&
        book.title &&
        book.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          )
    );

  /* ---------------- UI ---------------- */

  return (

    <div className="home-page">

      {/* NAVBAR */}

      <nav className="home-navbar">

        <div className="home-logo">
          Elysian Pages
        </div>

        <div className="home-nav-links">

          <button>
            Home
          </button>

          <button>
            Discover
          </button>

          <button>
            Profile
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section
        className="continue-reading"
      >

        <div
          className="continue-overlay"
        >

          <h1>
            Continue Reading
          </h1>

          <p>
            Return to your current
            story and continue your
            journey.
          </p>

          {books.length > 0 && (

            <button
              className="continue-button"

              onClick={() =>
                openBook(
                  books[0]
                )
              }
            >
              Open Current Book
            </button>

          )}

        </div>

      </section>

      {/* SEARCH */}

      <section
        className="search-section"
      >

        <h2>
          Search Books
        </h2>

        <input
          type="text"

          placeholder="Search by title..."

          value={searchTerm}

          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }

          className="search-input"
        />

      </section>

      {/* UPLOAD */}

      <section
        className="upload-section"
      >

        <label
          className="upload-label"
        >
          Upload Book
        </label>

        <input
          type="file"

          accept=".pdf,.epub"

          onChange={
            handleFileUpload
          }
        />

      </section>

      {/* BOOKS */}

      <section
        className="books-section"
      >

        <h2>
          Available Books
        </h2>

        <div className="books-grid">

          {filteredBooks.map(
            (book) => (

              <div
                key={
                  book.id
                }

                className="book-card"
              >

                {/* COVER */}

                <img
                  src={
                    book.cover_url ||
                    "https://via.placeholder.com/300x450?text=No+Cover"
                  }

                  alt={
                    book.title
                  }

                  className="book-cover"
                />

                {/* INFO */}

                <div
                  className="book-info"
                >

                  <h3
                    className="book-title"
                  >
                    {book.title}
                  </h3>

                  <p
                    className="book-author"
                  >
                    {
                      book.author
                    }
                  </p>

                  <span
                    className="genre-tag"
                  >
                    {
                      book.genre
                    }
                  </span>

                  {/* BUTTONS */}

                  <div
                    className="book-buttons"
                  >

                    <button
                      onClick={() =>
                        openBook(
                          book
                        )
                      }
                    >
                      Read Book
                    </button>

                    <button
                      onClick={() =>
                        toggleFavorite(
                          book
                        )
                      }
                    >
                      {isFavorite(
                        book
                      )
                        ? "♥"
                        : "♡"}
                    </button>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </section>

    </div>
  );
}

export default Home;