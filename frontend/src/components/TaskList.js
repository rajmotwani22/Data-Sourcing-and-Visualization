import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/TaskList.css';

const API_BASE_URL = 'http://localhost:8000/api';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/tasks`);
        setTasks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to fetch tasks. Please try again later.');
        setLoading(false);
      }
    };

    fetchTasks();
    
    // Poll for task updates every 5 seconds
    const intervalId = setInterval(fetchTasks, 5000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Function to format dates
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

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="task-list">
      <h2>Data Tasks</h2>
      
      {tasks.length === 0 ? (
        <div className="empty-list">
          <p>No tasks found.</p>
          <Link to="/create" className="create-task-btn">Create a New Task</Link>
        </div>
      ) : (
        <>
          <div className="task-count">
            <p>Total Tasks: {tasks.length}</p>
            <Link to="/create" className="create-task-btn">Create a New Task</Link>
          </div>
          
          <div className="task-cards">
            {tasks.map(task => (
              <Link to={`/tasks/${task.id}`} key={task.id} className="task-card">
                <div className="task-card-header">
                  <h3>Task #{task.id}</h3>
                  <span className={getStatusBadgeClass(task.status)}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="task-card-content">
                  <p>Created: {formatDate(task.created_at)}</p>
                  <p>Updated: {formatDate(task.updated_at)}</p>
                  
                  <div className="task-sources">
                    <div className="source">
                      <strong>Source A:</strong>
                      <ul>
                        {task.parameters.source_a.companies && task.parameters.source_a.companies.length > 0 && (
                          <li>Companies: {task.parameters.source_a.companies.join(', ')}</li>
                        )}
                        {task.parameters.source_a.start_date && (
                          <li>From: {task.parameters.source_a.start_date}</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="source">
                      <strong>Source B:</strong>
                      <ul>
                        {task.parameters.source_b.companies && task.parameters.source_b.companies.length > 0 && (
                          <li>Companies: {task.parameters.source_b.companies.join(', ')}</li>
                        )}
                        {task.parameters.source_b.start_date && (
                          <li>From: {task.parameters.source_b.start_date}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="task-card-footer">
                  <span className="view-details">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TaskList;