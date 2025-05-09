import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import "./App.css";
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Sprints from './pages/Sprints';
import Tasks from './pages/Tasks';
import Team from './pages/Team';
import TimeTracking from './pages/TimeTracking';
import Settings from './pages/Settings';
import { populateSampleData } from './db/db';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(null);

  useEffect(() => {
    // Initialize the database with sample data with a timeout
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setLoadingError('Loading is taking longer than expected. Please refresh the page.');
      }
    }, 10000); // 10 seconds timeout

    populateSampleData()
      .then(() => {
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoadingError(`Error loading data: ${error.message}. Please refresh the page.`);
        setIsLoading(false);
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  // Router component to preserve the navigation state across refreshes
  const RouterHandler = () => {
    const location = useLocation();
    
    // Save current location to session storage when it changes
    useEffect(() => {
      sessionStorage.setItem('lastRoute', location.pathname);
    }, [location]);
    
    // On component mount, check if there's a previously saved route
    const navigate = useNavigate();
    useEffect(() => {
      const savedRoute = sessionStorage.getItem('lastRoute');
      // If we're at root and have a saved route, navigate to it
      if (location.pathname === '/' && savedRoute && savedRoute !== '/') {
        navigate(savedRoute);
      }
    }, [navigate, location.pathname]);
    
    return <Outlet />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your engineering dashboard...</p>
          {loadingError && (
            <p className="mt-2 text-red-600">{loadingError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RouterHandler />}>
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
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
