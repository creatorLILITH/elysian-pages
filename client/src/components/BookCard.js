function BookCard({ book,onRead, onAdd }){
    return(
        <div style={bookCard}>
            <img src={`http://localhost:5000/${book.cover_url}`}
            alt={book.title}
            style={coverStyle}/>
            <h2>{book.title}</h2>
            <p>{book.author}</p>
            <span style={categoryStyle}>{book.category}</span>
            <div style={btnContainer}>
                <button style={readBtn} onClick={onRead}>Read Now</button>
                <button style={saveBtn} onClick={onAdd}>Add to Library</button>
            </div>
        </div>
    );
}
const bookCard={
    background:"rgba(255,255,255,0.05)",
    borderRadius:"20px",
    padding:"30px",
    textAlign:"center",
    border:"1px solid rgba(255,255,255,0.1)",
    backdropFilter:"blur(10px)",
};
const coverStyle={
    width:"120px",
    height:"170px",
    objectFit:"cover",
    borderRadius:"12px",
    marginBottom:"20px",
};
const categoryStyle={
    display:"inline-block",
    marginTop:"10px",
    padding:"8px 14px",
    borderRadius:"20px",
    background:"#3d2b1f",
    color:"#f5d7a1",
    fontSize:"14px",
};
const btnContainer={
    display:"flex",
    gap:"12px",
    justifyContent:"center",
    marginTop:"25px",
};
const readBtn={
    padding:"12px 18px",
    borderRadius:"12px",
    border:"none",
    background:"#a47148",
    color:"white",
    cursor:"pointer",
    fontWeight:"bold",
}
const saveBtn={
    padding:"12px 18px",
    borderRadius:"12px",
    border:"1px solid #a47148",
    background:"transparent",
    color:"#f5d7a1",
    cursor:"pointer",
};
export default BookCard;
