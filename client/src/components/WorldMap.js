import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import geoData from "../data/countries.json";

const WorldMap = ({
  onCountryClick,
  selectedColumn,
  selectedRegion,
  highlightedCountries,
}) => {
  const svgRef = useRef();
  const [data, setData] = useState();
  const [clickedCountries, setClickedCountries] = useState([]);

  const fetchDataForColumn = async (columnName = null) => {
    try {
      const url =
        columnName === null
          ? "http://localhost:5000/getdata"
          : `http://localhost:5000/getdata?column=${columnName}`;
      const response = await fetch(url);
      const rawData = await response.json();
      const validatedData = rawData.map((item) => ({
        ...item,
        [selectedColumn]:
          typeof item[selectedColumn] === "number"
            ? item[selectedColumn]
            : null, // Ensure it's null if not a number
      }));
      setData(validatedData);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  };

  useEffect(() => {
    fetchDataForColumn(selectedColumn);
  }, [selectedColumn]);

  const handleClick = (countryName) => {
    setClickedCountries((prevClickedCountries) => {
      const index = prevClickedCountries.indexOf(countryName);
      if (index === -1) {
        return [...prevClickedCountries, countryName];
      } else {
        return prevClickedCountries.filter((item) => item !== countryName);
      }
    });
  };

  useEffect(() => {
    if (data) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous renderings

      const projection = d3
        .geoMercator()
        .scale(180)
        .translate([1000 / 2, 600 / 2]);
      const path = d3.geoPath().projection(projection);
      const countries = feature(geoData, geoData.objects.countries).features;

      // Create a color scale
      const maxVal = d3.max(data, (d) => d[selectedColumn]);
      const colorScale = d3
        .scaleLinear()
        .domain([0, maxVal])
        .range(["white", "blue"]);

      // Prepare the tooltip
      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid 1px black")
        .style("padding", "5px")
        .style("display", "none");

      // Draw the map
      svg
        .selectAll(".country")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", (d) => {
          const countryData = data.find(
            (cd) => cd["Country name"] === d.properties.name
          );
          return countryData ? colorScale(countryData[selectedColumn]) : "#ccc";
        })
        .attr("stroke", (d) =>
          highlightedCountries.includes(d.properties.name) ||
          clickedCountries.includes(d.properties.name)
            ? "black"
            : "none"
        )
        .attr("stroke-width", (d) =>
          highlightedCountries.includes(d.properties.name) ||
          clickedCountries.includes(d.properties.name)
            ? 2
            : 0
        )
        .on("click", (event, d) => {
          tooltip.style("display", "none");
          const countryName = d.properties.name;
          handleClick(countryName);
          onCountryClick(clickedCountries);
        })
        .on("mouseover", function (event, d) {
          const countryData = data.find(
            (cd) => cd["Country name"] === d.properties.name
          );

          // Check both for existence of countryData and that the value for selectedColumn is a number
          if (countryData && typeof countryData[selectedColumn] === "number") {
            tooltip
              .style("display", "block")
              .html(
                `Country: ${d.properties.name}<br>Value: ${countryData[
                  selectedColumn
                ].toFixed(2)}`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY + 10}px`);
          } else {
            // Handle cases where data is missing or not a number
            tooltip
              .style("display", "block")
              .html(
                `Country: ${d.properties.name}<br>Value: Data Not Available`
              )
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY + 10}px`);
          }
        })
        .on("mouseout", function () {
          tooltip.style("display", "none");
        });

      // Add title to the chart
      svg
        .append("text")
        .attr("x", 500) // Position at the center of the SVG
        .attr("y", 20) // A little down from the top
        .attr("text-anchor", "middle") // Center the text
        .style("font-size", "20px")
        .text(`World Map Visualization of ${selectedColumn}`);

      // Add a color scale legend
      const legend = svg.append("g").attr("transform", "translate(900, 20)"); // Position on the right

      const legendData = [0, maxVal / 2, maxVal].map((value) => ({
        value,
        color: colorScale(value),
      }));

      legend
        .selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("y", (d, i) => i * 30)
        .style("fill", (d) => d.color);

      legend
        .selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 30 + 15)
        .text((d) => typeof d.value === 'number' ? d.value.toFixed(2) : "N/A");

      svg
        .append("text")
        .attr("transform", "translate(900,10)") // Position above the first rectangle
        .text("Value scale");
    }
  }, [geoData, data, highlightedCountries, clickedCountries, selectedColumn]);

  // Pass clickedCountries array back to the parent component
  useEffect(() => {
    onCountryClick(clickedCountries);
  }, [clickedCountries, onCountryClick]);

  return (
    <svg
      ref={svgRef}
      width="1000"
      height="480"
      style={{ border: "1px solid black", backgroundColor: "lightblue" }}
    ></svg>
  );
};

export default WorldMap;
