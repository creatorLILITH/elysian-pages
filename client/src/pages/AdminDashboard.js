import { useState } from "react";

function AdminDashboard() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [bookFile, setBookFile] = useState(null);
  const [cover, setCover]=useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bookFile) {
      alert("Please select a book file");
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("author", author);
    formData.append("category", category);
    formData.append("book", bookFile);
    formData.append("cover",cover);
    try {
      const res = await fetch("http://localhost:5000/upload-book",
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Book uploaded successfully!");
        setTitle("");
        setAuthor("");
        setCategory("");
        setBookFile(null);
        setCover(null);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.log(error);
      alert("Upload failed");
    }
  };
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>
          Admin Dashboard
        </h1>
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Book Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Author"
            value={author}
            onChange={(e) =>
              setAuthor(e.target.value)
            }
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            style={inputStyle}
          />
          <p style={labelStyle}>Upload EPUB Book</p>
          <input
            type="file"
            accept=".epub"
            onChange={(e) =>
              setBookFile(e.target.files[0])
            }
            style={fileInputStyle}
          />
          <p style={labelStyle}>Upload Cover Image</p>
          <input
  type="file"
  accept="image/*"
  onChange={(e) =>
    setCover(e.target.files[0])
  }
  style={fileInputStyle}
/>
          <button
            type="submit"
            style={buttonStyle}>
            Upload Book
          </button>
        </form>
      </div>
    </div>
  );
}
const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom right, #0f172a, #1e293b)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "30px",
};
const cardStyle = {
  width: "420px",
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
  borderRadius: "24px",
  padding: "40px",
  border: "1px solid rgba(255,255,255,0.1)",
};
const titleStyle = {
  color: "#f8d49d",
  marginBottom: "30px",
  textAlign: "center",
};
const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "18px",
  borderRadius: "12px",
  border: "none",
  outline: "none",
  fontSize: "16px",
};
const fileInputStyle = {
  color: "white",
  marginBottom: "20px",
};
const buttonStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "#a47148",
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};
const labelStyle={
  color:"#f5d7a1",
  marginBottom:"8px",
  marginTop:"12px",
  fontSize:"14px",
};

export default AdminDashboard;