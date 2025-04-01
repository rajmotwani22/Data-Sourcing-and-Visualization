import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import '../styles/Visualizations.css';

const Visualizations = ({ data, summary, filters }) => {
  const barChartRef = useRef();
  const timeChartRef = useRef();
  const pieChartRef = useRef();
  
  // Group data by company for the bar chart
  const companyData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price)
      }),
      d => d.company
    );
    
    return Array.from(groupedData, ([company, data]) => ({
      company,
      count: data.count,
      totalSales: data.totalSales
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [data]);
  
  // Group data by month and year for the time chart
  const timeData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price),
        avgPrice: d3.mean(v, d => d.price)
      }),
      d => d.year,
      d => d.month
    );
    
    const result = [];
    
    groupedData.forEach((months, year) => {
      months.forEach((data, month) => {
        result.push({
          year,
          month,
          date: new Date(year, month - 1),
          count: data.count,
          totalSales: data.totalSales,
          avgPrice: data.avgPrice
        });
      });
    });
    
    return result.sort((a, b) => a.date - b.date);
  }, [data]);
  
  // Group data by source for the pie chart
  const sourceData = React.useMemo(() => {
    const groupedData = d3.rollup(
      data,
      v => ({
        count: v.length,
        totalSales: d3.sum(v, d => d.price)
      }),
      d => d.source
    );
    
    return Array.from(groupedData, ([source, data]) => ({
      source: source === 'source_a' ? 'Source A' : 'Source B',
      count: data.count,
      totalSales: data.totalSales
    }));
  }, [data]);
  
  // Create bar chart
  useEffect(() => {
    if (!companyData.length || !barChartRef.current) return;
    
    // Clear previous chart
    d3.select(barChartRef.current).selectAll('*').remove();
    
    const margin = { top: 30, right: 30, bottom: 70, left: 80 };
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(barChartRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // X axis
    const x = d3.scaleBand()
      .range([0, width])
      .domain(companyData.map(d => d.company))
      .padding(0.2);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
        
    // Y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(companyData, d => d.totalSales) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `$${d3.format(',')(d)}`));
      
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Total Sales by Company');
      
    // Y axis label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Total Sales ($)');
      
    // Add bars
    svg.selectAll('rect')
      .data(companyData)
      .enter()
      .append('rect')
        .attr('x', d => x(d.company))
        .attr('y', d => y(d.totalSales))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.totalSales))
        .attr('fill', '#4f9eda')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('fill', '#2a7ab8');
          
          // Show tooltip
          const tooltip = d3.select('.bar-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d.company}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill', '#4f9eda');
          d3.select('.bar-tooltip').style('display', 'none');
        });
  }, [companyData]);
  
  // Create time series chart
  useEffect(() => {
    if (!timeData.length || !timeChartRef.current) return;
    
    // Clear previous chart
    d3.select(timeChartRef.current).selectAll('*').remove();
    
    const margin = { top: 30, right: 60, bottom: 70, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(timeChartRef.current)
      .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
      .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
    // X axis
    const x = d3.scaleTime()
      .domain(d3.extent(timeData, d => d.date))
      .range([0, width]);
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%b %Y')))
      .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end');
        
    // Y axis for sales
    const y1 = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.totalSales) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .call(d3.axisLeft(y1).tickFormat(d => `$${d3.format(',')(d)}`));
      
    // Y axis for count (right side)
    const y2 = d3.scaleLinear()
      .domain([0, d3.max(timeData, d => d.count) * 1.1])
      .range([height, 0]);
      
    svg.append('g')
      .attr('transform', `translate(${width}, 0)`)
      .call(d3.axisRight(y2));
      
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Sales Over Time');
      
    // Y axis label (left)
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -60)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Total Sales ($)');
      
    // Y axis label (right)
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', width + 40)
      .attr('x', -(height / 2))
      .attr('text-anchor', 'middle')
      .text('Number of Sales');
      
    // Add line for total sales
    const salesLine = d3.line()
      .x(d => x(d.date))
      .y(d => y1(d.totalSales));
      
    svg.append('path')
      .datum(timeData)
      .attr('fill', 'none')
      .attr('stroke', '#4f9eda')
      .attr('stroke-width', 3)
      .attr('d', salesLine);
      
    // Add line for count
    const countLine = d3.line()
      .x(d => x(d.date))
      .y(d => y2(d.count));
      
    svg.append('path')
      .datum(timeData)
      .attr('fill', 'none')
      .attr('stroke', '#f79646')
      .attr('stroke-width', 3)
      .attr('d', countLine);
      
    // Add circles for sales points
    svg.selectAll('.sales-circle')
      .data(timeData)
      .enter()
      .append('circle')
        .attr('class', 'sales-circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y1(d.totalSales))
        .attr('r', 5)
        .attr('fill', '#4f9eda')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 8);
          
          // Show tooltip
          const tooltip = d3.select('.time-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}<br>
              Average Price: $${d3.format(',')(d.avgPrice.toFixed(2))}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          d3.select('.time-tooltip').style('display', 'none');
        });
        
    // Add circles for count points
    svg.selectAll('.count-circle')
      .data(timeData)
      .enter()
      .append('circle')
        .attr('class', 'count-circle')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y2(d.count))
        .attr('r', 5)
        .attr('fill', '#f79646')
        .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 8);
          
          // Show tooltip
          const tooltip = d3.select('.time-tooltip');
          tooltip.style('display', 'block')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 20}px`)
            .html(`
              <strong>${d3.timeFormat('%B %Y')(d.date)}</strong><br>
              Total Sales: $${d3.format(',')(d.totalSales.toFixed(2))}<br>
              Number of Sales: ${d.count}<br>
              Average Price: $${d3.format(',')(d.avgPrice.toFixed(2))}
            `);
        })
        .on('mouseout', function() {
          d3.select(this).attr('r', 5);
          d3.select('.time-tooltip').style('display', 'none');
        });
        
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, ${height - 80})`);
      
    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 150)
      .attr('height', 80)
      .attr('fill', 'white')
      .attr('stroke', '#ccc');
      
    // Sales legend
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 20)
      .attr('r', 6)
      .attr('fill', '#4f9eda');
      
    legend.append('text')
      .attr('x', 40)
      .attr('y', 20)
      .attr('dy', '0.32em')
      .text('Total Sales ($)');
      
    // Count legend
    legend.append('circle')
      .attr('cx', 20)
      .attr('cy', 50)
      .attr('r', 6)
      .attr('fill', '#f79646');
      
    legend.append('text')
      .attr('x', 40)
      .attr('y', 50)
      .attr('dy', '0.32em')
      .text('Number of Sales');
  }, [timeData]);
  
  // Create pie chart
  useEffect(() => {
    if (!sourceData.length || !pieChartRef.current) return;
    
    // Clear previous chart
    d3.select(pieChartRef.current).selectAll('*').remove();
    
    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2;
    
    // Create SVG
    const svg = d3.select(pieChartRef.current)
      .append('svg')
        .attr('width', width)
        .attr('height', height)
      .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
        
    // Create color scale
    const color = d3.scaleOrdinal()
      .domain(sourceData.map(d => d.source))
      .range(['#4f9eda', '#f79646']);
      
    // Compute the position of each group on the pie
    const pie = d3.pie()
      .value(d => d.totalSales)
      .sort(null);
      
    const data_ready = pie(sourceData);
    
    // Build the pie chart
    svg.selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
      )
      .attr('fill', d => color(d.data.source))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1);
        
        // Show tooltip
        const tooltip = d3.select('.pie-tooltip');
        tooltip.style('display', 'block')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 20}px`)
          .html(`
            <strong>${d.data.source}</strong><br>
            Total Sales: $${d3.format(',')(d.data.totalSales.toFixed(2))}<br>
            Number of Sales: ${d.data.count}<br>
            Percentage: ${(d.data.totalSales / d3.sum(sourceData, d => d.totalSales) * 100).toFixed(1)}%
          `);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
        d3.select('.pie-tooltip').style('display', 'none');
      });
      
    // Add percentages
    svg.selectAll('whatever')
      .data(data_ready)
      .enter()
      .append('text')
      .text(d => {
        const percent = (d.data.totalSales / d3.sum(sourceData, d => d.totalSales) * 100).toFixed(1);
        return `${percent}%`;
      })
      .attr('transform', d => {
        const pos = d3.arc()
          .innerRadius(radius * 0.5)
          .outerRadius(radius * 0.8)
          .centroid(d);
        return `translate(${pos})`;
      })
      .style('text-anchor', 'middle')
      .style('font-size', '15px')
      .style('font-weight', 'bold')
      .style('fill', 'white');
      
    // Add title
    svg.append('text')
      .attr('x', 0)
      .attr('y', -height / 2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .text('Sales by Data Source');
      
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${-width / 2 + 50}, ${height / 2 - 60})`);
      
    legend.selectAll('whatever')
      .data(sourceData)
      .enter()
      .append('rect')
        .attr('x', 0)
        .attr('y', (d, i) => i * 30)
        .attr('width', 20)
        .attr('height', 20)
        .attr('fill', d => color(d.source));
        
    legend.selectAll('whatever')
      .data(sourceData)
      .enter()
      .append('text')
        .attr('x', 30)
        .attr('y', (d, i) => i * 30 + 15)
        .text(d => d.source)
        .style('font-size', '15px')
        .attr('alignment-baseline', 'middle');
  }, [sourceData]);
  
  return (
    <div className="visualizations">
      {data.length === 0 ? (
        <div className="no-data">No data available for the selected filters.</div>
      ) : (
        <>
          <div className="charts-container">
            <div className="chart-wrapper time-chart-wrapper">
              <div ref={timeChartRef} className="chart time-chart"></div>
              <div className="time-tooltip tooltip"></div>
            </div>
            
            <div className="charts-row">
              <div className="chart-wrapper bar-chart-wrapper">
                <div ref={barChartRef} className="chart bar-chart"></div>
                <div className="bar-tooltip tooltip"></div>
              </div>
              
              <div className="chart-wrapper pie-chart-wrapper">
                <div ref={pieChartRef} className="chart pie-chart"></div>
                <div className="pie-tooltip tooltip"></div>
              </div>
            </div>
          </div>
          
          <div className="data-stats">
            <div className="stat-card">
              <h4>Total Records</h4>
              <p className="stat-value">{data.length}</p>
            </div>
            
            <div className="stat-card">
              <h4>Total Sales</h4>
              <p className="stat-value">
                ${data.reduce((sum, item) => sum + item.price, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="stat-card">
              <h4>Average Price</h4>
              <p className="stat-value">
                ${(data.reduce((sum, item) => sum + item.price, 0) / data.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="stat-card">
              <h4>Date Range</h4>
              <p className="stat-value">
                {data.length > 0 ? (
                  <>
                    {new Date(Math.min(...data.map(item => item.sale_date ? new Date(item.sale_date) : new Date()))).toLocaleDateString()}
                    {' to '}
                    {new Date(Math.max(...data.map(item => item.sale_date ? new Date(item.sale_date) : new Date()))).toLocaleDateString()}
                  </>
                ) : 'N/A'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Visualizations;