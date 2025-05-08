import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import "./App.css";
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import { populateSampleData } from './db/db';

// Placeholder components for routes not yet implemented
const Sprints = () => <div className="p-4">Sprints Page (Coming Soon)</div>;
const Tasks = () => <div className="p-4">Tasks & Bugs Page (Coming Soon)</div>;
const Team = () => <div className="p-4">Team Management Page (Coming Soon)</div>;
const TimeTracking = () => <div className="p-4">Time Tracking Page (Coming Soon)</div>;
const Settings = () => <div className="p-4">Settings Page (Coming Soon)</div>;

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize the database with sample data
    populateSampleData().then(() => {
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your engineering dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="sprints" element={<Sprints />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="team" element={<Team />} />
          <Route path="time" element={<TimeTracking />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
