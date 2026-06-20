const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const pool = require("./db");
const { constants } = require("perf_hooks");
const app = express();
/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());
/* Serve uploaded files */
app.use(
  "/uploads",
  express.static("uploads")
);
/* ---------------- DATABASE TEST ---------------- */
pool.query(
  "SELECT NOW()",(err, res) => {
    if (err) {
      console.log("Database connection error:",err);
    } else {
      console.log("Database connected successfully");
    }
  }
);
/* ---------------- MULTER STORAGE ---------------- */
const storage = multer.diskStorage({
    destination:
      (req, file, cb) => {
        cb(null, "uploads/");
      },
    filename:
      (req, file, cb) => {
        cb(null,Date.now() + path.extname(file.originalname));
      },
  });
const upload =
  multer({ storage });
/* ---------------- UPLOAD BOOK ---------------- */
app.post(
  "/upload",

  upload.fields([
    {name:"book", maxCount:1},
    {name:"cover",maxCount: 1},
  ]),

  async (req, res) => {

    try {

      const file =
        req.file;

      if (!file) {

        return res
          .status(400)
          .json({
            error:
              "No file uploaded",
          });
      }

      const title =
        file.originalname;

      const author =
        "Unknown Author";

      const category =
        "Fiction";

      const genre =
        "General";

      const cover_url =
        "https://covers.openlibrary.org/b/id/7222246-L.jpg";

      const file_url =
        `http://localhost:5000/uploads/${file.filename}`;

      const result =
        await pool.query(

          `INSERT INTO books
          (
            title,
            author,
            category,
            genre,
            cover_url,
            file_url
          )

          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
          )

          RETURNING *`,

          [
            title,
            author,
            category,
            genre,
            cover_url,
            file_url,
          ]
        );

      res.json({

        message:
          "Book uploaded successfully",

        book:
          result.rows[0],
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        error:
          "Database error",
      });
    }
  }
);

app.post("/signup", async(req,res)=>{
  try {
    const{username,email,password,}=req.body;
    /*Check if user is already registerd*/
    const existingUser=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    if(existingUser.rows.length>0){
      return
      res.status(400).json({error:"User already exists"});
    }
    /*Insert new user*/
    const result=await pool.query(`INSERT INTO users(username,email,password)
      VALUES($1, $2, $3) RETURNING *`,[username,email,password]);
      res.json({message:"Signup Successful!!",
        user:result.rows[0],
      });
  }
  catch (error){
    console.log(error);
    res.status(500).json({
      error:"Signup failed!",
    });
  }
});

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

    if (user.password !== password) {
      return res.status(400).json({
        error: "Incorrect password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      error: "Server error",
    });
  }
});

app.post("/add-to-library", async(req,res)=>{
  const { userId, bookId } = req.body;
  try{
    await pool.query(`INSERT INTO user_library
      (user_id, book_id) VALUES ($1, $2)`,[userId, bookId]);
      res.json({message:"Book added to library"});
  }
  catch(error){
    console.log(error);
    res.status(500).json({
      error:"Server error"
    });
  }
});

//upload-book route
app.post(
  "/upload-book",
  upload.fields([
    {name:"book",maxCount:1},
    {name:"cover",maxCount:1},
  ]),
  async (req, res) => {
    try {
      const {
        title,
        author,
        category,
      } = req.body;
      const file_url=req.files.book[0].path;
      const cover_url=req.files.cover[0].path;
      console.log(req.file);
      console.log(file_url);
      const result = await pool.query(
        `
        INSERT INTO library_books
        (title, author, category, file_url, cover_url, uploaded_by)

        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          title,
          author,
          category,
          file_url,
          cover_url,
          "admin",
        ]
      );
      res.json({
        message:
          "Book uploaded successfully",
      });
    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Upload failed",
      });
    }
  }
);

app.get("/books", async (req, res) => {
  try {

    const result = await pool.query(
      "SELECT * FROM library_books"
    );

    res.json(result.rows);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: "Failed to fetch books",
    });
  }
});

/* ---------------- TEST ROUTE ---------------- */

app.get("/", (req, res) => {

  res.send(
    "Backend is working"
  );
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});