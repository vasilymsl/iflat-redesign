"use client";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";

export function TvSearchBar() {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    window.open(`https://24h.tv/search?q=${encodeURIComponent(q)}`, "_blank", "noopener");
  }, [query]);

  return (
    <form
      className="tv-search"
      onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="AI поиск фильмов и сериалов"
        className="tv-search__input"
      />
      <button type="submit" className="tv-search__btn" aria-label="Найти">
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
