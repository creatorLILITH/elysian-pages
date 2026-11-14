"use client";

import { ReactReader, ReactReaderStyle, type IEpubViewStyle } from "react-reader";
import { useRef, useState ,useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Book as EpubBook, Contents, Rendition } from "epubjs";

interface ReaderTheme {
  name: string;
  background: string;
  text: string;
  accent?: string;
}

interface HighlightItem {
  text?: string;
  color?: string;
  cfi?: string;
  pageNumber?: number;
  type?: string;
}

interface EpubSearchMatch {
  cfi: string;
  excerpt: string;
}

interface EpubSpineItem {
  load: (request?: Function) => unknown;
  find: (query: string) => EpubSearchMatch[];
  unload: () => void;
}

interface EPUBViewerProps {
  fileUrl: string;
  locationState: string | null;
  setLocationState: (location: string) => void;
  book: {
    id: string | number;
    title: string;
  };
  darkMode: boolean;
  fontSize: number | string;
  readerTheme: string;
  readerThemes: Record<string, ReaderTheme>;
  searchQuery: string;
  searchRunId: number;
  setHighlights: Dispatch<SetStateAction<HighlightItem[]>>;
  setSearchResults: Dispatch<SetStateAction<EpubSearchMatch[]>>;
  searchResults: EpubSearchMatch[];
  currentSearchIndex: number;
  setRemoveHighlight: Dispatch<SetStateAction<((cfi?: string) => void) | null>>;
  onTextSource?: (getText: () => string) => void;
  onDictionaryOpen: (word: string) => void;
}

function EPUBViewer({
  fileUrl,
  locationState,
  setLocationState,
  book,
  darkMode,
  readerTheme,
  readerThemes,
  fontSize,
  searchQuery,
  searchRunId,
  setHighlights,
  setSearchResults,
  searchResults,
  currentSearchIndex,
  setRemoveHighlight,
  onTextSource,
  onDictionaryOpen,
}: EPUBViewerProps) {

  const renditionRef = useRef<Rendition|null>(null);
  const bookRef = useRef<EpubBook|null>(null);
  const readerContainerRef = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
  const container = readerContainerRef.current;
  if (!container) return;
  const resizeObserver = new ResizeObserver(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    // A rendition exists before epubjs has attached its layout stage.
    const manager = (rendition as Rendition & { manager?: { stage?: unknown } }).manager;
    if (!manager?.stage) return;
    const width = container.clientWidth;
    const height = Math.max(200, container.clientHeight - 56);
    rendition.resize(width, height);
    rendition.spread(width < 800 ? "none" : "auto", 800);
  });
  resizeObserver.observe(container);
  return () => {
    resizeObserver.disconnect();
  };
}, []);
  const searchHighlightCfiRef=useRef<string|null>(null);
  // Guards against a slow search from an older query overwriting newer results.
  const searchRunRef=useRef(0);
  const applyTheme=useCallback((rendition:Rendition)=>{
    if (!rendition){
      return;
    }
    const selectedTheme=readerThemes[readerTheme];
    const backgroundColor=selectedTheme.background;
    const textColor=selectedTheme.text;
    rendition.themes.default({
      body:{
        background:backgroundColor,
        color:textColor,
        "font-family": "Georgia, Cambria, serif",
        "line-height": "1.8",
      },
    });
    rendition.themes.select("default");

    //Force the EPUB to follow Elysian Pages theme
    rendition.themes.override("color",textColor);
    rendition.themes.override("background",backgroundColor);
    rendition.themes.override("font-family", "Georgia, Cambria, serif");
    rendition.themes.override("line-height", "1.8");
    rendition.themes.override("text-align", "start");

    //Apply font size
    rendition.themes.fontSize(`${fontSize}px`);
  },[fontSize, readerTheme, readerThemes]);
  const [selectedText, setSelectedText] = useState("");
  const [selectedCfi, setSelectedCfi] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({
    top:0,
    left:0,
  });
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryData, setDictionaryData] = useState<{
    meanings?: {
      partOfSpeech?: string;
      definitions?: {
        definition?: string;
        example?: string | null;
      }[];
    }[];
  }|null>(null);
  useEffect(()=>{
    const fetchDefinition=async()=>{
      if(!showDictionary||!selectedText){
        return;
      }
      const word=selectedText.trim().split(/\s+/)[0];
      try{
        setDictionaryData(null);
        const response=await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
        if(!response.ok){
          throw new Error("Word not found");
        }
        const data=await response.json();
        setDictionaryData(data);
      }
      catch(error){
        // The source logged `console.error("Dictionary Error:".error)`, a typo
        // that always logged `undefined`; it is corrected to log the error.
        console.error("Dictionary Error:",error);
        setDictionaryData(null);
      }
    };
    fetchDefinition();
  },[showDictionary,selectedText]);

  //Apply themes dynamically
  useEffect(()=>{
    if (renditionRef.current){
      applyTheme(renditionRef.current);
    }
  }, [darkMode,fontSize,applyTheme]);

  // Search inside EPUB
useEffect(() => {

  const searchBook = async () => {

    if (
      !searchQuery ||
      !bookRef.current ||
      !renditionRef.current
    ) {
      return;
    }

    // Ignore results from a superseded search.
    const runId = searchRunRef.current + 1;
    searchRunRef.current = runId;

    // Remove the previous search highlight only
    if (searchHighlightCfiRef.current) {

      try {

        renditionRef.current.annotations.remove(
          searchHighlightCfiRef.current,
          "highlight"
        );

      } catch (err) {

        console.error(
          "Could not remove previous search highlight:",
          err
        );

      }

      searchHighlightCfiRef.current = null;
    }
    const allMatches:EpubSearchMatch[]=[];
    const spine = bookRef.current.spine as unknown as {
      spineItems: EpubSpineItem[];
    };
    const spineItems = spine.spineItems;

    for (const item of spineItems) {
      try {
        await item.load(
          bookRef.current.load.bind(
            bookRef.current
          )
        );
        const matches =
          item.find(searchQuery);
        if (matches.length > 0) {
          matches.forEach((match)=>{
            allMatches.push(match);
          });
          item.unload();
          continue;
        }
        item.unload();
      } catch (err) {
        console.error(
          "Search error:",
          err
        );
      }
    }
    if (runId !== searchRunRef.current) {
      return;
    }
    setSearchResults(allMatches);
  };
  searchBook();
}, [searchQuery,searchRunId,setSearchResults]);

  //Navigate between search results\
  useEffect(()=>{
    const navigateToSearchResult=async()=>{
      if (!searchResults||searchResults.length===0||
        !renditionRef.current){
          return;
        }
        const selectedResult=searchResults[currentSearchIndex];
        if (!selectedResult){
          return;
        }
        if (searchHighlightCfiRef.current){
          renditionRef.current.annotations.remove(searchHighlightCfiRef.current,"highlight");
        }
        await renditionRef.current.display(selectedResult.cfi);
        renditionRef.current.annotations.highlight(selectedResult.cfi,{},
          undefined,"search-highlight",{
            fill:"#ec88d3",
            "fill-opacity":"0.35",
            "mix-blend-mod":"multiply",
          }
        );
        searchHighlightCfiRef.current=selectedResult.cfi;
    };
    navigateToSearchResult();
  },[currentSearchIndex,searchResults]);
  const readerStyles={...ReactReaderStyle,
    readerArea:{...ReactReaderStyle.readerArea,
      backgroundColor:readerThemes[readerTheme].background,
      width:"100%",
      height:"100%",
      overflow:"hidden",
    },
    reader:{...ReactReaderStyle.reader,
      top:0,
      left:0,
      right:0,
      bottom:56,
      width:"100%",
      height:"calc(100% - 56px)",
    },
    arrow:{...ReactReaderStyle.arrow,
      color:readerThemes[readerTheme].text,
      top:"auto", bottom:0, marginTop:0, fontSize:28,
      width:44, height:44, padding:0, borderRadius:10,
      border:"1px solid var(--reader-line)",
      background:readerThemes[readerTheme].background,
    },
    arrowHover:{...ReactReaderStyle.arrowHover,
      color:readerThemes[readerTheme].text,
    },
    titleArea:{...ReactReaderStyle.titleArea,
      color:readerThemes[readerTheme].text,
    },
    tocArea:{...ReactReaderStyle.tocArea, background:readerThemes[readerTheme].background},
    tocAreaButton:{...ReactReaderStyle.tocAreaButton, color:readerThemes[readerTheme].text},

  };

  const epubViewStyles: IEpubViewStyle={
    viewHolder:{position:"relative",
      height:"100%",
      width:"100%",
      backgroundColor:readerThemes[readerTheme].background,
    },
    view:{height:"100%",width:"100%",
      backgroundColor:readerThemes[readerTheme].background,
    },
  };

  return (
    <div
    ref={readerContainerRef}
    style={{ height: "100%" }}>
      <ReactReader
        url={fileUrl}
        readerStyles={readerStyles}
        epubViewStyles={epubViewStyles}
        epubInitOptions={{ openAs:"epub"}}
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
    String(randomProgress)
  );
        }}

        getRendition={(rendition)=>{
          renditionRef.current=rendition;
          setRemoveHighlight(()=>(cfi?:string)=>{
            if (cfi !== undefined) {
              rendition.annotations.remove(cfi,"highlight");
            }
          });
          applyTheme(rendition);
          bookRef.current=rendition.book;
          // Expose the currently rendered chapter text for text-to-speech.
          onTextSource?.(()=>{
            const contents:Contents|Contents[]=rendition.getContents();
            const list:Contents[]=Array.isArray(contents)?contents:[contents];
            return list
              .map((item)=>item?.document?.body?.innerText??"")
              .join("\n")
              .trim();
          });
          const savedHighlights=JSON.parse(localStorage.getItem(`highlights-${book.id}`)||"[]")||[];
          savedHighlights.forEach((highlight:{
            cfi?:string;
            color?:string;
          })=>{
            if (highlight.cfi === undefined) return;
            rendition.annotations.add("highlight",highlight.cfi,{},undefined,
              `${highlight.color}-highlight`,
              {
                fill:highlight.color,
                "fill-opacity":"0.4",
              }
            );
          });
          rendition.on("selected",(cfiRange:string,contents:Contents)=>{
            const selection=contents.window.getSelection();
            const text=selection?selection.toString():"";
            if (!text){
              return;
            }
            const range=rendition.getRange(cfiRange);
            if (!range){
              return;
            }
            const selectionRect=range.getBoundingClientRect();
            const iframe=contents.document.defaultView?.frameElement;
            if (!iframe){
              return;
            }
            const iframeRect=iframe.getBoundingClientRect();
            setSelectedText(text);
            setSelectedCfi(cfiRange);
            setColorPickerPosition({
              top:iframeRect.top+selectionRect.bottom+8,
              left:iframeRect.left+selectionRect.left+selectionRect.width/2,
            });
            setShowColorPicker(true);
          });
        }}
      />
      {showColorPicker && (
        <div style={{
          position:"fixed",
          top:`${colorPickerPosition.top}px`,
          left:`${colorPickerPosition.left}px`,
          transform:"translateX(-50%)",
          background:readerThemes[readerTheme].background,
          padding:"6px 8px",
          borderRadius:"10px",
          boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
          border:`1px solid ${readerThemes[readerTheme].accent||readerThemes[readerTheme].text}`,
          zIndex:99999,
          display:"flex",
          alignItems:"center",
          gap:"6px",
        }}>
          <div style={{
            display:"flex",
            gap:"6px",
          }}>
            <button onClick={()=>{
              renditionRef.current!.annotations.add(
                "highlight",
                selectedCfi,
                {},undefined,
                "red-highlight",
                {
                  fill:"#d63030",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.id}`
              )||"[]")||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"red"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.id}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);
            }}>
              🔴
            </button>
            <button onClick={()=>{
              renditionRef.current!.annotations.add(
                "highlight",
                selectedCfi,
                {},undefined,
                "blue-highlight",
                {
                  fill:"#0a55ce",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.id}`
              )||"[]")||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"blue"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.id}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🔵
              </button>
            <button onClick={()=>{
              renditionRef.current!.annotations.add(
                "highlight",
                selectedCfi,
                {},undefined,
                "green-highlight",
                {
                  fill:"#08b611",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.id}`
              )||"[]")||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"green"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.id}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🟢
              </button>
            <button onClick={()=>{
              renditionRef.current!.annotations.add(
                "highlight",
                selectedCfi,
                {},undefined,
                "yellow-highlight",
                {
                  fill:"#f0d805",
                  "fill-opacity":"0.5",
                }
              );
              const savedHighlights = JSON.parse(localStorage.getItem(
                `highlights-${book.id}`
              )||"[]")||[];
              savedHighlights.push({
                text:selectedText,
                cfi:selectedCfi,
                color:"yellow"
              });
              setHighlights([...savedHighlights]);
              localStorage.setItem(
                `highlights-${book.id}`,
                JSON.stringify(savedHighlights)
              );
              setShowColorPicker(false);}}>
                🟡
              </button>
              <button onClick={()=>{
                console.log("DEFINE CLICKED:", selectedText);
                setShowColorPicker(false);
                onDictionaryOpen(selectedText);
              }}
              style={{
                marginTop:"15px",
              }}>
                Define
              </button>
              <button onClick={()=>setShowColorPicker(false)}
              style={{
                marginTop:"15px",
              }}>
                Cancel
              </button>
          </div>
        </div>
        )}
{showDictionary && (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "420px",
      maxWidth: "85vw",
      maxHeight: "65vh",
      overflowY: "auto",
      background: readerThemes[readerTheme].background,
      color: readerThemes[readerTheme].text,
      padding: "24px",
      borderRadius: "16px",
      boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
      border: `1px solid ${
        readerThemes[readerTheme].accent ||
        readerThemes[readerTheme].text
      }`,
      zIndex: 100000,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: "22px",
        }}
      >
        📖 Dictionary
      </h3>

      <button
        onClick={() => setShowDictionary(false)}
        style={{
          background: "transparent",
          border: "none",
          color: readerThemes[readerTheme].text,
          fontSize: "20px",
          cursor: "pointer",
          padding: "2px 6px",
        }}
      >
        ×
      </button>
    </div>

    <div
      style={{
        borderTop: `1px solid ${
          readerThemes[readerTheme].accent ||
          readerThemes[readerTheme].text
        }`,
        opacity: 0.5,
        marginBottom: "18px",
      }}
    />

    <h2
      style={{
        margin: "0 0 6px 0",
        fontSize: "26px",
      }}
    >
      {selectedText}
    </h2>

    {dictionaryData ? (
      <div>
        {dictionaryData.meanings!.map((meaning, meaningIndex) => (
          <div
            key={meaningIndex}
            style={{
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 10px 0",
                fontStyle: "italic",
                fontWeight: "bold",
                color:
                  readerThemes[readerTheme].accent ||
                  readerThemes[readerTheme].text,
              }}
            >
              {meaning.partOfSpeech}
            </p>

            {meaning.definitions!.map(
              (definition, definitionIndex) => (
                <div
                  key={definitionIndex}
                  style={{
                    marginBottom: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>{definitionIndex + 1}.</strong>{" "}
                    {definition.definition}
                  </p>

                  {definition.example && (
                    <p
                      style={{
                        margin: "8px 0 0 18px",
                        opacity: 0.7,
                        fontStyle: "italic",
                        lineHeight: "1.5",
                      }}
                    >
                      “{definition.example}”
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        ))}
      </div>
    ) : (
      <p style={{ opacity: 0.7 }}>
        Looking up definition...
      </p>
    )}

    <div
      style={{
        borderTop: `1px solid ${
          readerThemes[readerTheme].accent ||
          readerThemes[readerTheme].text
        }`,
        opacity: 0.5,
        marginTop: "10px",
        marginBottom: "14px",
      }}
    />
  </div>
)}
        </div>
  );
}
export default EPUBViewer;
