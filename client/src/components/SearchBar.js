import React, { useState } from "react";

const SearchBar = ({ setSearchQuery, setCurrentView }) => {
  const [input, setInput] = useState("");

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const trimmed = input.trim();
      setSearchQuery(trimmed);        
      setCurrentView("searchResults");    
    }
  };

  return (
    <input
      type="text"
      placeholder="Search Phreddit..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleSearch}
    />
  );
};

export default SearchBar;
