function SearchBar({
  searchText,
  setSearchText,
  handleSearch,
  darkMode,
}) {

  return (
    <div
      style={{
        marginBottom: "20px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        placeholder="Search inside book..."
        value={searchText}
        onChange={(e) =>
          setSearchText(e.target.value)
        }
        style={{
          padding: "10px",
          width: "300px",
          borderRadius: "8px",
          border: "1px solid gray",
          background: darkMode
            ? "#222"
            : "#fff",
          color: darkMode
            ? "white"
            : "black",
        }}
      />

      <button
        onClick={handleSearch}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        🔍 Search
      </button>
    </div>
  );
}

export default SearchBar;