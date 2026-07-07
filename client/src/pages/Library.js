import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);

  /* FETCH BOOKS */
  useEffect(() => {
    const fetchBooks= async()=>{
      const {data,error}=await supabase
      .from("books")
      .select("*")
      .eq("is_archived",false);
    if(error){
      console.error(error);
      return;
    }
    console.log(data);
    setBooks(data);
    };
    fetchBooks();
  }, []);

  return (

    <div style={pageStyle}>

      {/* HEADER */}
      <div style={headerStyle}>

        <h1 style={logoStyle}>
          Public Library
        </h1>

        <button
          style={backBtn}
          onClick={() => navigate("/dashboard")}
        >
          Back
        </button>

      </div>

      {/* SEARCH */}
      <div style={{ padding: "0 40px" }}>

        <input
          type="text"
          placeholder="Search books..."
          style={searchStyle}
        />

      </div>

      {/* BOOK GRID */}
      <div style={bookGrid}>

        {books.length === 0 ? (

          <h2>No books available yet.</h2>

        ) : (

          books.map((book, index) => (

            <div
              key={index}
              style={bookCard}
            >

              {/* BOOK COVER */}
              <img
                src={`http://https://elysian-pages.onrender.com/${book.cover_url}`}
                alt={book.title}
                style={coverStyle}
              />

              {/* TITLE */}
              <h2>{book.title}</h2>

              {/* AUTHOR */}
              <p>{book.author}</p>

              {/* CATEGORY */}
              <span style={categoryStyle}>
                {book.category}
              </span>

              {/* BUTTONS */}
              <div style={btnContainer}>

                {/* READ */}
                <button
                  style={readBtn}
                  onClick={() =>
                    navigate("/reader", {
                      state: { book },
                    })
                  }
                >
                  Read Now
                </button>

                {/* ADD TO LIBRARY */}
                <button
                  style={saveBtn}

                  onClick={() => {

                    const existingBooks =
                      JSON.parse(
                        localStorage.getItem(
                          "myLibrary"
                        )
                      ) || [];

                    /* Prevent duplicates */
                    const alreadyExists =
                      existingBooks.find(
                        (b) =>
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

const pageStyle = {
  minHeight: "100vh",

  background:
    "linear-gradient(to bottom, #1a0f05, #2d1b0e)",

  color: "white",

  paddingBottom: "50px",
};

const headerStyle = {
  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

  padding: "30px 40px",
};

const logoStyle = {
  color: "#f5d7a1",
};

const backBtn = {
  padding: "10px 18px",

  borderRadius: "10px",

  border: "none",

  background: "#a47148",

  color: "white",

  cursor: "pointer",
};

const searchStyle = {
  width: "100%",

  padding: "16px",

  borderRadius: "14px",

  border: "none",

  outline: "none",

  fontSize: "16px",

  marginBottom: "40px",
};

const bookGrid = {
  display: "grid",

  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",

  gap: "30px",

  padding: "0 40px",
};

const bookCard = {
  background: "rgba(255,255,255,0.05)",

  borderRadius: "20px",

  padding: "30px",

  textAlign: "center",

  border:
    "1px solid rgba(255,255,255,0.1)",

  backdropFilter: "blur(10px)",
};

const coverStyle = {
  width: "120px",

  height: "170px",

  objectFit: "cover",

  borderRadius: "12px",

  marginBottom: "20px",
};

const categoryStyle = {
  display: "inline-block",
  marginTop: "10px",
  padding: "8px 14px",
  borderRadius: "20px",
  background: "#3d2b1f",
  color: "#f5d7a1",
  fontSize: "14px",
};

const btnContainer = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  marginTop: "25px",
};

const readBtn = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "#a47148",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const saveBtn = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "1px solid #a47148",
  background: "transparent",
  color: "#f5d7a1",
  cursor: "pointer",
};

export default Library;