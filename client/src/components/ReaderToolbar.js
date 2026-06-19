import { useState } from "react";
function ReaderToolbar({
  darkMode,
  setDarkMode,
  fontSize,
  setFontSize,
}) 
{
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Settings Button */}
      <button
        onClick={() =>
          setOpen(!open)
        }

        style={{
          position: "fixed",

          top: "20px",

          right: "20px",

          zIndex: 9999,

          borderRadius: "50%",

          width: "60px",

          height: "60px",

          border: "none",

          cursor: "pointer",

          fontSize: "24px",

          background:
            "rgba(43, 29, 14, 0.95)",

          color:
            "#f5d28c",

          boxShadow:
            "0 8px 30px rgba(0,0,0,0.45)",

          backdropFilter:
            "blur(10px)",

          transition:
            "0.3s ease",
        }}
      >
        ⚙
      </button>

      {/* Settings Panel */}
      {open && (
        <div
          style={{
            position: "fixed",

            top: "90px",

            right: "20px",

            zIndex: 9999,

            background:
              "rgba(43, 29, 14, 0.95)",

            color:
              "#f8e7c7",

            padding: "20px",

            borderRadius: "20px",

            boxShadow:
              "0 8px 30px rgba(0,0,0,0.45)",

            width: "240px",

            backdropFilter:
              "blur(12px)",

            border:
              "1px solid rgba(255,215,150,0.2)",
          }}
        >

          {/* Theme Toggle */}
          <button
            onClick={() =>
              setDarkMode(!darkMode)
            }

            style={{
              width: "100%",

              padding: "12px",

              marginBottom: "20px",

              borderRadius: "12px",

              border: "none",

              cursor: "pointer",

              background:
                "#8b5e34",

              color: "white",

              fontWeight: "bold",

              fontSize: "15px",
            }}
          >
            {darkMode
              ? "☀ Light Mode"
              : "🌙 Dark Mode"}
          </button>

          {/* Font Size */}
          <div>
            <label
              style={{
                display: "block",

                marginBottom: "10px",

                fontSize: "15px",
              }}
            >
              Font Size: {fontSize}px
            </label>

            <input
              type="range"

              min="14"

              max="30"

              value={fontSize}

              onChange={(e) =>
                setFontSize(
                  e.target.value
                )
              }

              style={{
                width: "100%",

                cursor: "pointer",

                accentColor:
                  "#a47148",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
export default ReaderToolbar;