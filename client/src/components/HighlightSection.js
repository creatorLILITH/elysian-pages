function HighlightSection({
  highlights,
  setHighlights,
  book,
  removeHighlight,
}) {
  const deleteHighlight = (index) => {
    const highlightToDelete = highlights[index];
    if (removeHighlight && highlightToDelete) {
      removeHighlight(highlightToDelete.cfi);
    }
    const updated = highlights.filter((_, i) => i !== index);
    setHighlights(updated);
  };
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>
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
              background: "#444",
              color: "white",
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
                  color: "white",
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