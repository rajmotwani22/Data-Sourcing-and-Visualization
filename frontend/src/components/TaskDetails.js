import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Visualizations from './Visualizations';
import '../styles/TaskDetails.css';

const API_BASE_URL = 'http://localhost:8000/api';

const TaskDetails = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: 'all',
    month: 'all',
    company: 'all',
    model: 'all',
    source: 'all'
  });
  
  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    years: [],
    months: [],
    companies: [],
    models: [],
    sources: ['source_a', 'source_b']
  });

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        // Fetch task details
        const taskResponse = await axios.get(`${API_BASE_URL}/tasks/${taskId}`);
        setTask(taskResponse.data);
        
        // Check if task is completed
        if (taskResponse.data.status === 'completed') {
          // Fetch task data and summary
          const [dataResponse, summaryResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/tasks/${taskId}/data`),
            axios.get(`${API_BASE_URL}/tasks/${taskId}/summary`)
          ]);
          
          setData(dataResponse.data);
          setSummary(summaryResponse.data);
          
          // Extract filter options from data
          const years = [...new Set(dataResponse.data.map(item => item.year).filter(Boolean))];
          const months = [...new Set(dataResponse.data.map(item => item.month).filter(Boolean))];
          const companies = [...new Set(dataResponse.data.map(item => item.company).filter(Boolean))];
          const models = [...new Set(dataResponse.data.map(item => item.car_model).filter(Boolean))];
          
          setFilterOptions({
            years: years.sort((a, b) => a - b),
            months: months.sort((a, b) => a - b),
            companies,
            models,
            sources: ['source_a', 'source_b']
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('Failed to fetch task details. Please try again later.');
        setLoading(false);
      }
    };

    fetchTaskDetails();
    
    // Poll for updates if task is not completed
    const intervalId = setInterval(() => {
      if (task && task.status !== 'completed') {
        fetchTaskDetails();
      }
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [taskId, task?.status]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Function to get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge pending';
      case 'in_progress':
        return 'status-badge in-progress';
      case 'completed':
        return 'status-badge completed';
      case 'failed':
        return 'status-badge failed';
      default:
        return 'status-badge';
    }
  };

  // Apply filters to data
  const getFilteredData = () => {
    if (!data.length) return [];
    
    return data.filter(item => {
      if (filters.year !== 'all' && item.year !== parseInt(filters.year)) return false;
      if (filters.month !== 'all' && item.month !== parseInt(filters.month)) return false;
      if (filters.company !== 'all' && item.company !== filters.company) return false;
      if (filters.model !== 'all' && item.car_model !== filters.model) return false;
      if (filters.source !== 'all' && item.source !== filters.source) return false;
      return true;
    });
  };
  
  // Get filter options for months
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  };

  if (loading) {
    return <div className="loading">Loading task details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!task) {
    return <div className="error">Task not found.</div>;
  }

  return (
    <div className="task-details">
      <div className="back-link">
        <Link to="/">← Back to Tasks</Link>
      </div>
      
      <div className="task-header">
        <h2>Task #{taskId}</h2>
        <span className={getStatusBadgeClass(task.status)}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="task-info">
        <div className="info-group">
          <div className="info-item">
            <strong>Created:</strong> {formatDate(task.created_at)}
          </div>
          <div className="info-item">
            <strong>Updated:</strong> {formatDate(task.updated_at)}
          </div>
        </div>
        
        <div className="parameters">
          <h3>Task Parameters</h3>
          
          <div className="parameters-grid">
            <div className="parameter-group">
              <h4>Source A (JSON)</h4>
              <ul>
                {task.parameters.source_a.start_date && (
                  <li><strong>Start Date:</strong> {task.parameters.source_a.start_date}</li>
                )}
                {task.parameters.source_a.end_date && (
                  <li><strong>End Date:</strong> {task.parameters.source_a.end_date}</li>
                )}
                {task.parameters.source_a.companies && task.parameters.source_a.companies.length > 0 && (
                  <li>
                    <strong>Companies:</strong> {task.parameters.source_a.companies.join(', ')}
                  </li>
                )}
                {task.parameters.source_a.models && task.parameters.source_a.models.length > 0 && (
                  <li>
                    <strong>Models:</strong> {task.parameters.source_a.models.join(', ')}
                  </li>
                )}
              </ul>
            </div>
            
            <div className="parameter-group">
              <h4>Source B (CSV)</h4>
              <ul>
                {task.parameters.source_b.start_date && (
                  <li><strong>Start Date:</strong> {task.parameters.source_b.start_date}</li>
                )}
                {task.parameters.source_b.end_date && (
                  <li><strong>End Date:</strong> {task.parameters.source_b.end_date}</li>
                )}
                {task.parameters.source_b.companies && task.parameters.source_b.companies.length > 0 && (
                  <li>
                    <strong>Companies:</strong> {task.parameters.source_b.companies.join(', ')}
                  </li>
                )}
                {task.parameters.source_b.models && task.parameters.source_b.models.length > 0 && (
                  <li>
                    <strong>Models:</strong> {task.parameters.source_b.models.join(', ')}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {task.status === 'completed' && data.length > 0 && (
        <div className="visualization-section">
          <h3>Data Visualizations</h3>
          
          <div className="filters">
            <div className="filter-group">
              <label>Year:</label>
              <select 
                value={filters.year} 
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="all">All Years</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Month:</label>
              <select 
                value={filters.month} 
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="all">All Months</option>
                {filterOptions.months.map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Company:</label>
              <select 
                value={filters.company} 
                onChange={(e) => handleFilterChange('company', e.target.value)}
              >
                <option value="all">All Companies</option>
                {filterOptions.companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Model:</label>
              <select 
                value={filters.model} 
                onChange={(e) => handleFilterChange('model', e.target.value)}
              >
                <option value="all">All Models</option>
                {filterOptions.models.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Source:</label>
              <select 
                value={filters.source} 
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="source_a">Source A</option>
                <option value="source_b">Source B</option>
              </select>
            </div>
          </div>
          
          <Visualizations 
            data={getFilteredData()} 
            summary={summary} 
            filters={filters}
          />
          
          <div className="data-summary">
            <h3>Data Summary</h3>
            <p>Showing {getFilteredData().length} of {data.length} records</p>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company</th>
                  <th>Model</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredData().slice(0, 10).map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.company}</td>
                    <td>{item.car_model}</td>
                    <td>{item.sale_date ? new Date(item.sale_date).toLocaleDateString() : 'N/A'}</td>
                    <td>${item.price ? item.price.toLocaleString() : 'N/A'}</td>
                    <td>{item.source === 'source_a' ? 'Source A' : 'Source B'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {getFilteredData().length > 10 && (
              <div className="table-note">
                <p>Showing 10 of {getFilteredData().length} records</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {task.status === 'pending' && (
        <div className="task-status-message pending">
          <p>Task is in the queue and will start processing soon...</p>
        </div>
      )}
      
      {task.status === 'in_progress' && (
        <div className="task-status-message in-progress">
          <p>Task is currently processing...</p>
          <div className="progress-indicator">
            <div className="spinner"></div>
          </div>
        </div>
      )}
      
      {task.status === 'failed' && (
        <div className="task-status-message failed">
          <p>Task processing failed. Please try creating a new task.</p>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;