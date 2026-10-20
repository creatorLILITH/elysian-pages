
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const pool = require("./db");
const app = express();
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(express.json());

/* Serve uploaded files */

app.use("/uploads", express.static("uploads"));

/* ---------------- DATABASE TEST ---------------- */

pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {
    console.log("Database connected successfully");
  }
});

/* ---------------- MULTER STORAGE ---------------- */

// Existing uploader used by the public and admin upload routes.
const upload = multer({
  storage: multer.memoryStorage(),
});

/* ================= PRIVATE USER BOOKS ================= */

// Separate uploader for private books.
// Maximum file size: 50 MB.
const privateBookUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
});

/* ---------------- EXISTING UPLOAD ROUTE ---------------- */

app.post(
  "/upload",
  upload.fields([
    { name: "book", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("Upload Route Hit");

    try {
      const file = req.files?.book?.[0];

      if (!file) {
        return res.status(400).json({
          error: "No file uploaded",
        });
      }

      const title = file.originalname;
      const author = "Unknown Author";
      const category = "Fiction";
      const genre = "General";
      const cover_url =
        "https://covers.openlibrary.org/b/id/7222246-L.jpg";

      // Preserved from the existing backend.
      // WARNING: memoryStorage does not create file.filename.
      // This legacy route needs a separate fix if it is still used.
      const file_url =
        `https://elysian-pages.onrender.com/uploads/${file.filename}`;

      const result = await pool.query(
        `INSERT INTO books
          (title, author, category, genre, cover_url, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [title, author, category, genre, cover_url, file_url]
      );

      return res.json({
        message: "Book uploaded successfully",
        book: result.rows[0],
      });
    } catch (error) {
      console.error("Existing upload error:", error);

      return res.status(500).json({
        error: "Database error",
      });
    }
  }
);

/* ---------------- EXISTING SIGNUP ROUTE ---------------- */

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "User already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [username, email, hashedPassword]
    );

    return res.json({
      message: "Signup Successful!!",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      error: "Signup failed!",
    });
  }
});

/* ---------------- EXISTING LOGIN ROUTE ---------------- */

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        error: "Incorrect Password",
      });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* ---------------- EXISTING ADD-TO-LIBRARY ROUTE ---------------- */

app.post("/add-to-library", async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    await pool.query(
      `INSERT INTO user_library (user_id, book_id)
       VALUES ($1, $2)`,
      [userId, bookId]
    );

    return res.json({
      message: "Book added to library",
    });
  } catch (error) {
    console.error("Add to library error:", error);

    return res.status(500).json({
      error: "Server error",
    });
  }
});

/* ---------------- EXISTING ADMIN PUBLIC-BOOK UPLOAD ---------------- */

app.post(
  "/upload-book",
  upload.fields([
    { name: "book", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req, res) => {
    let bookPath = null;
    let coverPath = null;

    try {
      const { title, author, category } = req.body;
      const bookFile = req.files?.book?.[0];
      const coverFile = req.files?.cover?.[0];

      if (!bookFile || !coverFile) {
        return res.status(400).json({
          error: "Both a book file and cover image are required.",
        });
      }

      const safeBookName = bookFile.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const safeCoverName = coverFile.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      bookPath = `books/${Date.now()}-${safeBookName}`;
      coverPath = `covers/${Date.now()}-${safeCoverName}`;

      const { error: bookError } = await supabase.storage
        .from("elysian-books")
        .upload(bookPath, bookFile.buffer, {
          contentType: bookFile.mimetype,
          upsert: false,
        });

      if (bookError) {
        console.error("BOOK STORAGE ERROR:", bookError.message);

        return res.status(500).json({
          error: "Failed to upload book to storage",
        });
      }

      const { error: coverError } = await supabase.storage
        .from("elysian-books")
        .upload(coverPath, coverFile.buffer, {
          contentType: coverFile.mimetype,
          upsert: false,
        });

      if (coverError) {
        console.error("COVER STORAGE ERROR:", coverError.message);

        await supabase.storage
          .from("elysian-books")
          .remove([bookPath]);

        return res.status(500).json({
          error: "Failed to upload cover to storage",
        });
      }

      const { data: publicBookUrlData } = supabase.storage
        .from("elysian-books")
        .getPublicUrl(bookPath);

      const { data: publicCoverUrlData } = supabase.storage
        .from("elysian-books")
        .getPublicUrl(coverPath);

      const fileUrl = publicBookUrlData.publicUrl;
      const coverUrl = publicCoverUrlData.publicUrl;

      await pool.query(
        `INSERT INTO library_books
          (title, author, category, file_url, cover_url,
           uploaded_by, is_public, is_archived)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          title,
          author,
          category,
          fileUrl,
          coverUrl,
          null,
          true,
          false,
        ]
      );

      return res.json({
        message: "Book uploaded successfully",
      });
    } catch (error) {
      console.error("Public book upload error:", error);

      // Clean up uploaded objects if the database insert fails.
      const pathsToRemove = [bookPath, coverPath].filter(Boolean);

      if (pathsToRemove.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("elysian-books")
          .remove(pathsToRemove);

        if (cleanupError) {
          console.error(
            "Public upload cleanup error:",
            cleanupError.message
          );
        }
      }

      return res.status(500).json({
        error: "Upload failed",
      });
    }
  }
);

/* ---------------- EXISTING PUBLIC-BOOK DELETE ---------------- */

app.delete("/delete-book/:id",async(req,res)=>{
  try{
    const {id}=req.params;
    //1.Retrieve the book before deleting its database record.
    const result=await pool.query("SELECT * FROM library_books WHERE id=$1",[id]);
    if(result.rows.length===0){
      return res.status(404).json({message:"Book not found",});
    }
    const book=result.rows[0];
    //2.Extract only paths belonging to our public Storage bucket.
    function getStoragePath(url){
      if(!url) return null;
      try{
        const parsedUrl=new URL(url);
        const marker="/storage/v1/object/public/elysian-books/";
        const markerIndex=parsedUrl.pathname.indexOf(marker);
        if(markerIndex===-1) return null;
        return decodeURIComponent(
          parsedUrl.pathname.slice(markerIndex+marker.length)
        );
      }
      catch{
        return null;
      }
    }
    const bookPath=getStoragePath(book.file_url);
    const coverPath=getStoragePath(book.cover_url);
    if (!bookPath||!coverPath){
      return res.status(500).json({
        message:"Could not identify the book and Storage paths. Nothing was deleted.",
      });
    }
    const candidatePaths=[...new Set([bookPath,coverPath])];
    //3.Find which files are still referenced by other records.
    const remaining=await pool.query(`SELECT file_url,cover_url
      FROM library_books WHERE id <> $1`,[id]);
    const stillReferenced=new Set();
    for(const row of remaining.rows){
      const remainingBookPath=getStoragePath(row.file_url);
      const remainingCoverPath=getStoragePath(row.cover_url);
      if(remainingBookPath) stillReferenced.add(remainingBookPath);
      if(remainingCoverPath) stillReferenced.add(remainingCoverPath);
    }
    const pathsToRemove=candidatePaths.filter((path)=>!stillReferenced.has(path));
    //4.Remove unshared Storage objects first.
    
if (pathsToRemove.length > 0) {
  const { error: storageError } = await supabase.storage
    .from("elysian-books")
    .remove(pathsToRemove);

  if (storageError) {
    console.error(
      "Public book Storage deletion error:",
      storageError
    );

    return res.status(500).json({
      message:
        "Could not remove the book files. The database record was kept.",
    });
  }

  // Verify that none of the targeted objects still exists.
  const verificationResults = await Promise.all(
    pathsToRemove.map(async (storagePath) => {
      const lastSlash = storagePath.lastIndexOf("/");
      const folder = storagePath.slice(0, lastSlash);
      const filename = storagePath.slice(lastSlash + 1);

      const { data, error } = await supabase.storage
        .from("elysian-books")
        .list(folder, {
          search: filename,
          limit: 100,
        });

      if (error) {
        return {
          path: storagePath,
          error,
        };
      }

      const stillExists = (data || []).some(
        (item) => item.name === filename
      );

      return {
        path: storagePath,
        stillExists,
      };
    })
  );

  const verificationErrors = verificationResults.filter(
    (result) => result.error
  );

  if (verificationErrors.length > 0) {
    console.error(
      "Storage verification errors:",
      verificationErrors
    );

    return res.status(500).json({
      message:
        "Could not verify Storage cleanup. The database record was kept.",
    });
  }

  const remainingPaths = verificationResults
    .filter((result) => result.stillExists)
    .map((result) => result.path);

  if (remainingPaths.length > 0) {
    console.error(
      "Storage objects still exist after deletion:",
      remainingPaths
    );

    return res.status(500).json({
      message:
        "Some Storage files could not be removed. The database record was kept.",
    });
  }
}

    //5.Delete the database row only after Storage removal succeeds.
    const deleteResult=await pool.query("DELETE FROM library_books WHERE id=$1 RETURNING id",[id]);
    if(deleteResult.rows.length===0){
      return res.status(500).json({
        message:"Storage cleanup ran, but the database record could not be deleted."
      });
    }
    return res.json({
      message:"Book and unshared Storage files deleted successfully",
    });
  }
  catch(error){
    console.error("Public book delete error:",error);
    return res.status(500).json({
      message:"Failed to delete book"
    });
  }
});
/* ---------------- EXISTING PUBLIC-BOOK LIST ---------------- */

app.get("/books", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM library_books"
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Public book list error:", error);

    return res.status(500).json({
      error: "Failed to fetch books",
    });
  }
});

/* ============================================================
   PRIVATE USER BOOKSHELF
   Supports PDF and EPUB.
   Uses Supabase Auth, the private_books table, and the
   private-books Storage bucket.
   ============================================================ */

/* ---------------- AUTHENTICATE PRIVATE REQUESTS ---------------- */

async function requireSupabaseUser(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error: "Please sign in to access your bookshelf.",
    });
  }

  try {
    const { data, error } = await supabase.auth.getUser(match[1]);

    if (error || !data?.user) {
      return res.status(401).json({
        error: "Your session is invalid or expired. Please sign in again.",
      });
    }

    req.supabaseUser = data.user;
    return next();
  } catch (error) {
    console.error(
      "Private bookshelf authentication error:",
      error.message
    );

    return res.status(401).json({
      error: "Unable to verify your session.",
    });
  }
}

/* ---------------- VALIDATE PRIVATE BOOK TYPE ---------------- */

function getPrivateBookType(file) {
  const extension = path
    .extname(file.originalname || "")
    .toLowerCase();

  if (
    extension === ".pdf" &&
    file.mimetype === "application/pdf"
  ) {
    return "pdf";
  }

  if (
    extension === ".epub" &&
    file.mimetype === "application/epub+zip"
  ) {
    return "epub";
  }

  return null;
}

/* ---------------- SANITIZE FILENAME ---------------- */

function safePrivateFilename(filename) {
  return path
    .basename(filename)
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

/* ---------------- LIST THE USER'S PRIVATE BOOKS ---------------- */

app.get(
  "/private-books",
  requireSupabaseUser,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("private_books")
        .select(
          "id, user_id, title, author, file_name, file_type, file_size, created_at"
        )
        .eq("user_id", req.supabaseUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json(data || []);
    } catch (error) {
      console.error("List private books error:", error.message);

      return res.status(500).json({
        error: "Could not load your private bookshelf.",
      });
    }
  }
);

/* ---------------- UPLOAD A PRIVATE BOOK ---------------- */

app.post(
  "/private-books",
  requireSupabaseUser,
  privateBookUpload.single("book"),
  async (req, res) => {
    let uploadedStoragePath = null;

    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          error: "Choose a PDF or EPUB file to upload.",
        });
      }

      const fileType = getPrivateBookType(file);

      if (!fileType) {
        return res.status(400).json({
          error: "Only PDF and EPUB files are allowed.",
        });
      }

      const defaultTitle = path.basename(
        file.originalname,
        path.extname(file.originalname)
      );

      const title = String(
        req.body.title || defaultTitle
      ).trim();

      const author = String(
        req.body.author || "Unknown Author"
      ).trim();

      if (!title) {
        return res.status(400).json({
          error: "Please provide a book title.",
        });
      }

      const storagePath =
        `${req.supabaseUser.id}/${crypto.randomUUID()}-${safePrivateFilename(file.originalname)}`;

      uploadedStoragePath = storagePath;

      const { error: storageError } = await supabase.storage
        .from("private-books")
        .upload(storagePath, file.buffer, {
          contentType:
            fileType === "pdf"
              ? "application/pdf"
              : "application/epub+zip",
          upsert: false,
        });

      if (storageError) throw storageError;

      const { data: book, error: insertError } = await supabase
        .from("private_books")
        .insert({
          user_id: req.supabaseUser.id,
          title,
          author: author || "Unknown Author",
          file_name: file.originalname,
          storage_path: storagePath,
          file_type: fileType,
          file_size: file.size,
        })
        .select(
          "id, user_id, title, author, file_name, file_type, file_size, created_at"
        )
        .single();

      if (insertError) throw insertError;

      return res.status(201).json({
        message: "Book uploaded successfully.",
        book,
      });
    } catch (error) {
      // Remove the uploaded file if saving its metadata fails.
      if (uploadedStoragePath) {
        const { error: cleanupError } = await supabase.storage
          .from("private-books")
          .remove([uploadedStoragePath]);

        if (cleanupError) {
          console.error(
            "Private book upload cleanup error:",
            cleanupError.message
          );
        }
      }

      console.error("Upload private book error:", error.message);

      return res.status(500).json({
        error: "The book could not be uploaded.",
      });
    }
  }
);

/* ---------------- OPEN A PRIVATE BOOK ---------------- */
/* A signed URL is created only after checking ownership. */

app.get(
  "/private-books/:id/read",
  requireSupabaseUser,
  async (req, res) => {
    try {
      const { data: book, error: bookError } = await supabase
        .from("private_books")
        .select(
          "id, user_id, title, author, file_name, file_type, file_size, storage_path"
        )
        .eq("id", req.params.id)
        .eq("user_id", req.supabaseUser.id)
        .maybeSingle();

      if (bookError) throw bookError;

      if (!book) {
        return res.status(404).json({
          error: "Book not found in your bookshelf.",
        });
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from("private-books")
        .createSignedUrl(book.storage_path, 600);

      if (signedError) throw signedError;

      const {
        storage_path,
        user_id,
        ...safeBook
      } = book;

      return res.json({
        book: {
          ...safeBook,
          file_url: signed.signedUrl,
        },
      });
    } catch (error) {
      console.error("Read private book error:", error.message);

      return res.status(500).json({
        error: "Could not open this book.",
      });
    }
  }
);

/* ---------------- DELETE A PRIVATE BOOK ---------------- */

app.delete(
  "/private-books/:id",
  requireSupabaseUser,
  async (req, res) => {
    try {
      const { data: book, error: findError } = await supabase
        .from("private_books")
        .select("id, user_id, storage_path")
        .eq("id", req.params.id)
        .eq("user_id", req.supabaseUser.id)
        .maybeSingle();

      if (findError) throw findError;

      if (!book) {
        return res.status(404).json({
          error: "Book not found in your bookshelf.",
        });
      }

      const { error: storageError } = await supabase.storage
        .from("private-books")
        .remove([book.storage_path]);

      if (storageError) throw storageError;

      const { error: deleteError } = await supabase
        .from("private_books")
        .delete()
        .eq("id", book.id)
        .eq("user_id", req.supabaseUser.id);

      if (deleteError) {
        console.error(
          "Book metadata delete error after Storage removal:",
          deleteError.message
        );

        return res.status(500).json({
          error:
            "The file was removed, but its bookshelf record could not be deleted. Please contact support.",
        });
      }

      return res.json({
        message: "Book deleted successfully.",
      });
    } catch (error) {
      console.error("Delete private book error:", error.message);

      return res.status(500).json({
        error: "Could not delete this book.",
      });
    }
  }
);

/* ---------------- MULTER ERROR HANDLER ---------------- */

app.use((error, req, res, next) => {
  if (
    error instanceof multer.MulterError &&
    error.code === "LIMIT_FILE_SIZE"
  ) {
    return res.status(413).json({
      error: "Files must be 50 MB or smaller.",
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: "The uploaded file could not be processed.",
    });
  }

  return next(error);
});

/* ---------------- EXISTING DICTIONARY ROUTE ---------------- */

app.get("/dictionary/:word", async (req, res) => {
  try {
    const { word } = req.params;

    const response = await fetch(
      `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Word not found",
      });
    }

    const data = await response.json();
    const englishEntries = data.en || [];

    const meanings = englishEntries.map((entry) => ({
      partOfSpeech: entry.partOfSpeech,
      definitions: (entry.definitions || []).map((definition) => ({
        definition: definition.definition
          .replace(/<[^>]*>/g, "")
          .trim(),
        example: definition.example
          ? definition.example.replace(/<[^>]*>/g, "").trim()
          : null,
      })),
    }));

    return res.json({
      word,
      meanings,
    });
  } catch (error) {
    console.error("Dictionary API error:", error);

    return res.status(500).json({
      error: "Dictionary lookup failed",
    });
  }
});

/* ---------------- TEST ROUTE ---------------- */

app.get("/", (req, res) => {
  res.send("Backend is working");
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
