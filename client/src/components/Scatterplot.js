import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const ScatterPlot = ({
  selectedColumn,
  handleHighlightedCountries,
  selectedCountries,
  selectedRegion,
}) => {
  const [data, setData] = useState({
    ladder_score: [],
    [selectedColumn]: [],
    country_name: [],
  });
  const [tooltip, setTooltip] = useState({
    display: false,
    data: { country: "", value: 0 },
    pos: { x: 0, y: 0 },
  });
  const d3Container = useRef(null);
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/scatter_data?column=${selectedColumn}`
        );
        const jsonData = await response.json();
        
        if (jsonData.error) {
          console.error("Error fetching data:", jsonData.error);
        } else {
          setData(jsonData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [selectedColumn]);

  useEffect(() => {
    if (
      data.ladder_score.length > 0 &&
      data[selectedColumn] &&
      data.country_name
    ) {
      const svg = d3.select(d3Container.current);
      svg.selectAll("*").remove();

      const margin = { top: 50, right: 30, bottom: 90, left: 100 };
      const width = 720 - margin.left - margin.right; // Adjusted from 600 to 720
      const height = 520 - margin.top - margin.bottom; // Adjusted from 500 to 600

      // Properly calculate the minimum and maximum values
      const xDomain = d3.extent(data.ladder_score);
      const yDomain = d3.extent(data[selectedColumn]);

      const x = d3
        .scaleLinear()
        .domain(xDomain) // Use full extent of ladder_score for x domain
        .range([0, width])
        .nice(); // Optional, but makes the axes end in round values

      const y = d3
        .scaleLinear()
        .domain(yDomain) // Use full extent of the selected column for y domain
        .range([height, 0])
        .nice(); // Optional, but makes the axes end in round values

      const brush = d3
        .brush()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("end", brushed);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g").call(brush);

      g.selectAll("circle")
        .data(
          data.ladder_score.map((_, i) => ({
            x: data.ladder_score[i],
            y: data[selectedColumn][i],
            country: data.country_name[i],
          }))
        )
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => y(d.y))
        .attr("r", 5)
        .style("fill", "#69b3a2")
        .on("mouseenter", (event, d) => {
          setTooltip({
            display: true,
            data: { country: d.country, value: d.y },
            pos: { x: event.clientX, y: event.clientY },
          });
        })
        .on("mouseleave", () => {
          setTooltip((prevTooltip) => ({ ...prevTooltip, display: false }));
        });

      function brushed({ selection }) {
        if (selection) {
          const [[x0, y0], [x1, y1]] = selection;
          const selectedCountries = data.ladder_score
            .map((_, i) => ({
              x: x(data.ladder_score[i]),
              y: y(data[selectedColumn][i]),
              country: data.country_name[i],
            }))
            .filter((d) => x0 <= d.x && d.x <= x1 && y0 <= d.y && d.y <= y1)
            .map((d) => d.country);

          handleHighlightedCountries(selectedCountries);
        } else {
          handleHighlightedCountries([]);
        }
      }

      // Axes and Labels
      const xAxis = g
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));
      const yAxis = g.append("g").call(d3.axisLeft(y));

      xAxis
        .append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", 40)
        .style("fill", "black")
        .style("font-size", "14px")
        .text("Happiness Score");
      yAxis
        .append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -60)
        .attr("x", -height / 2)
        .style("fill", "black")
        .style("font-size", "14px")
        .text(selectedColumn);

      svg
        .append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text(`Scatter Plot of Happiness vs. ${selectedColumn}`);
    }
  }, [data, selectedColumn]);

  return (
    <>
      <svg
        className="d3-component"
        width="600"
        height="500"
        ref={d3Container}
      />
      {tooltip.display && (
        <div
          className="tooltip"
          style={{
            position: "absolute",
            textAlign: "center",
            width: "120px",
            height: "50px",
            backgroundColor: "white",
            border: "1px solid #d9d9d9",
            borderRadius: "5px",
            padding: "10px",
            fontSize: "0.9rem",
            pointerEvents: "none",
            left: `${tooltip.pos.x + 15}px`,
            top: `${tooltip.pos.y + 15}px`,
          }}
        >
          Country: {tooltip.data.country}
          <br />
          Value: {tooltip.data.value.toFixed(2)}
        </div>
      )}
    </>
  );
};

export default ScatterPlot;
