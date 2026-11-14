"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useReveal } from "@/lib/motion";
import AppNav from "@/components/ui/AppNav";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import AdminRoute from "@/components/AdminRoute";
import type { Book } from "@/lib/types";

function AdminDashboard() {
  const pageRef = useReveal<HTMLDivElement>();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [books, setBooks] = useState<Book[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
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
    if (cover) {
      formData.append("cover", cover);
    }
    try {
      const res = await fetch("/api/upload-book",
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

  const fetchBooks = async () => {
    try {
      const res = await fetch("/api/books");
      const data = await res.json();
      console.log(data);
      setBooks(data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/delete-book/${id}`,
      {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Public book deletion failed:", result);
        alert(result.message || result.error || "Failed to delete book.");
        return;
      }
      await fetchBooks();
      alert("Book deleted successfully.");
    } catch (error) {
      console.error("Public book deletion error:", error);
      alert("Could not contact the server. Please try again.");
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="page" ref={pageRef}><AppNav />
      <div className="admin-panel surface panel--lg">
        <h1 className="display t-title" data-reveal>
          Admin Dashboard
        </h1>
        <button onClick={handleLogout} className="btn btn--secondary">
          Log-out
        </button>
        <form onSubmit={handleUpload}>
          <input
            type="text"
            placeholder="Book Title" aria-label="Book Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="input"
          />
          <input
            type="text"
            placeholder="Author" aria-label="Author"
            value={author}
            onChange={(e) =>
              setAuthor(e.target.value)
            }
            className="input"
          />
          <input
            type="text"
            placeholder="Category" aria-label="Category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="input"
          />
          <p className="field">Upload EPUB Book</p>
          <input
            type="file"
            accept=".epub"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setBookFile(e.target.files?.[0] ?? null)
            }
            className="input"
          />
          <p className="field">Upload Cover Image</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCover(e.target.files?.[0] ?? null)
            }
            className="input"
          />
          <button
            type="submit"
            className="btn btn--primary btn--block">
            Upload Book
          </button>
        </form>
        <h2 style={{ color: "var(--text)", marginTop: "30px" }}>
          Uploaded Books
        </h2>
        <div>
          {books.map((book) => (
            <div key={book.id}
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: "10px", padding: "10px",
              background: "rgba(255,255,255,0.08)", borderRadius: "8px",
            }}>
              <span>{book.title}</span>
              <button onClick={() => handleDelete(book.id)}>DELETE</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}
