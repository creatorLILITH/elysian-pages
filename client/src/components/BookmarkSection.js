import { useState } from "react";

function BookmarkSection({
  isEPUB,
  bookmarks,
  addBookmark,
  deleteBookmark,
  setLocationState,
}) {

  const [showBookmarks, setShowBookmarks] =
    useState(false);

  if (!isEPUB) return null;

  return (
    <>
      {/* Top Buttons */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={addBookmark}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: "#a47148",
            color: "white",
            cursor: "pointer",
          }}
        >
          🔖 Add Bookmark
        </button>

        <button
          onClick={() =>
            setShowBookmarks(
              !showBookmarks
            )
          }
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "10px",
            background: "#3d2b1f",
            color: "#f5d7a1",
            cursor: "pointer",
          }}
        >
          📑 Bookmarks
          ({bookmarks.length})
        </button>
      </div>

      {/* Floating Panel */}
      {showBookmarks && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            right: "20px",
            width: "300px",
            maxHeight: "400px",
            overflowY: "auto",
            background:
              "rgba(30,30,30,0.95)",
            color: "white",
            padding: "20px",
            borderRadius: "16px",
            zIndex: 9999,
            boxShadow:
              "0 0 20px rgba(0,0,0,0.4)",
          }}
        >
          <h3>
            Bookmarks
          </h3>

          {bookmarks.length === 0 ? (
            <p>
              No bookmarks yet
            </p>
          ) : (
            bookmarks.map(
              (
                mark,
                index
              ) => (
                <div
                  key={index}
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "10px",
                  }}
                >
                  <button
                    onClick={() =>
                      setLocationState(
                        mark
                      )
                    }
                    style={{
                      flex: 1,
                      marginRight:
                        "10px",
                      cursor:
                        "pointer",
                    }}
                  >
                    Bookmark
                    {" "}
                    {index + 1}
                  </button>

                  <button
                    onClick={() =>
                      deleteBookmark(
                        index
                      )
                    }
                    style={{
                      cursor:
                        "pointer",
                    }}
                  >
                    🗑
                  </button>
                </div>
              )
            )
          )}
        </div>
      )}
    </>
  );
}

export default BookmarkSection;