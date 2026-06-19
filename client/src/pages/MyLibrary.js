import { useNavigate } from "react-router-dom";
function MyLibrary() {
  const navigate = useNavigate();
  const myBooks =
    JSON.parse(
      localStorage.getItem("myLibrary")
    ) || [];
  return (
    <div style={pageStyle}>

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

              <div style={bookIcon}>
                📚
              </div>

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

    </div>
  );
}
const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom, #3f2805, #522c08)",
  color: "white",
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
export default MyLibrary;