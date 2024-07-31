import './App.css';
import { useState, useEffect } from 'react';
import WorldMap from './components/WorldMap';
import ColumnSelector from './components/ColumnSelector';
import ScatterPlot from './components/Scatterplot';
import PieChart from './components/PieChart';
import PCP from './components/PCP';
import WorldRadar from './components/WorldRadar';

function App() {
  const [columnNames, setColumnNames] = useState([]);

  useEffect(() => {
    // Function to fetch column names from the backend
    const fetchColumnNames = async () => {
      try {
        // Adjust the URL as needed based on your Flask app's URL
        const response = await fetch('http://localhost:5000/columns');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setColumnNames(data);
      } catch (error) {
        console.error('Failed to fetch column names:', error);
      }
    };

    fetchColumnNames();
  }, []);
  const [selectedColumn, setSelectedColumn] = useState("GDP per capita");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(["Africa", "Asia", "Europe", "North America", "Oceania", "South America"]);
  const [highlightedCountries, setHighlightedCountries] = useState([]);

  const handleColumnSelect = column => {
    setSelectedColumn(column);
  };

  const handleCountryClick = country => {
    setSelectedCountries(country)
  };

  const handleChangeRegion = region => {
    setSelectedRegion(region);
  }

  const handleHighlightedCountries = countries => {
    setHighlightedCountries(countries);
  }

  return (
    <div className="app-container">
      <div className="banner">
      <ColumnSelector columns={columnNames} onSelectColumn={handleColumnSelect} selectedColumn={selectedColumn} />
        <div className="title">World Stats and Understanding Happiness
</div>
        
      </div>
      <div className="component">
        <WorldMap selectedColumn={selectedColumn} onCountryClick={handleCountryClick} selectedRegion={selectedRegion} highlightedCountries={highlightedCountries}/>
      </div>
      <div className="component">
        <ScatterPlot selectedColumn={selectedColumn} handleHighlightedCountries={handleHighlightedCountries} selectedCountries={selectedCountries} selectedRegion={selectedRegion}/>
      </div>
      <div className="component">
        <WorldRadar selectedCountries={selectedCountries}/>
      </div>
      <div className="component">
        <PieChart handleChangeRegion={handleChangeRegion} selectedCountries={selectedCountries} highlightedCountries={highlightedCountries}/>
      </div>
      <div className="component">
        <PCP selectedRegion={selectedRegion} highlightedCountries={highlightedCountries} selectedCountries={selectedCountries}/>
      </div>
    </div>
  );
}

export default App;
