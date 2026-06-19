import { useState } from "react";

function NotesSection({
  notes,
  setNotes,
  saveNotes,
}) {

  const [showNotes, setShowNotes] =
    useState(false);

  const [noteTitle, setNoteTitle] =
    useState("");

  const [noteContent, setNoteContent] =
    useState("");

  const addNote = () => {

    if (
      !noteTitle.trim() ||
      !noteContent.trim()
    ) {
      return;
    }

    const newNote = {
      title: noteTitle,
      content: noteContent,
    };

    const updatedNotes = [
      ...notes,
      newNote,
    ];

    setNotes(updatedNotes);

    saveNotes(updatedNotes);

    setNoteTitle("");
    setNoteContent("");
  };

  const deleteNote = (index) => {

    const updatedNotes =
      notes.filter(
        (_, i) => i !== index
      );

    setNotes(updatedNotes);

    saveNotes(updatedNotes);
  };

  return (
    <>
      {/* Notes Toggle Button */}

      <button
        onClick={() =>
          setShowNotes(!showNotes)
        }
        style={{
          padding: "10px 16px",
          border: "none",
          borderRadius: "10px",
          background: "#3d2b1f",
          color: "#f5d7a1",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        📝 Notes ({notes.length})
      </button>

      {/* Floating Notes Panel */}

      {showNotes && (
        <div
          style={{
            position: "fixed",
            top: "120px",
            left: "20px",
            width: "350px",
            maxHeight: "70vh",
            overflowY: "auto",
            background:
              "rgba(30,30,30,0.96)",
            color: "white",
            padding: "20px",
            borderRadius: "18px",
            zIndex: 9999,
            boxShadow:
              "0 0 25px rgba(0,0,0,0.4)",
          }}
        >
          <h2>📝 Notes</h2>

          {/* Title */}

          <input
            type="text"
            placeholder="Note title..."
            value={noteTitle}
            onChange={(e) =>
              setNoteTitle(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "8px",
            }}
          />

          {/* Content */}

          <textarea
            value={noteContent}
            onChange={(e) =>
              setNoteContent(
                e.target.value
              )
            }
            placeholder="Write your note..."
            rows={5}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
            }}
          />

          <button
            onClick={addNote}
            style={{
              marginTop: "12px",
              width: "100%",
              padding: "10px",
              background: "#a47148",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            Save Note
          </button>

          <hr
            style={{
              margin:
                "20px 0",
            }}
          />

          <h3>
            Saved Notes
          </h3>

          {notes.length === 0 ? (
            <p>
              No notes yet
            </p>
          ) : (
            notes.map(
              (
                note,
                index
              ) => (
                <div
                  key={index}
                  style={{
                    background:
                      "#444",
                    padding:
                      "12px",
                    borderRadius:
                      "10px",
                    marginBottom:
                      "10px",
                  }}
                >
                  <h4>
                    {note.title}
                  </h4>

                  <p>
                    {note.content}
                  </p>

                  <button
                    onClick={() =>
                      deleteNote(
                        index
                      )
                    }
                  >
                    🗑 Delete
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

export default NotesSection;