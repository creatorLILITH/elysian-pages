"use client";

interface SearchBarProps {
  searchText: string;
  setSearchText: (value: string) => void;
  handleSearch: () => void;
  darkMode: boolean;
}

export default function SearchBar({ searchText, setSearchText, handleSearch }: SearchBarProps) {
  return (
    <div className="reader-search-form">
      <input className="input" type="text" aria-label="Search inside book" placeholder="Search inside book..." value={searchText} onChange={e => setSearchText(e.target.value)} />
      <button type="button" className="btn btn--secondary" onClick={handleSearch}>Search</button>
    </div>
  );
}
