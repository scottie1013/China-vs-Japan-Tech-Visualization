import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import * as d3 from 'd3';

import { createBarChart } from './charts/barChart';
import { createLineChart } from './charts/lineChart';
import { createScatterPlot } from './charts/scatterPlot';
import { createDataTable } from './charts/dataTable';

// Load data
d3.csv('data/China vs Japan Technology.csv').then(data => {
    // Initialize dashboard
    initializeDashboard(data);
});

function initializeDashboard(data) {
    // Get unique years from data
    const years = [...new Set(data.map(d => +d.Year))].sort();
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    
    // Populate year dropdowns
    const startYearSelect = d3.select('#yearRangeStart');
    const endYearSelect = d3.select('#yearRangeEnd');
    
    years.forEach(year => {
        startYearSelect.append('option')
            .attr('value', year)
            .text(year);
        
        endYearSelect.append('option')
            .attr('value', year)
            .text(year);
    });
    
    // Set default values
    startYearSelect.property('value', minYear);
    endYearSelect.property('value', maxYear);
    
    // Initial dashboard state
    let dashboardState = {
        techSector: 'All',
        metric: 'Market Share (%)',
        startYear: minYear,
        endYear: maxYear,
        year: maxYear  // For bar chart which shows a single year
    };
    
    // Create initial charts
    updateCharts(data, dashboardState);
    
    // Set up event listeners
    d3.select('#techSectorSelect').on('change', function() {
        dashboardState.techSector = this.value;
        updateCharts(data, dashboardState);
    });
    
    d3.select('#metricSelect').on('change', function() {
        dashboardState.metric = this.value;
        updateCharts(data, dashboardState);
    });
    
    d3.select('#yearRangeStart').on('change', function() {
        dashboardState.startYear = +this.value;
        if (dashboardState.startYear > dashboardState.endYear) {
            dashboardState.endYear = dashboardState.startYear;
            endYearSelect.property('value', dashboardState.endYear);
        }
        updateCharts(data, dashboardState);
    });
    
    d3.select('#yearRangeEnd').on('change', function() {
        dashboardState.endYear = +this.value;
        if (dashboardState.endYear < dashboardState.startYear) {
            dashboardState.startYear = dashboardState.endYear;
            startYearSelect.property('value', dashboardState.startYear);
        }
        updateCharts(data, dashboardState);
    });
    
    d3.select('#yearSlider').on('input', function() {
        dashboardState.year = +this.value;
        d3.select('#yearDisplay').text(dashboardState.year);
        // Only update the bar chart when the year changes
        createBarChart(data, '#barChart', {
            metric: dashboardState.metric,
            techSector: dashboardState.techSector,
            year: dashboardState.year
        });
    });
}

function updateCharts(data, state) {
    // Update year slider
    const yearSlider = d3.select('#yearSlider');
    yearSlider.attr('min', state.startYear)
        .attr('max', state.endYear)
        .attr('value', state.year);
    
    d3.select('#yearDisplay').text(state.year);
    
    // Update all charts
    createBarChart(data, '#barChart', {
        metric: state.metric,
        techSector: state.techSector,
        year: state.year
    });
    
    createLineChart(data, '#lineChart', {
        metric: state.metric,
        techSector: state.techSector,
        startYear: state.startYear,
        endYear: state.endYear
    });
    
    createScatterPlot(data, '#scatterPlot', {
        techSector: state.techSector,
        startYear: state.startYear,
        endYear: state.endYear
    });
    
    createDataTable(data, '#dataTable', {
        metric: state.metric,
        techSector: state.techSector,
        startYear: state.startYear,
        endYear: state.endYear
    });
}
