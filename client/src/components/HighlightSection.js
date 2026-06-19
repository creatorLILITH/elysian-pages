import { useState } from "react";

function HighlightSection({
  highlights,
  setHighlights,
  book,
}) {
  console.log("Highlights:",highlights);

  const [showHighlights,
    setShowHighlights] =
      useState(false);

  const deleteHighlight =
    (index) => {

      const updated =
        highlights.filter(
          (_, i) =>
            i !== index
        );

      setHighlights(updated);

      localStorage.setItem(
        `highlights-${book.title}`,
        JSON.stringify(updated)
      );
    };

  return (
    <>
      <button
        onClick={() =>
          setShowHighlights(
            !showHighlights
          )
        }
        style={{
          padding: "10px 16px",
          border: "none",
          borderRadius: "10px",
          background: "#3d2b1f",
          color: "#f5d7a1",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        🖍 Highlights
        ({highlights.length})
      </button>

      {showHighlights && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            right: "340px",
            width: "350px",
            maxHeight: "70vh",
            overflowY: "auto",
            background:
              "rgba(30,30,30,0.96)",
            color: "white",
            padding: "20px",
            borderRadius: "18px",
            zIndex: 9999,
          }}
        >
          <h2>
            Highlights
          </h2>

          {highlights.length === 0 ? (
            <p>
              No highlights yet
            </p>
          ) : (
            highlights.map((item,index) => (
                <div
                  key={index}
                  style={{
                    background:"#444",
                    color:"white",
                    padding:"12px",
                    borderRadius:"10px",
                    marginBottom:"12px",
                    display:"flex",
                    alignItems:"flex-start",
                    gap:"10px",
                  }}
                >
                <div style={{
                  width:"16px",
                  height:"16px",
                  borderRadius:"50%",
                  background:item.color,
                  marginTop:"4px",
                  flexShrink:0,
                }}></div>
                <div style={{ flex:1 }}>
                  <p style={{
                    margin:0,
                    color:"white",
                    lineHeight:"1.4",
                  }}>
                    {item.text}
                  </p>
                  </div>

                  <button
                    onClick={()=>deleteHighlight(index)
                    }
                    style={{
                      marginLeft:"10px",
                      height:"35px",
                    }}
                  >
                    🗑 Delete
                  </button>
                </div>
            )
          ))}
        </div>
      )}
    </>
  );
}

export default HighlightSection;