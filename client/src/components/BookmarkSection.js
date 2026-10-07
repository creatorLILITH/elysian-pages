function BookmarkSection({isEPUB,bookmarks,addBookmark,
  deleteBookmark,setLocationState,
}){
  if (!isEPUB) return null;
  return(
    <div>
      <div style={{display:"flex",
        gap:"10px",
        marginBottom:"20px",
      }}>
        <button onClick={addBookmark}
        style={{padding:"10px 16px",
          border:"none",
          borderRadius:"10px",
          background:"#A47148",
          color:"white",
          cursor:"pointer",
        }}>
          Add Bookmarks
        </button>
      </div>
      <h3 style={{marginTop:0}}>
        Bookmarks({bookmarks.length})
      </h3>
      {bookmarks.length===0?(
        <p style={{opacity:0.7}}>
          No Bookmarks Yet
        </p>
      ):(bookmarks.map((mark,index)=>(
        <div key={index}
        style={{display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:"10px",
          gap:"10px",
        }}>
          <button onClick={()=>setLocationState(mark)}
          style={{flex:1,
            cursor:"pointer",}}>
              Bookmark{index+1}
            </button>
            <button onClick={()=>deleteBookmark(index)}
            style={{cursor:"pointer",}}>
              Delete
            </button>
          </div>
      )))}
    </div>
  );
}
export default BookmarkSection;