"use client";

interface ReaderTheme {
  name: string;
  background: string;
  text: string;
  accent?: string;

}

interface ReaderToolbarProps {
  // The source passes these two props even though the toolbar never uses them.
  darkMode?: boolean;
  setDarkMode?: (darkMode: boolean) => void;
  fontSize: number | string;
  setFontSize: (fontSize: number | string) => void;
  readerTheme: string;
  setReaderTheme: (theme: string) => void;
  readerThemes: Record<string, ReaderTheme>;
  showHighlights: boolean;
  setShowHighlights: (show: boolean) => void;
  showBookmarks: boolean;
  setShowBookmarks: (show: boolean) => void;
  showNotes: boolean;
  setShowNotes: (show: boolean) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  showVoice: boolean;
  setShowVoice: (show: boolean) => void;
}


export function ReaderIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    highlight: "m9 4 9 9M4 16l4 4 12-12-4-4L4 16Zm-1 5h7",
    bookmark: "M6 3h12v18l-6-4-6 4V3Z",
    notes: "M14 3H4v18h16V11M13 12l7-7-3-3-7 7-1 4 4-1Z",
    search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
    voice: "M4 10v4h4l5 4V6l-5 4H4Zm12-2c3 2 3 6 0 8m3-11c5 4 5 10 0 14",
    appearance: "M12 3a9 9 0 1 0 0 18V3Z",
    minus: "M5 12h14",
    plus: "M5 12h14M12 5v14",
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function ReaderToolbar({
  fontSize, setFontSize, readerTheme, setReaderTheme, readerThemes,
  showHighlights, setShowHighlights, showBookmarks, setShowBookmarks,
  showNotes, setShowNotes, showSearch, setShowSearch, showVoice, setShowVoice,
}: ReaderToolbarProps) {
  const tools = [
    { icon: "highlight", label: "Highlights", active: showHighlights, toggle: () => setShowHighlights(!showHighlights) },
    { icon: "bookmark", label: "Bookmarks", active: showBookmarks, toggle: () => setShowBookmarks(!showBookmarks) },
    { icon: "notes", label: "Notes", active: showNotes, toggle: () => setShowNotes(!showNotes) },
    { icon: "search", label: "Search", active: showSearch, toggle: () => setShowSearch(!showSearch) },
    { icon: "voice", label: "Listen", active: showVoice, toggle: () => setShowVoice(!showVoice) },
  ];
  return (
    <div className="reader-dock" role="region" aria-label="Reading controls">
      <div className="reader-dock__tools" role="group" aria-label="Book tools">
        {tools.map(tool => (
          <button key={tool.icon} type="button" className="reader-dock__tool" aria-label={tool.label} aria-pressed={tool.active} onClick={tool.toggle} title={tool.label}>
            <ReaderIcon name={tool.icon} /><span>{tool.label}</span>
          </button>
        ))}
      </div>
      <div className="reader-dock__settings">
        <label className="reader-dock__theme">
          <ReaderIcon name="appearance" />
          <span className="sr-only">Reading theme</span>
          <select value={readerTheme} onChange={e => setReaderTheme(e.target.value)}>
            {Object.entries(readerThemes).map(([key, theme]) => <option key={key} value={key}>{theme.name}</option>)}
          </select>
        </label>
        <div className="reader-dock__size" role="group" aria-label="Text size">
          <span className="reader-dock__type" aria-hidden="true">Aa</span>
          <button type="button" aria-label="Decrease font size" disabled={Number(fontSize) <= 14} onClick={() => setFontSize(Math.max(14, Number(fontSize) - 1))}><ReaderIcon name="minus" /></button>
          <output aria-label="Font size" aria-live="polite">{fontSize}<span>px</span></output>
          <button type="button" aria-label="Increase font size" disabled={Number(fontSize) >= 30} onClick={() => setFontSize(Math.min(30, Number(fontSize) + 1))}><ReaderIcon name="plus" /></button>
        </div>
      </div>
    </div>
  );
}
