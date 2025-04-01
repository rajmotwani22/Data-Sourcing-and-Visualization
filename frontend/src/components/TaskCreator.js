import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/TaskCreator.css';

const API_BASE_URL = 'http://localhost:8000/api';

const TaskCreator = () => {
  const navigate = useNavigate();
  
  // State for form data
  const [formData, setFormData] = useState({
    sourceA: {
      start_date: '',
      end_date: '',
      companies: [],
      models: []
    },
    sourceB: {
      start_date: '',
      end_date: '',
      companies: [],
      models: []
    }
  });
  
  // State for available options
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  // State for loading indicator
  const [loading, setLoading] = useState(false);
  
  // Fetch available companies and models
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [companiesRes, modelsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/companies`),
          axios.get(`${API_BASE_URL}/models`)
        ]);
        
        setAvailableCompanies(companiesRes.data);
        setAvailableModels(modelsRes.data);
      } catch (error) {
        console.error('Error fetching options:', error);
        // Use sample data if API is not available yet
        setAvailableCompanies(['Toyota', 'Honda', 'Ford', 'Chevrolet']);
        setAvailableModels(['Camry', 'Corolla', 'Accord', 'Civic', 'Mustang', 'Explorer', 'Malibu', 'Equinox']);
      }
    };
    
    fetchOptions();
  }, []);
  
  // Handle input changes
  const handleInputChange = (source, field, value) => {
    setFormData(prev => ({
      ...prev,
      [source]: {
        ...prev[source],
        [field]: value
      }
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (source, field, item) => {
    setFormData(prev => {
      const currentItems = prev[source][field];
      const newItems = currentItems.includes(item)
        ? currentItems.filter(i => i !== item)
        : [...currentItems, item];
        
      return {
        ...prev,
        [source]: {
          ...prev[source],
          [field]: newItems
        }
      };
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, {
        source_a: {
          start_date: formData.sourceA.start_date,
          end_date: formData.sourceA.end_date,
          companies: formData.sourceA.companies.length > 0 ? formData.sourceA.companies : undefined,
          models: formData.sourceA.models.length > 0 ? formData.sourceA.models : undefined
        },
        source_b: {
          start_date: formData.sourceB.start_date,
          end_date: formData.sourceB.end_date,
          companies: formData.sourceB.companies.length > 0 ? formData.sourceB.companies : undefined,
          models: formData.sourceB.models.length > 0 ? formData.sourceB.models : undefined
        }
      });
      
      // Redirect to task details page
      navigate(`/tasks/${response.data.id}`);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="task-creator">
      <h2>Create New Data Task</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="sources-container">
          {/* Source A Configuration */}
          <div className="source-config">
            <h3>Source A (JSON Data)</h3>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={formData.sourceA.start_date}
                  onChange={(e) => handleInputChange('sourceA', 'start_date', e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={formData.sourceA.end_date}
                  onChange={(e) => handleInputChange('sourceA', 'end_date', e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Companies:</label>
              <div className="checkbox-group">
                {availableCompanies.map(company => (
                  <label key={`source-a-company-${company}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sourceA.companies.includes(company)}
                      onChange={() => handleCheckboxChange('sourceA', 'companies', company)}
                    />
                    {company}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Car Models:</label>
              <div className="checkbox-group">
                {availableModels.map(model => (
                  <label key={`source-a-model-${model}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sourceA.models.includes(model)}
                      onChange={() => handleCheckboxChange('sourceA', 'models', model)}
                    />
                    {model}
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          {/* Source B Configuration */}
          <div className="source-config">
            <h3>Source B (CSV Data)</h3>
            
            <div className="form-group">
              <label>Date Range:</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={formData.sourceB.start_date}
                  onChange={(e) => handleInputChange('sourceB', 'start_date', e.target.value)}
                  placeholder="Start Date"
                />
                <span>to</span>
                <input
                  type="date"
                  value={formData.sourceB.end_date}
                  onChange={(e) => handleInputChange('sourceB', 'end_date', e.target.value)}
                  placeholder="End Date"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Companies:</label>
              <div className="checkbox-group">
                {availableCompanies.map(company => (
                  <label key={`source-b-company-${company}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sourceB.companies.includes(company)}
                      onChange={() => handleCheckboxChange('sourceB', 'companies', company)}
                    />
                    {company}
                  </label>
                ))}
              </div>
            </div>
            
            <div className="form-group">
              <label>Car Models:</label>
              <div className="checkbox-group">
                {availableModels.map(model => (
                  <label key={`source-b-model-${model}`} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.sourceB.models.includes(model)}
                      onChange={() => handleCheckboxChange('sourceB', 'models', model)}
                    />
                    {model}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Creating Task...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreator;