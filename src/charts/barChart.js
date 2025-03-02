import * as d3 from 'd3';

export function createBarChart(data, container, options) {
    // Clear previous chart
    d3.select(container).html("");
    
    const { metric, techSector, year } = options;
    
    // Filter data for the selected year and tech sector
    let filteredData = data.filter(d => d.Year == year);
    
    if (techSector !== 'All') {
        filteredData = filteredData.filter(d => d['Tech Sector'] === techSector);
    }
    
    // Group by country and calculate average for the metric
    const groupedData = d3.group(filteredData, d => d.Country);
    const aggregatedData = Array.from(groupedData, ([country, values]) => {
        return {
            country: country,
            value: d3.mean(values, d => +d[metric])
        };
    });
    
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
    
    // X axis
    const x = d3.scaleBand()
        .range([0, width])
        .domain(aggregatedData.map(d => d.country))
        .padding(0.3);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");
    
    // Y axis
    const y = d3.scaleLinear()
        .domain([0, d3.max(aggregatedData, d => d.value) * 1.1])
        .range([height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(5)
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
    
    // Add bars
    svg.selectAll(".bar")
        .data(aggregatedData)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.country))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.country))
        .on("mouseover", function(event, d) {
            // Highlight bar
            d3.select(this)
                .transition()
                .duration(200)
                .attr("opacity", 0.8);
            
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
            
            tooltip.html(`<strong>${d.country}</strong><br>${metric}: ${formattedValue}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Restore bar opacity
            d3.select(this)
                .transition()
                .duration(500)
                .attr("opacity", 1);
            
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
    
    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`${techSector === 'All' ? 'All Tech Sectors' : techSector} (${year})`);
    
    // Add value labels on top of bars
    svg.selectAll(".label")
        .data(aggregatedData)
        .join("text")
        .attr("class", "label")
        .attr("x", d => x(d.country) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => {
            if (metric.includes('USD')) {
                return d3.format("$.1s")(d.value);
            } else {
                return d3.format(".1f")(d.value);
            }
        });
    
    return svg;
}
