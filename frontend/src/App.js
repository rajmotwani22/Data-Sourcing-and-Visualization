import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TaskCreator from './components/TaskCreator';
import TaskList from './components/TaskList';
import TaskDetails from './components/TaskDetails';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Data Visualization Platform</h1>
          <nav>
            <ul className="nav-links">
              <li><Link to="/">Tasks</Link></li>
              <li><Link to="/create">Create Task</Link></li>
            </ul>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<TaskList />} />
            <Route path="/create" element={<TaskCreator />} />
            <Route path="/tasks/:taskId" element={<TaskDetails />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Data Visualization Platform © 2025</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;