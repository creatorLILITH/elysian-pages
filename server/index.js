const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const pool = require("./db");
const app = express();
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY);
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
const upload=multer({storage:multer.memoryStorage(),});
/* ---------------- UPLOAD BOOK ---------------- */
app.post(
  "/upload",

  upload.fields([
    {name:"book", maxCount:1},
    {name:"cover",maxCount: 1},
  ]),

  async (req, res) => {
    console.log("Upload Route Hit");
    console.log(req.file);
    console.log(req.files);

    try {

      const file =
        req.files.book[0];
        console.log("File selected:", file);

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
        `https://elysian-pages.onrender.com/uploads/${file.filename}`;

      const result =
        await pool.query(
          `INSERT INTO books(title,author,category,genre,cover_url,file_url)
          VALUES($1,$2,$3,$4,$5,$6)
          RETURNING *`,
          [title,author,category,genre,cover_url,file_url,]
        );
        console.log("DATABASE INSERT RESULT: ",result.rows);
        console.log("ROWS INSERTED: ",result.rowCount);

      res.json({

        message:
          "Book uploaded successfully",

        book:
          result.rows[0],
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({
        error:"Database error",
      });
    }
  }
);

app.post("/signup", async(req,res)=>{
  try {
    const{username,email,password,}=req.body;
    /*Check if user is already registerd*/
    const hashedPassword=await bcrypt.hash(password,10);
    const existingUser=await pool.query("SELECT * FROM users WHERE email=$1",[email]);
    if(existingUser.rows.length>0){
      return
      res.status(400).json({error:"User already exists"});
    }
    /*Insert new user*/
    const result=await pool.query(`INSERT INTO users(username,email,password)
      VALUES($1, $2, $3) RETURNING *`,[username,email,hashedPassword]);
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

    const passwordMatch=await bcrypt.compare(password, user.password);
    if (!passwordMatch){
      return res.status(400).json({error: "Incorrect Password",});
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
app.post("/upload-book",
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
      const bookFile=req.files.book[0];
      const filePath=`books/${Date.now()}-${bookFile.originalname}`;
      const { data: bookData, error: bookError} = await supabase.storage
      .from("elysian-books")
      .upload(filePath,
      bookFile.buffer,{
        contentType:bookFile.mimetype,
        upsert:false,
      });
      if (bookError){
        console.log("BOOK STORAGE ERROR:",bookError);
        return res.status(500).json({
          error:"Failed to upload book to storage",
        });
      }
      const { data:publicUrlData } = supabase.storage
      .from("elysian-books")
      .getPublicUrl(filePath);
      const fileUrl=publicUrlData.publicUrl;
      const result=await pool.query(`INSERT INTO library_books
        (title,author,category,file_url,uploaded_by,is_public,
        is_archived) VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING *`,[title,author,category,fileUrl,null,true,false]);
      console.log("LIBRARY BOOK INSERT RESULT:",result.rows);
      console.log("BODY:",req.body);
      console.log("FILES:",req.files);
      res.json({
        message:"Book uploaded successfully",
      });
    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: "Upload failed",
      });
    }
  }
);
/*-------------DELETE BOOK FROM THE PUBLIC LIBRARY-------------*/
app.delete("/delete-book/:id",async(req,res)=>{
  try{
    const { id }=req.params;
    const result=await pool.query("DELETE FROM library_books WHERE id=$1 RETURNING *",
      [id]);
    if (result.rows.length===0){
      return res.status(404).json({
        message: "Book not found",
      });
    }
    res.json({
      message:"Book deleted successfully",
    });
  }
  catch (error){
    console.error(error);
    res.status(500).json({
      message:"Failed to delete book",
    });
  }
});

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