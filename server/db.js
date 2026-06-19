const { Pool }=require("pg");
const pool=new Pool({
    user:"postgres",
    host:"localhost",
    database:"ebook_reader",
    password:"M0CH1",
    port:5432,
});
module.exports=pool;