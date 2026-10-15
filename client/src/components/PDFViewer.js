import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css"
import "react-pdf/dist/Page/AnnotationLayer.css";
//Use the PDF.js worker version bundled with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc=`https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
function PDFViewer({fileUrl,readerTheme,readerThemes,book,setHighlights,
  onDictionaryOpen,}){
  const [numPages,setNumPages]=useState(null);
  const [pageNumber,setPageNumber]=useState(1);
  const [selectedText,setSelectedText]=useState("");
  const [selectedRange, setSelectedRange]=useState(null);
  const [showColorPicker,setShowColorPicker]=useState(false)
  const [selectedColor, setSelectedColor]=useState("#FF6B6B");
  const [colorPickerPosition,setColorPickerPosition]=useState({
    top:0,
    left:0,
  });
  const onDocumentLoadSuccess=({numPages})=>{
    setNumPages(numPages);
    const savedPage=Number(localStorage.getItem(`pdf-page-${book?.id}`));
    const restoredPage=Number.isInteger(savedPage)&& savedPage>=1
    ?Math.min(savedPage,numPages):1;
    setPageNumber(restoredPage);
  };
  const handleTextSelection=()=>{
    const selection=window.getSelection();
    const text=selection?.toString().trim();
    if (!text||!selection.rangeCount){
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
const applyHighlight = (color) => {
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

  window.CSS.highlights.set(
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
    const savedHighlights=JSON.parse(localStorage.getItem(`highlights-${book.id}`)||"[]");
    //Remove previously restored highlights to prevent duplicates
    for (const name of window.CSS.highlights.keys()){
      if(name.startsWith("pdf-saved-")){
        window.CSS.highlights.delete(name);
      }
    }
    const textNodes=[];
    const walker=document.createTreeWalker(textLayer,NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      textNodes.push({node,
        start:textNodes.reduce((total,item)=>total+
      item.node.textContent.length,0),
      });
    }
    const fullText=textNodes
      .map((item)=>item.node.textContent)
      .join("");
    const pageHighlights=savedHighlights.filter((item)=>item.type==="pdf" &&
      item.pageNumber &&
      item.text);
    pageHighlights.forEach((item,index)=>{
      const startIndex=fullText.indexOf(item.text);
      if(startIndex===-1) return;
      const endIndex=startIndex+item.text.length;
      const startEntry=textNodes.find((entry)=>startIndex>=entry.start &&
        startIndex<entry.start+entry.node.textContent.length);
      const endEntry=textNodes.find((entry)=>endIndex>entry.start && 
        endIndex<=entry.start+entry.node.textContent.length);
      if(!startEntry||!endEntry) return;
      const range=document.createRange();
      range.setStart(startEntry.node,startIndex-startEntry.start);
      range.setEnd(endEntry.node,endIndex-endEntry.start);
      const highlightName=`pdf-saved-${pageNumber}-${index}`;
      window.CSS.highlights.set(highlightName,new window.Highlight(range));
      let style=document.getElementById("pdf-saved-highlights-style");
      if(!style){
        style=document.createElement("style");
        style.id="pdf-saved-highlights-style";
        document.head.appendChild(style);
      }
      style.textContent+=`::highlight(${highlightName}){
      background-color:${item.color};
      color:#000000;}`;
    });
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