"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/Page/AnnotationLayer.css";

// The source pointed the PDF.js worker at the unpkg CDN:
//   pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
// The worker is now served locally from /public so the reader works without a CDN.
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

// TypeScript's DOM lib only declares `forEach` on HighlightRegistry, so the
// methods used below are declared here.
interface HighlightRegistryWithMethods {
  set(name: string, highlight: Highlight): void;
  delete(name: string): void;
  keys(): IterableIterator<string>;
}

interface HighlightItem {
  text?: string;
  color?: string;
  pageNumber?: number;
  type?: string;
}

interface ReaderTheme {
  name: string;
  background: string;
  text: string;
  accent?: string;
}

interface PDFViewerProps {
  fileUrl: string;
  readerTheme: string;
  readerThemes: Record<string, ReaderTheme>;
  book: {
    id?: string | number;
    title?: string;
  } | null;
  setHighlights: Dispatch<SetStateAction<HighlightItem[]>>;
  onTextSource?: (getText: () => string) => void;
  onDictionaryOpen?: (word: string) => void;
}

function PDFViewer({fileUrl,readerTheme:_readerTheme,readerThemes:_readerThemes,book,setHighlights,
  onTextSource,
  onDictionaryOpen,
}:PDFViewerProps){
  const [numPages,setNumPages]=useState<number|null>(null);
  const [pageNumber,setPageNumber]=useState(1);
  const [selectedText,setSelectedText]=useState("");
  const [selectedRange, setSelectedRange]=useState<Range|null>(null);
  const [showColorPicker,setShowColorPicker]=useState(false)
  const [selectedColor, setSelectedColor]=useState("#FF6B6B");
  const [colorPickerPosition,setColorPickerPosition]=useState({
    top:0,
    left:0,
  });
  // Expose the visible page's text layer for text-to-speech.
  useEffect(()=>{
    onTextSource?.(()=>{
      const layer=document.querySelector(".react-pdf__Page .textLayer");
      return layer instanceof HTMLElement?layer.innerText:"";
    });
  },[onTextSource]);
  const onDocumentLoadSuccess=({numPages}:{numPages:number})=>{
    setNumPages(numPages);
    const savedPage=Number(localStorage.getItem(`pdf-page-${book?.id}`));
    const restoredPage=Number.isInteger(savedPage)&& savedPage>=1
    ?Math.min(savedPage,numPages):1;
    setPageNumber(restoredPage);
  };
  const handleTextSelection=()=>{
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (!selection || !text || !selection.rangeCount) {
      setShowColorPicker(false);
      return;
    }
      const range=selection.getRangeAt(0).cloneRange();
      const rect=range.getBoundingClientRect();
      setSelectedRange(range);
      setSelectedText(text);
      setColorPickerPosition({
        top:rect.bottom+8,
        left:rect.left,
      });
      setShowColorPicker(true);
    };
const applyHighlight = (color: string) => {
  if (
    !window.CSS?.highlights ||
    typeof window.Highlight !== "function"
  ) {
    alert("Text highlighting is not supported by this browser.");
    return;
  }

  if (!selectedRange || !selectedRange.startContainer.isConnected) {
    console.warn("The selected PDF text is no longer available.");
    return;
  }

  const highlightName = `pdf-highlight-${Date.now()}`;

  const style = document.createElement("style");
  style.textContent = `
    ::highlight(${highlightName}) {
      background-color: ${color};
      color: #000000;
    }
  `;
  document.head.appendChild(style);

  const highlights = window.CSS.highlights as unknown as HighlightRegistryWithMethods;

  highlights.set(
    highlightName,
    new window.Highlight(selectedRange)
  );

  if (book?.id && typeof setHighlights === "function") {
    setHighlights((prev) => [
      ...prev,
      {
        text: selectedText,
        color,
        pageNumber,
        type: "pdf",
      },
    ]);
  }

  setShowColorPicker(false);
};
const restorePdfHighlights=()=>{
  if (!book?.id||!window.CSS?.highlights||
    typeof window.Highlight!=="function"){
      return;
    }
    const textLayer=document.querySelector(
      ".react-pdf__Page .textLayer"
    );
    if(!textLayer) return;
    const savedHighlights:HighlightItem[]=JSON.parse(localStorage.getItem(`highlights-${book.id}`)||"[]")??[];
    const highlights = window.CSS.highlights as unknown as HighlightRegistryWithMethods;
    //Remove previously restored highlights to prevent duplicates
    for (const name of highlights.keys()){
      if(name.startsWith("pdf-saved-")){
        highlights.delete(name);
      }
    }
    const textNodes:{node:Node,start:number}[]=[];
    const walker=document.createTreeWalker(textLayer,NodeFilter.SHOW_TEXT);
    let node:Node|null;
    let offset=0;
    while((node=walker.nextNode())){
      textNodes.push({node,start:offset});
      offset+=node.textContent?.length??0;
    }
    const fullText=textNodes
      .map((item)=>item.node.textContent)
      .join("");
    // Only restore the highlights that belong to the page currently on screen.
    const pageHighlights=savedHighlights.filter(
      (item:HighlightItem): item is HighlightItem & { text: string } =>
        item.type==="pdf" &&
        item.pageNumber===pageNumber &&
        !!item.text
    );
    let css="";
    pageHighlights.forEach((item,index)=>{
      const startIndex=fullText.indexOf(item.text);
      if(startIndex===-1) return;
      const endIndex=startIndex+item.text.length;
      const startEntry=textNodes.find((entry)=>startIndex>=entry.start &&
        startIndex<entry.start+(entry.node.textContent?.length??0));
      const endEntry=textNodes.find((entry)=>endIndex>entry.start &&
        endIndex<=entry.start+(entry.node.textContent?.length??0));
      if(!startEntry||!endEntry) return;
      const range=document.createRange();
      range.setStart(startEntry.node,startIndex-startEntry.start);
      range.setEnd(endEntry.node,endIndex-endEntry.start);
      const highlightName=`pdf-saved-${pageNumber}-${index}`;
      highlights.set(highlightName,new window.Highlight(range));
      css+=`::highlight(${highlightName}){background-color:${item.color};color:#000000;}`;
    });
    // Replaced, not appended: the shared style element used to grow on every
    // render of the text layer.
    let style=document.getElementById("pdf-saved-highlights-style");
    if(!style){
      style=document.createElement("style");
      style.id="pdf-saved-highlights-style";
      document.head.appendChild(style);
    }
    style.textContent=css;
};
  return(
    <div style={{width:"100%",
      display:"flex",
      flexDirection:"column",
      alignItems:"center",
      gap:"15px"
    }}>
      {showColorPicker && (
        <div style={{
          position:"fixed",
          top:`${colorPickerPosition.top}px`,
          left:`${colorPickerPosition.left}px`,
          zIndex:1000,
          display:"flex",
          alignItems:"center",
          gap:"10px",
          padding:"10px 12px",
          background:"#FFFFFF",
          border:"1px slid #DDDDDD",
          borderRadius:"10px",
          boxShadow:"0 4px 16px rgba(0,0,0,0.18)",
        }}>
          {[
            {name:"Red", color:"#FF6B6B"},
            {name:"Blue", color:"#74C0FC"},
            {name:"Green", color:"#8CE99A"},
            {name:"Yellow", color:"#FFE066"},
          ].map((item)=>(
            <button key={item.name}
            type="button"
            title={item.name}
            aria-label={`Select ${item.name} highlight`}
            onClick={()=>{setSelectedColor(item.color);
              applyHighlight(item.color);
            }}
            style={{width:"24px",
              height:"24px",
              padding:0,
              borderRadius:"50%",
              backgroundColor:item.color,
              border:selectedColor===item.color
              ?"3px solid #333333"
              :"1px solid rgba(0,0,0,0.15)",
              cursor:"pointer",
              flexShrink:0,
            }}/>
          ))}
          <button type="button"
          onClick={()=>{
            if (selectedText && onDictionaryOpen){
              onDictionaryOpen(selectedText);
              setShowColorPicker(false);
            }
          }}
          disabled={!selectedText||!onDictionaryOpen}
          style={{padding:"5px 9px",
            border:"none",
            borderRadius:"5px",
            background:"#292333",
            color:"#FFFFFF",
            cursor:"pointer",
            whiteSpace:"nowrap",
          }}>
            Define
          </button>
          <button type="button"
          onClick={()=>setShowColorPicker(false)}
          aria-label="Close Color Palette"
          title="Close"
          style={{
            border:"none",
            background:"transparent",
            cursor:"pointer",
            fontSize:"16px",
          }}>
            X
          </button>
        </div>
      )}
      {/* PDF Controls */}
      <div style={{display:"flex",
        alignItems:"center",
        gap:"15px",
        padding:"8px 12px",
        borderRadius:"8px",
      }}>
        <button onClick={()=>{
          const nextPage=Math.max(pageNumber-1,1);
          setPageNumber(nextPage);
          if(book?.id){
            localStorage.setItem(`pdf-page-${book.id}`,
              String(nextPage)
            );
          }
        }}
        disabled={pageNumber<=1}>
          Previous
        </button>
        <span>
          Page {pageNumber} of {numPages|| "..."}
        </span>
        <button onClick={()=>{
          const nextPage=Math.min(pageNumber+1,numPages||pageNumber);
          setPageNumber(nextPage);
          if(book?.id){
            localStorage.setItem(`pdf-page-${book.id}`,
              String(nextPage)
            );
          }
        }}>
          Next
        </button>
      </div>
      {/* PDF */}
      <div style={{width:"100%",
        display:"flex",
        justifyContent:"center",
        overflowX:"auto",
      }}
      onMouseUp={handleTextSelection}>
        <Document file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(error:Error)=>{
          console.error("PDF load error:",error);
        }}
        loading={<p>Loading PDF....</p>}
        error={<p>Unable to load this PDF!</p>}>
          <Page pageNumber={pageNumber}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          onRenderTextLayerSuccess={restorePdfHighlights}/>
        </Document>
      </div>
    </div>
  );
}

export default PDFViewer;
