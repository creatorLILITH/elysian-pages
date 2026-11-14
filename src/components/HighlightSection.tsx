"use client";

interface HighlightItem {
  text?: string;
  color?: string;
  cfi?: string;
  pageNumber?: number;
  type?: string;
}

interface HighlightSectionProps {
  highlights: HighlightItem[];
  setHighlights: (highlights: HighlightItem[]) => void;
  book: {
    id?: string | number;
    title?: string;
  } | null;
  removeHighlight: ((cfi?: string) => void) | null;
}

function HighlightSection({
  highlights,
  setHighlights,
  book: _book,
  removeHighlight,
}: HighlightSectionProps) {
  const deleteHighlight = (index: number) => {
    const highlightToDelete = highlights[index];
    if (removeHighlight && highlightToDelete) {
      removeHighlight(highlightToDelete.cfi);
    }
    const updated = highlights.filter((_, i) => i !== index);
    setHighlights(updated);
  };
  return (
    <div>
      <h2 className="reader__panel-title">
        Highlights
      </h2>
      {highlights.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          No highlights yet
        </p>
      ) : (
        highlights.map((item, index) => (
          <div
            key={index}
            style={{
              background: "var(--reader-chrome)",
              color: "var(--r-fg)",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: item.color,
                marginTop: "4px",
                flexShrink: 0,
              }}/>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  color: "var(--r-fg)",
                  lineHeight: "1.4",
                }}>
                {item.text}
              </p>
            </div>

            <button
              onClick={() => deleteHighlight(index)}
              style={{
                marginLeft: "10px",
                height: "35px",
              }}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default HighlightSection;
