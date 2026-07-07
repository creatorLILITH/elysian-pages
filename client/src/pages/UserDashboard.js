import { useNavigate } from "react-router-dom";

function UserDashboard() {

  const navigate = useNavigate();

  const myBooks =
    JSON.parse(
      localStorage.getItem("myLibrary")
    ) || [];

  const recentBooks =
    JSON.parse(
      localStorage.getItem("recentBooks")
    ) || [];

  return (

    <div style={pageStyle}>

      {/* HEADER */}
      <div style={headerStyle}>

        <h1 style={logoStyle}>
          Elysian Pages
        </h1>

        <div style={navStyle}>

          <button
            style={navBtn}
            onClick={() => navigate("/library")}
          >
            Library
          </button>

          <button
            style={navBtn}
            onClick={() => navigate("/mylibrary")}
          >
            My Library
          </button>

          <button style={navBtn}>
            Profile
          </button>

        </div>

      </div>

      {/* HERO SECTION */}
      <div style={heroStyle}>

        <h1 style={heroTitle}>
          Welcome Back 📚
        </h1>

        <p style={heroText}>
          Continue your reading journey and
          explore your personal collection.
        </p>

      </div>

      {/* MY LIBRARY */}
      <div style={{ padding: "40px" }}>

        <h2 style={sectionTitle}>
          My Library
        </h2>

        <div style={bookGrid}>

          {myBooks.map((book, index) => (

            <div
              key={index}
              style={bookCard}
            >

              {book.cover_url ? (
                <img
                  src={`https://elysian-pages.onrender.com/${book.cover_url}`}
                  alt={book.title}
                  style={coverStyle}
                />
              ) : (
                <div style={bookIcon}>
                  📚
                </div>
              )}

              <h3>{book.title}</h3>

              <p>{book.author}</p>

              <button
                style={readBtn}
                onClick={() =>
                  navigate("/reader", {
                    state: {
                      book,
                    },
                  })
                }
              >
                Read
              </button>

            </div>

          ))}

        </div>

      </div>

      {/* RECENTLY READ */}
      <div style={{ padding: "40px" }}>

        <h2 style={sectionTitle}>
          Continue Reading
        </h2>

        <div style={bookGrid}>

          {recentBooks.map((book, index) => (

            <div
              key={index}
              style={bookCard}
            >

              {book.cover_url ? (
                <img
                  src={`https://elysian-pages.onrender.com/${book.cover_url}`}
                  alt={book.title}
                  style={coverStyle}
                />
              ) : (
                <div style={bookIcon}>
                  📖
                </div>
              )}

              <h3>{book.title}</h3>

              <p>{book.author}</p>

              <button
                style={readBtn}
                onClick={() =>
                  navigate("/reader", {
                    state: {
                      book,
                    },
                  })
                }
              >
                Continue
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

/* STYLES */

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom, #3f2805, #522c08)",
  color: "white",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "20px 40px",
};

const logoStyle = {
  color: "#f5d7a1",
};

const navStyle = {
  display: "flex",
  gap: "15px",
};

const navBtn = {
  background: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer",
  fontSize: "16px",
};

const heroStyle = {
  padding: "60px 40px",
};

const heroTitle = {
  fontSize: "52px",
  color: "#f5d7a1",
};

const heroText = {
  fontSize: "20px",
  maxWidth: "600px",
  lineHeight: "1.6",
};

const sectionTitle = {
  color: "#f5d7a1",
  marginBottom: "30px",
};

const bookGrid = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "30px",
};

const bookCard = {
  background: "rgba(255,255,255,0.05)",
  padding: "30px",
  borderRadius: "20px",
  textAlign: "center",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const bookIcon = {
  fontSize: "60px",
  marginBottom: "20px",
};

const coverStyle = {
  width: "120px",
  height: "180px",
  objectFit: "cover",
  borderRadius: "12px",
  marginBottom: "15px",
};

const readBtn = {
  marginTop: "20px",
  padding: "12px 24px",
  border: "none",
  borderRadius: "12px",
  background: "#a47148",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

export default UserDashboard;