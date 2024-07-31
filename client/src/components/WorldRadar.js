import React, { useEffect, useState } from "react";
import RadarChart from "react-svg-radar-chart";
import "react-svg-radar-chart/build/css/index.css";
import * as d3 from "d3";

const WorldRadar = ({ selectedCountries }) => {
  const [radarData, setRadarData] = useState([]);
  const [error, setError] = useState('');

  // Define a list of light colors for the charts
  const colors = [
    'rgba(255, 99, 132, 0.6)', // Light pink
    'rgba(54, 162, 235, 0.6)', // Light blue
    'rgba(255, 206, 86, 0.6)', // Light yellow
    'rgba(75, 192, 192, 0.6)', // Light teal
    'rgba(153, 102, 255, 0.6)', // Light purple
    'rgba(255, 159, 64, 0.6)'  // Light orange
  ];

  useEffect(() => {
    if (selectedCountries.length > 0) {
      fetchData(selectedCountries);
    } else {
      // Define default structure with zero values
    const defaultData = {
      'Logged GDP per capita': 0,
      'Population: Labor force participation (%)': 0,
      'Total tax rate': 0,
      'Social support': 0
    };

    // Create default radar data structure
    setRadarData([{
      data: defaultData,
      meta: { color: '#ddd' }  // Using a neutral color for default display
    }]);
    }
  }, [selectedCountries]);

  const fetchData = async (countries) => {
    try {
      const url = `http://localhost:5000/country-info?countries=${countries.join(',')}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      const data = await response.json();
      setRadarData(processData(data));
    } catch (error) {
      console.error("Error fetching data for radar chart:", error);
      setError('Failed to fetch data. Please try again later.');
    }
  };

  const processData = (data) => {
    const parameters = [
      'Logged GDP per capita', 
      'Population: Labor force participation (%)', 
      'Total tax rate', 
      'Social support'
    ];
  
    // Prepare to scale each parameter independently with a balanced approach
    const scale = {};
    parameters.forEach(param => {
      const paramValues = Object.values(data).map(country => {
        let value = country[param];
        if (typeof value === 'string') {
          value = parseFloat(value.replace('%', ''));
        }
        return value;
      });
      const max = Math.max(...paramValues);
      const min = Math.min(...paramValues);
      // Adding cushioning to the scale to prevent too much sensitivity
      const cushion = (max - min) * 0.1; // 10% cushion for both ends
      scale[param] = d3.scaleLinear().domain([min - cushion, max + cushion]).range([0.1, 0.9]);
    });
  
    return Object.keys(data).map((country, index) => {
      const countryData = data[country];
      const chartData = {
        data: {},
        meta: { name: country, color: colors[index % colors.length] }
      };
  
      parameters.forEach(param => {
        let value = countryData[param];
        if (typeof value === 'string') {
          value = parseFloat(value.replace('%', ''));
        }
        if (isNaN(value)) {
          console.error(`Data for ${param} in ${country} is not a number.`);
          chartData.data[param] = 0.1; // Use the low end of the scale for missing/invalid data
        } else {
          // Apply adjusted scaling to each parameter
          chartData.data[param] = scale[param](value);
        }
      });
  
      return chartData;
    });
  };

  return (
    <>
    <h4 style={{ textAlign: 'center' }}>Country Performance Radar</h4> {/* Chart title */}
    <div className="radar-chart-container">
      
      {radarData.length > 0 ? (
        <>
          <RadarChart
            captions={{
              "Logged GDP per capita": "GDP per capita",
              "Population: Labor force participation (%)": "Labor force participation",
              "Total tax rate": "Total tax rate",
              "Social support": "Social support"
            }}
            data={radarData}
            size={450}
          />
          <div className="legend">
            {radarData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.meta.color }}></div>
                {item.meta.name}
              </div>
            ))}
          </div>
        </>
      ) : (
        error ? <p className="error-message">{error}</p> : <p className="no-data-message">No data available for radar chart.</p>
      )}
    </div>
    </>
  );
  
};

export default WorldRadar;
