import React, { useState } from 'react';
import '../styles/ColumnSelector.css';
import { color, gray } from 'd3';

function ColumnSelector({ columns, onSelectColumn, selectedColumn }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSelect = (column) => {
    onSelectColumn(column);
    setIsOpen(false); // Close the menu after selection
  };

  return (
    <div className="column-selector">
      <button className="menu-button" onClick={toggleMenu}>
        {isOpen ? 'Close' : selectedColumn} {/* Toggle button text */}
      </button>
      {isOpen && (
        <ul className="menu-list">
          {columns.map((column, index) => (
            <li key={index} className="menu-item" onClick={() => handleSelect(column)}>
              {column}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ColumnSelector;
