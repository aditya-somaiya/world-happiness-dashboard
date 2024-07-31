import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const PieChart = ({ handleChangeRegion, selectedCountries, highlightedCountries }) => {
    const [data, setData] = useState([]);
    const [selectedRegions, setSelectedRegions] = useState([]);
    const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });
    const d3Container = useRef(null);

    useEffect(() => {
        fetch('http://localhost:5000/pie-chart')
            .then(response => response.json())
            .then(data => setData(data))
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    useEffect(() => {
        if (data.length > 0 && d3Container.current) {
            const svg = d3.select(d3Container.current);
            svg.selectAll("*").remove();  // Clear previous SVG content
    
            const width = 360;
            const height = 360 + 80;
            const radius = Math.min(width, height) / 2;
    
            svg.attr('width', width)
               .attr('height', height + 40);
    
            const g = svg.append('g')
                         .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
            const color = d3.scaleOrdinal(d3.schemeCategory10);
    
            const pie = d3.pie()
                          .value(d => d['Ladder score']);
    
            const path = d3.arc()
                           .outerRadius(radius)
                           .innerRadius(0);
    
            const arc = g.selectAll(".arc")
                         .data(pie(data))
                         .enter().append("g")
                         .attr("class", "arc");
    
            arc.append("path")
               .attr("d", path)
               .attr("fill", d => color(d.data.Region))
               .attr("stroke", "white")
               .attr("stroke-width", "2px")
               .style("opacity", d => selectedRegions.includes(d.data.Region) ? 1 : 0.5)
               .on("mouseover", (event, d) => {
                   setTooltip({
                       visible: true,
                       content: `${d.data.Region}: ${d.data['Ladder score'].toFixed(2)}`,
                       x: event.pageX,
                       y: event.pageY
                   });
               })
               .on("mousemove", (event) => {
                   setTooltip(t => ({ ...t, x: event.pageX, y: event.pageY }));
               })
               .on("mouseout", () => {
                   setTooltip(t => ({ ...t, visible: false }));
               })
               .on("click", (event, d) => {
                   const region = d.data.Region;
                   const index = selectedRegions.indexOf(region);
                   const newSelectedRegions = [...selectedRegions];
                   if (index === -1) {
                       newSelectedRegions.push(region);
                   } else {
                       newSelectedRegions.splice(index, 1);
                   }
                   setSelectedRegions(newSelectedRegions);
                   handleChangeRegion(newSelectedRegions); // Pass the updated array to the parent
                   svg.selectAll(".arc path")
                       .style("opacity", p => newSelectedRegions.includes(p.data.Region) ? 1 : 0.5);
               });
    
            arc.append("text")
               .attr("transform", d => `translate(${path.centroid(d)})`)
               .attr("dy", "0.35em")
               .text(d => d.data.Region);
    
            // Add a title to the chart
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", 20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Average Happiness by Region");
        }
    }, [data, selectedRegions]); // Include selectedRegions in the dependency array
    

    return (
        <>
            <svg ref={d3Container} />
            {tooltip.visible && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${tooltip.x + 10}px`,
                        top: `${tooltip.y + 10}px`,
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #ccc',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        pointerEvents: 'none'
                    }}
                >
                    {tooltip.content}
                </div>
            )}
        </>
    );
};

export default PieChart;
