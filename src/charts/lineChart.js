import * as d3 from 'd3';

export function createLineChart(data, container, options) {
    // Clear previous chart
    d3.select(container).html("");
    
    const { metric, techSector, startYear, endYear } = options;
    
    // Filter data for the selected tech sector and year range
    let filteredData = data.filter(d => +d.Year >= startYear && +d.Year <= endYear);
    
    if (techSector !== 'All') {
        filteredData = filteredData.filter(d => d['Tech Sector'] === techSector);
    }
    
    // Group by country and year, then calculate average for the metric
    const nestedData = d3.group(filteredData, d => d.Country);
    
    const lineData = Array.from(nestedData, ([country, countryData]) => {
        // Group by year
        const yearGroups = d3.group(countryData, d => d.Year);
        
        // Calculate average for each year
        const yearlyData = Array.from(yearGroups, ([year, values]) => {
            return {
                year: +year,
                value: d3.mean(values, d => +d[metric])
            };
        }).sort((a, b) => a.year - b.year);
        
        return {
            country: country,
            values: yearlyData
        };
    });
    
    // Set up dimensions
    const margin = {top: 40, right: 80, bottom: 60, left: 80};
    const width = d3.select(container).node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // X axis
    const x = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([0, width]);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x)
            .tickFormat(d3.format("d"))
            .ticks(Math.min(endYear - startYear + 1, 10)))
        .style("font-size", "12px");
    
    // X axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Year");
    
    // Find min and max values across all countries
    const allValues = lineData.flatMap(d => d.values.map(v => v.value));
    const yMin = d3.min(allValues);
    const yMax = d3.max(allValues);
    const yPadding = (yMax - yMin) * 0.1;
    
    // Y axis
    const y = d3.scaleLinear()
        .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
        .range([height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(d => {
                if (metric.includes('USD')) {
                    return d3.format("$.2s")(d);
                } else {
                    return d3.format(",")(d);
                }
            }))
        .style("font-size", "12px");
    
    // Y axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text(metric);
    
    // Color scale
    const color = d3.scaleOrdinal()
        .domain(["China", "Japan"])
        .range(["#1e88e5", "#ff5722"]);
    
    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);
    
    // Add lines with transition
    lineData.forEach(country => {
        // Create path with initial zero opacity
        const path = svg.append("path")
            .datum(country.values)
            .attr("fill", "none")
            .attr("stroke", color(country.country))
            .attr("stroke-width", 3)
            .attr("d", line)
            .style("opacity", 0);
        
        // Animate path
        const pathLength = path.node().getTotalLength();
        
        path.attr("stroke-dasharray", pathLength)
            .attr("stroke-dashoffset", pathLength)
            .style("opacity", 1)
            .transition()
            .duration(1000)
            .attr("stroke-dashoffset", 0);
        
        // Add dots
        svg.selectAll(`.dot-${country.country.replace(/\s+/g, '')}`)
            .data(country.values)
            .join("circle")
            .attr("class", `dot-${country.country.replace(/\s+/g, '')}`)
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.value))
            .attr("r", 5)
            .attr("fill", color(country.country))
            .style("opacity", 0)
            .on("mouseover", function(event, d) {
                // Highlight dot
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8);
                
                // Show tooltip
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                let formattedValue;
                if (metric.includes('USD')) {
                    formattedValue = d3.format("$,.2f")(d.value);
                } else {
                    formattedValue = d3.format(",")(d.value);
                }
                
                tooltip.html(`<strong>${country.country} (${d.year})</strong><br>${metric}: ${formattedValue}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                // Restore dot size
                d3.select(this)
                    .transition()
                    .duration(500)
                    .attr("r", 5);
                
                // Hide tooltip
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .transition()
            .delay((d, i) => i * 100 + 1000)
            .duration(500)
            .style("opacity", 1);
    });
    
    // Add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 100}, 0)`);
    
    lineData.forEach((country, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);
        
        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(country.country));
        
        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .text(country.country);
    });
    
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`${techSector === 'All' ? 'All Tech Sectors' : techSector} Trend (${startYear}-${endYear})`);
    
    return svg;
}
