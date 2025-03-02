import * as d3 from 'd3';

export function createDataTable(data, container, options) {
    // Clear previous table
    d3.select(container).html("");
    
    const { metric, techSector, startYear, endYear } = options;
    
    // Filter data for the selected tech sector and year range
    let filteredData = data.filter(d => +d.Year >= startYear && +d.Year <= endYear);
    
    if (techSector !== 'All') {
        filteredData = filteredData.filter(d => d['Tech Sector'] === techSector);
    }
    
    // Sort data by year and country
    filteredData.sort((a, b) => {
        if (a.Year !== b.Year) {
            return +a.Year - +b.Year;
        }
        return a.Country.localeCompare(b.Country);
    });
    
    // Create table container with scrolling
    const tableContainer = d3.select(container)
        .append("div")
        .attr("class", "table-container");
    
    // Create table
    const table = tableContainer.append("table")
        .attr("class", "table table-striped");
    
    // Create table header
    const thead = table.append("thead");
    const headerRow = thead.append("tr");
    
    // Add header columns
    const columns = ["Country", "Year", "Tech Sector", metric];
    
    headerRow.selectAll("th")
        .data(columns)
        .join("th")
        .text(d => d);
    
    // Create table body
    const tbody = table.append("tbody");
    
    // Add data rows
    const rows = tbody.selectAll("tr")
        .data(filteredData)
        .join("tr")
        .on("mouseover", function() {
            d3.select(this).classed("highlight", true);
        })
        .on("mouseout", function() {
            d3.select(this).classed("highlight", false);
        });
    
    // Add cells to each row
    rows.selectAll("td")
        .data(d => [
            d.Country,
            d.Year,
            d['Tech Sector'],
            formatValue(d[metric], metric)
        ])
        .join("td")
        .text(d => d);
    
    // Helper function to format values
    function formatValue(value, metric) {
        if (metric.includes('USD')) {
            return d3.format("$,.2f")(+value);
        } else {
            return d3.format(",")(+value);
        }
    }
    
    return table;
}
