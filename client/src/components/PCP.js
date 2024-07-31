import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const ParallelCoordinates = ({
  selectedRegion,
  highlightedCountries,
  selectedCountries,
  onBrushSelection,
}) => {
  const [data, setData] = useState([]);
  const [mappings, setMappings] = useState({});
  const svgRef = useRef(null);
  const [latestChangedVariable, setLatestChangedVariable] = useState(null);
  const tooltipRef = useRef(null);

  function wrapText(text, width) {
    text.each(function () {
      const text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        lineHeight = 1.1, // ems
        x = text.attr("x"),
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy") || 0);

      let word,
        line = [],
        lineNumber = 0,
        tspan = text
          .text(null)
          .append("tspan")
          .attr("x", x)
          .attr("y", y)
          .attr("dy", `${dy}em`);

      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop(); // Remove word that goes beyond width
          tspan.text(line.join(" ")); // Set text without the last word
          line = [word]; // Start a new line with the last word
          tspan = text
            .append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", `${++lineNumber * lineHeight + dy}em`)
            .text(word);
        }
      }
    });
  }

  useEffect(() => {
    fetch("http://localhost:5000/pcp")
      .then((response) => response.json())
      .then((result) => {
        setData(result.data); // Set the data for use in your plots
        setMappings(result.mappings); // Save mappings to state for reference
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLatestChangedVariable("selectedRegion");
  }, [selectedRegion]);

  useEffect(() => {
    setLatestChangedVariable("highlightedCountries");
  }, [highlightedCountries]);

  useEffect(() => {
    setLatestChangedVariable("selectedCountries");
  }, [selectedCountries]);

  useEffect(() => {
    if (data.length > 0 && Object.keys(mappings).length > 0) {
      const svg = d3.select(svgRef.current);
      const tooltip = d3.select(tooltipRef.current);
      svg.selectAll("*").remove(); // Clear SVG content
  
      const margin = { top: 50, right: 20, bottom: 50, left: 50 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
  
      const dimensions = Object.keys(data[0]).filter(
        (d) => d !== "Country name" && d !== "Region" && d !== "Income Category"
      );
  
      const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(data.map((d) => d.Region));
  
      const y = {};
      dimensions.forEach((dim) => {
        y[dim] = d3
          .scaleLinear()
          .domain(d3.extent(data, (d) => +d[dim]))
          .range([height, 0])
          .nice();
      });
  
      const x = d3
        .scalePoint()
        .range([0, width])
        .padding(0) // Adjusted padding
        .domain(dimensions);
  
      const line = d3
        .line()
        .defined(([, value]) => value != null)
        .y(([key, value]) => y[key](value))
        .x(([key]) => x(key));
  
      let filteredData = data;
  
      if (highlightedCountries.length > 0) {
        filteredData = data.filter(d =>
          highlightedCountries.includes(mappings["Country name"][d["Country name"]])
        );
      } else if (selectedRegion.length > 0) {
        filteredData = data.filter(d =>
          selectedRegion.includes(mappings["Region"][d["Region"]])
        );
      }
  
      svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)
        .selectAll("path")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("d", (d) =>
          line(Object.entries(d).filter(([key]) => dimensions.includes(key)))
        )
        .style("fill", "none")
        .style("stroke", (d) => colorScale(d.Region))
        .style("opacity", 0.7)
        .on("mouseover", (event, d) => {
          tooltip
            .style("display", "block")
            .html(`Country: ${mappings["Country name"][d["Country name"]]}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", () => {
          tooltip.style("display", "none");
        });
  
      // Other SVG elements such as axes and labels
  // Add axes and labels
  svg
  .selectAll("g.axis")
  .data(dimensions)
  .enter()
  .append("g")
  .attr("class", "axis")
  .attr(
    "transform",
    (d) => `translate(${margin.left + x(d)},${margin.top})`
  )
  .each(function (d) {
    d3.select(this).call(d3.axisLeft(y[d]));
  })
  .append("text")
  .attr("y", -9)
  .style("text-anchor", "middle")
  .style("font-size", "12px") // Increased font size
  .style("fill", "black")
  .text((d) => (d.length > 14 ? `${d.substring(0, 11)}...` : d));

// Chart title
svg
  .append("text")
  .attr("x", width / 2 + margin.left)
  .attr("y", margin.top / 2)
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("text-decoration", "underline")
  .text("Parallel Coordinates Plot for Various Indicators by Region");

      svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom + 40);
    }
  }, [data, mappings, selectedRegion, highlightedCountries, selectedCountries]);
  

  return (
    <>
      <svg ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: "absolute",
          display: "none",
          pointerEvents: "none",
          backgroundColor: "white",
          border: "solid 1px black",
          padding: "5px",
        }}
      ></div>
    </>
  );
};

export default ParallelCoordinates;
