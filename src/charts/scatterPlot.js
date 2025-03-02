import * as d3 from 'd3';

export function createScatterPlot(data, container, options) {
    // Clear previous chart
    d3.select(container).html("");
    
    const { techSector, startYear, endYear } = options;
    
    // Filter data for the selected tech sector and year range
    let filteredData = data.filter(d => +d.Year >= startYear && +d.Year <= endYear);
    
    if (techSector !== 'All') {
        filteredData = filteredData.filter(d => d['Tech Sector'] === techSector);
    }
    
    // Set up dimensions
    const margin = {top: 40, right: 30, bottom: 60, left: 80};
    const width = d3.select(container).node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // X axis - R&D Investment
    const x = d3.scaleLog()
        .domain([d3.min(filteredData, d => Math.max(1, +d['R&D Investment (in USD)'])) * 0.8, 
                 d3.max(filteredData, d => +d['R&D Investment (in USD)']) * 1.2])
        .range([0, width]);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d => d3.format("$.2s")(d)))
        .style("font-size", "12px");
    
    // X axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("R&D Investment (USD)");
    
    // Y axis - Patents Filed
    const y = d3.scaleLog()
        .domain([d3.min(filteredData, d => Math.max(1, +d['Number of Patents Filed (Annual)'])) * 0.8,
                 d3.max(filteredData, d => +d['Number of Patents Filed (Annual)']) * 1.2])
        .range([height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => d3.format(",")(d)))
        .style("font-size", "12px");
    
    // Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Patents Filed (Annual)");
    
    // Color scale
    const color = d3.scaleOrdinal()
        .domain(["China", "Japan"])
        .range(["#1e88e5", "#ff5722"]);
    
    // Size scale for bubbles based on Tech Exports
    const size = d3.scaleLinear()
        .domain([d3.min(filteredData, d => +d['Tech Exports (in USD)']),
                 d3.max(filteredData, d => +d['Tech Exports (in USD)'])])
        .range([5, 20]);
    
    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Add dots with transition
    svg.selectAll(".dot")
        .data(filteredData)
        .join("circle")
        .attr("class", "dot")
        .attr("cx", d => x(Math.max(1, +d['R&D Investment (in USD)'])))
        .attr("cy", d => y(Math.max(1, +d['Number of Patents Filed (Annual)'])))
        .attr("r", 0)  // Start with radius 0 for transition
        .attr("fill", d => color(d.Country))
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
            // Highlight dot
            d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 1)
                .attr("stroke-width", 2);
            
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            
            tooltip.html(`
                <strong>${d.Country} (${d.Year})</strong><br>
                Tech Sector: ${d['Tech Sector']}<br>
                R&D Investment: ${d3.format("$,.2f")(+d['R&D Investment (in USD)'])}<br>
                Patents Filed: ${d3.format(",")(+d['Number of Patents Filed (Annual)'])}<br>
                Tech Exports: ${d3.format("$,.2f")(+d['Tech Exports (in USD)'])}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Restore dot appearance
            d3.select(this)
                .transition()
                .duration(500)
                .attr("opacity", 0.7)
                .attr("stroke-width", 1);
            
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()  // Add transition for dots appearing
        .duration(1000)
        .delay((d, i) => i * 10)
        .attr("r", d => size(+d['Tech Exports (in USD)']));
    
    // Add legend for countries
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 120}, 0)`);
    
    const countries = ["China", "Japan"];
    
    countries.forEach((country, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("circle")
            .attr("r", 6)
            .attr("fill", color(country));
        
        legendRow.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text(country);
    });
    
    // Add legend for bubble size
    const sizeLegend = svg.append("g")
        .attr("class", "size-legend")
        .attr("transform", `translate(${width - 120}, 60)`);
    
    sizeLegend.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .style("font-size", "12px")
        .text("Tech Exports:");
    
    const sizeValues = [1e9, 5e10, 1e11];
    
    sizeValues.forEach((value, i) => {
        sizeLegend.append("circle")
            .attr("cx", 10)
            .attr("cy", i * 25 + 10)
            .attr("r", size(value))
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("opacity", 0.5);
        
        sizeLegend.append("text")
            .attr("x", 25)
            .attr("y", i * 25 + 15)
            .style("font-size", "10px")
            .text(d3.format("$.1s")(value));
    });
    
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`R&D Investment vs Patents Filed (${startYear}-${endYear})`);
    
    return svg;
}
