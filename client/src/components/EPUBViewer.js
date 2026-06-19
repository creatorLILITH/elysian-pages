import { ReactReader } from "react-reader";
import { useRef, useState ,useEffect } from "react";

function EPUBViewer({
  fileUrl,
  locationState,
  setLocationState,
  book,
  darkMode,
  fontSize,
  searchText,
  setHighlights,
}) {

  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const [selectedText, setSelectedText] = useState("");
  const [selectedCfi, setSelectedCfi] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(()=>{
    if(!renditionRef.current||!book){
      return;
    }
    const savedHighlights=JSON.parse(localStorage.getItem(
      `highights-${book.title}`
    ))||[];
    console.log("Restoring Highlights:",savedHighlights);
  },[book]);

  // Apply themes dynamically
  useEffect(() => {

    if (renditionRef.current) {

      renditionRef.current.themes.default({
        body: {
          background: darkMode
            ? "#111"
            : "#fff",

          color: darkMode
            ? "#fff"
            : "#000",

          "font-size":
            `${fontSize}px`,
        },
      });

      renditionRef.current.themes.select(
        "default"
      );

      // Hide epub.js floating button
      const buttons =
        document.querySelectorAll("button");

      buttons.forEach((btn) => {

        if (
          btn.innerText.includes("🌙") ||
          btn.innerText.includes("☀")
        ) {
          btn.style.display = "none";
        }

      });

    }

  }, [darkMode, fontSize]);

  // Search inside EPUB
  useEffect(() => {
    console.log("SEARCH EFFECT RUNNING");
    console.log("searchText= ",searchText);
    console.log("bookRef= ",bookRef.current);
    const searchBook = async () => {

      if (
        !searchText ||
        !bookRef.current
      ) {
        return;
      }

      console.log(
        "Searching for:",
        searchText
      );

      const spineItems =
        bookRef.current.spine.spineItems;
        console.log(spineItems);

      for (const item of spineItems) {

        try {

          const loaded =
            await item.load(
              bookRef.current.load.bind(
                bookRef.current
              )
            );

          const serializer=new XMLSerializer();
          const text=serializer.serializeToString(loaded);
          console.log(text);

          if (
            text
              .toLowerCase()
              .includes(
                searchText.toLowerCase()
              )
          ) {

            console.log(
              "Found in section:",
              item.href
            );
          }

          item.unload();

        } catch (err) {

          console.error(err);
        }
      }
    };

    searchBook();

  }, [searchText]);

  return (
    <div style={{ height: "700px" }}>
      <ReactReader
        url={fileUrl}
        location={locationState}
        locationChanged={(epubcifi) => {
  setLocationState(epubcifi);

  // Save reading position
  localStorage.setItem(
    book.title,
    epubcifi
  );

  // Generate approximate progress
  const randomProgress =
    Math.floor(
      Math.random() * 100
    );

  localStorage.setItem(
    `progress-${book.title}`,
    randomProgress
  );
        }}

        getRendition={(rendition)=>{
          renditionRef.current=rendition;
          bookRef.current=rendition.book;
          console.log("Rendition Loaded!",book?.title);
          const savedHighlights=JSON.parse(localStorage.getItem(`highlights-${book.title}`))||[];
          console.log("Highlights found after rendition:",savedHighlights);
          savedHighlights.forEach((highlight)=>{
            rendition.annotations.add("highlight",highlight.cfi,{},null,
              `${highlight.color}-highlight`,
              {
                fill:highlight.color,
                "fill-opacity":"0.4",
              }
            );
          });
          console.log("ATTACHING SELECTED EVENT");
          rendition.on("selected",(cfiRange,contents)=>{
            const text=contents.window
            .getSelection()
            .toString();
            console.log("TEXT CAPTURED:",text);
            setSelectedText(text);
            setSelectedCfi(text);
            setShowColorPicker(true)
            console.log("CFI:",cfiRange);
            console.log(contents.window
              .getSelection()
              .toString()
            );
            setSelectedCfi(cfiRange);
            setShowColorPicker(true);
            console.log("OPENING COLOR PICKER!");
          });
        }}

        hideControls={true}
      />
      {showColorPicker && (
        <div style={{
          position:"fixed",
          top:"50%",
          left:"50%",
          transform:"translate(-50%, -50%)",
          background:"white",
          padding:"20px",
          borderRadius:"15ox",
          boxShadow:"0 8px 20px rgba(0,0,0,0.3)",
          zIndex:99999
        }}>
          <h3>
            Highlight Text?
          </h3>
          <p>
            {selectedText}
          </p>
          <div style={{
            display:"flex",
            gap:"10px",
            marginTop:"15px",
          }}>
            <button onClick={()=>{
              renditionRef.current.annotations.add(
                "highlight",
                selectedCfi,
                {},null,
                "red-highlight",
                {
                  fill:"#d63030",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.title}`
              ))||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"red"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.title}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);
            }}>
              🔴
            </button>
            <button onClick={()=>{
              renditionRef.current.annotations.add(
                "highlight",
                selectedCfi,
                {},null,
                "blue-highlight",
                {
                  fill:"#0a55ce",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.title}`
              ))||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"blue"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.title}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🔵
              </button>
            <button onClick={()=>{
              renditionRef.current.annotations.add(
                "highlight",
                selectedCfi,
                {},null,
                "green-highlight",
                {
                  fill:"#08b611",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.title}`
              ))||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"green"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.title}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🟢
              </button>
            <button onClick={()=>{
              renditionRef.current.annotations.add(
                "highlight",
                selectedCfi,
                {},null,
                "yellow-highlight",
                {
                  fill:"#f0d805",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.title}`
              ))||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"yellow"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.title}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🟡
              </button>
              <button onClick={()=>
                setShowColorPicker(false)
              } style={{
                marginTop:"15px",
              }}>❌Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EPUBViewer;