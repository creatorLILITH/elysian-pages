function ReaderToolbar({fontSize,setFontSize,readerTheme,setReaderTheme,readerThemes,
  showHighlights,setShowHighlights,showBookmarks,setShowBookmarks,showNotes,setShowNotes,
  showSearch, setShowSearch,
}){
    return(
      <div style={{
        position:"fixed",
        bottom:"0",
        left:"0",
        width:"100%",
        height:"55px",
        zIndex:99999,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        gap:"20px",
        background:readerThemes[readerTheme].background,
        color:readerThemes[readerTheme].text,
        borderTop:`1px solid ${readerThemes[readerTheme].accent||readerThemes[readerTheme].text}`,
        boxShadow:"0 -4px 15px rgba(0,0,0,0.2)",
      }}>
          {/* Reader Toolbar */}
          <button onClick={()=>setShowHighlights(!showHighlights)}
          title="Highlights"
          style={{background:"transparent",
            border:"none",
            color:readerThemes[readerTheme].text,
            fontSize:"20px",
            cursor:"pointer",
            padding:"4px",
          }}>
            🖍
          </button>
          <button onClick={()=>setShowBookmarks(!showBookmarks)}
          title="Bookmarks"
          style={{background:"transparent",
            border:"none",
            color:readerThemes[readerTheme].text,
            fontSize:"20px",
            cursor:"pointer",
            padding:"4px",
          }}>
            🔖
          </button>
          <button onClick={()=>setShowNotes(!showNotes)}
          title="Notes"
          style={{background:"transparent",
            border:"none",
            color:readerThemes[readerTheme].text,
            fontSize:"20px",
            cursor:"pointer",
            padding:"4px",
          }}>
            📝
          </button>
          <button onClick={()=>setShowSearch(!showSearch)}
          title="Search"
          style={{background:"transparent",
            border:"none",
            color:readerThemes[readerTheme].text,
            fontSize:"20px",
            cursor:"pointer",
            padding:"4px",
          }}>
            🔎
          </button>
          {/* Reader Themes */}
          <div style={{
            display:"flex",
            alignItems:"center",
            gap:"10px",
          }}>
            <span style={{
              fontSize:"15px",
              fontWeight:"bold",
            }}>
              Themes:
            </span>
            <select value={readerTheme}
            onChange={(e)=>setReaderTheme(e.target.value)}
            style={{
              padding:"9px 12px",
              borderRadius:"8px",
              border:"1px solid #888",
              cursor:"pointer",
              fontSize:"14px",
            }}>
              {Object.entries(readerThemes).map(([themeKey,theme])=>(
                <option key={themeKey}
                value={themeKey}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
          {/* Font Size */}
          <div style={{
            display:"flex",
            alignItems:"center",
            gap:"12px",
          }}>
            <span style={{
              fontSize:"15px",
              fontWeight:"bold",
            }}>
              Font Size:
            </span>
            <button onClick={()=>
             setFontSize(Math.max(14,Number(fontSize)-1)) }
             style={{
              width:"38px",
              height:"38px",
              borderRadius:"8px",
              border:"none",
              cursor:"pointer",
              fontSize:"20px",
             }}>
              -
            </button>
            <span style={{
              minWidth:"50px",
              textAlign:"center",
              fontWeight:"bold",
             }}>
              {fontSize}px
            </span>
            <button onClick={()=>
              setFontSize(Math.min(30,Number(fontSize)+1))}
              style={{
                width:"38px",
                height:"38px",
                borderRadius:"8px",
                border:"none",
                cursor:"pointer",
                fontSize:"20px",
              }}>
                +
              </button>
          </div>
      </div>
    );
  }
  export default ReaderToolbar;