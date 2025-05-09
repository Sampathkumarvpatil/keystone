import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState('light');
  const [chartColors, setChartColors] = useState('default');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [projectView, setProjectView] = useState('list');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [animations, setAnimations] = useState(true);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const projects = useLiveQuery(() => db.projects.count());
  const sprints = useLiveQuery(() => db.sprints.count());
  const tasks = useLiveQuery(() => db.tasks.count());
  const bugs = useLiveQuery(() => db.bugs.count());
  const timeEntries = useLiveQuery(() => db.timeEntries.count());
  const team = useLiveQuery(() => db.team.count());

  // Export data to JSON
  const handleExportData = async () => {
    try {
      const data = {
        projects: await db.projects.toArray(),
        sprints: await db.sprints.toArray(),
        tasks: await db.tasks.toArray(),
        bugs: await db.bugs.toArray(),
        timeEntries: await db.timeEntries.toArray(),
        team: await db.team.toArray()
      };
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `engineering_director_data_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setExportStatus('Data exported successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus(`Export failed: ${error.message}`);
    }
  };

  // Import data from JSON file
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Clear existing data
        await db.projects.clear();
        await db.sprints.clear();
        await db.tasks.clear();
        await db.bugs.clear();
        await db.timeEntries.clear();
        await db.team.clear();
        
        // Import new data
        if (data.projects && data.projects.length) await db.projects.bulkAdd(data.projects);
        if (data.sprints && data.sprints.length) await db.sprints.bulkAdd(data.sprints);
        if (data.tasks && data.tasks.length) await db.tasks.bulkAdd(data.tasks);
        if (data.bugs && data.bugs.length) await db.bugs.bulkAdd(data.bugs);
        if (data.timeEntries && data.timeEntries.length) await db.timeEntries.bulkAdd(data.timeEntries);
        if (data.team && data.team.length) await db.team.bulkAdd(data.team);
        
        setImportStatus('Data imported successfully! Refresh the page to see changes.');
        setTimeout(() => setImportStatus(null), 5000);
      } catch (error) {
        setImportStatus(`Import failed: ${error.message}`);
      }
    };
    
    reader.readAsText(file);
  };

  // Reset all data
  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      try {
        await db.projects.clear();
        await db.sprints.clear();
        await db.tasks.clear();
        await db.bugs.clear();
        await db.timeEntries.clear();
        await db.team.clear();
        
        alert('All data has been reset. Refresh the page to start fresh.');
      } catch (error) {
        alert(`Reset failed: ${error.message}`);
      }
    }
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, these would be saved to a database or localStorage
    alert('Settings saved successfully!');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'general' ? 'bg-gray-100 border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'appearance' ? 'bg-gray-100 border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'data' ? 'bg-gray-100 border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('data')}
          >
            Data Management
          </button>
          <button
            className={`py-3 px-6 font-medium ${
              activeTab === 'about' ? 'bg-gray-100 border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
        </div>
        
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">General Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full md:w-64 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Default Project View</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input 
                        type="radio" 
                        name="projectView" 
                        value="list" 
                        className="form-radio text-purple-600" 
                        checked={projectView === 'list'} 
                        onChange={() => setProjectView('list')}
                      />
                      <span className="ml-2">List</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input 
                        type="radio" 
                        name="projectView" 
                        value="card" 
                        className="form-radio text-purple-600" 
                        checked={projectView === 'card'} 
                        onChange={() => setProjectView('card')}
                      />
                      <span className="ml-2">Card</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input 
                        type="radio" 
                        name="projectView" 
                        value="kanban" 
                        className="form-radio text-purple-600" 
                        checked={projectView === 'kanban'} 
                        onChange={() => setProjectView('kanban')}
                      />
                      <span className="ml-2">Kanban</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input  
                    type="checkbox"  
                    id="autoRefresh"  
                    className="form-checkbox text-purple-600 h-5 w-5"  
                    checked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                  />
                  <label htmlFor="autoRefresh" className="ml-2 text-gray-700">
                    Auto-refresh dashboard (every 5 minutes)
                  </label>
                </div>
                
                <div>
                  <button 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    onClick={handleSaveSettings}
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Appearance Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2">Theme</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input  
                        type="radio"  
                        name="theme"  
                        value="light"  
                        className="form-radio text-purple-600" 
                        checked={theme === 'light'} 
                        onChange={() => setTheme('light')} 
                      />
                      <span className="ml-2">Light</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input  
                        type="radio"  
                        name="theme"  
                        value="dark"  
                        className="form-radio text-purple-600" 
                        checked={theme === 'dark'} 
                        onChange={() => setTheme('dark')} 
                      />
                      <span className="ml-2">Dark</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input  
                        type="radio"  
                        name="theme"  
                        value="system"  
                        className="form-radio text-purple-600" 
                        checked={theme === 'system'} 
                        onChange={() => setTheme('system')} 
                      />
                      <span className="ml-2">System Default</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Chart Color Scheme</label>
                  <select
                    value={chartColors}
                    onChange={(e) => setChartColors(e.target.value)}
                    className="w-full md:w-64 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="default">Default</option>
                    <option value="monochrome">Monochrome</option>
                    <option value="pastel">Pastel</option>
                    <option value="vivid">Vivid</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input  
                    type="checkbox"  
                    id="animations"  
                    className="form-checkbox text-purple-600 h-5 w-5"  
                    checked={animations}
                    onChange={() => setAnimations(!animations)}
                  />
                  <label htmlFor="animations" className="ml-2 text-gray-700">
                    Enable animations
                  </label>
                </div>
                
                <div>
                  <button 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                    onClick={handleSaveSettings}
                  >
                    Save Appearance
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Data Management */}
          {activeTab === 'data' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Data Management</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Database Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-600">Projects:</span> 
                    <span className="font-semibold ml-2">{projects || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Sprints:</span> 
                    <span className="font-semibold ml-2">{sprints || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tasks:</span> 
                    <span className="font-semibold ml-2">{tasks || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bugs:</span> 
                    <span className="font-semibold ml-2">{bugs || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Entries:</span> 
                    <span className="font-semibold ml-2">{timeEntries || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Team Members:</span> 
                    <span className="font-semibold ml-2">{team || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Export Data</h3>
                  <p className="text-gray-600 mb-2">
                    Export all your data as a JSON file that you can import later or use for reporting.
                  </p>
                  <button 
                    onClick={handleExportData}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Export Data
                  </button>
                  {exportStatus && (
                    <p className={`mt-2 ${exportStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {exportStatus}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Data</h3>
                  <p className="text-gray-600 mb-2">
                    Import data from a previously exported file. This will replace all current data.
                  </p>
                  <input
                    type="file"
                    id="importFile"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportData}
                  />
                  <label
                    htmlFor="importFile"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded cursor-pointer inline-block"
                  >
                    Import Data
                  </label>
                  {importStatus && (
                    <p className={`mt-2 ${importStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {importStatus}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Data</h3>
                  <p className="text-gray-600 mb-2">
                    This will permanently delete all your data. This action cannot be undone.
                  </p>
                  <button 
                    onClick={handleResetData}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Reset All Data
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* About */}
          {activeTab === 'about' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">About This Application</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Engineering Director's Project Tracking Tool</h3>
                  <p className="text-gray-600">Version 1.0.0 (March 2025)</p>
                </div>
                
                <p className="text-gray-600">
                  This application is designed for Engineering Directors to track projects, sprints, and team performance.
                  It provides comprehensive analytics and reporting to help make data-driven decisions.
                </p>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mt-4">Features</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                    <li>Project & Sprint Management</li>
                    <li>Task & Bug Tracking</li>
                    <li>Time & Resource Management</li>
                    <li>Team Performance Analytics</li>
                    <li>Comprehensive Dashboards</li>
                    <li>Data Export & Import</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mt-4">Technologies</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
                    <li>Frontend: React, TailwindCSS</li>
                    <li>Storage: IndexedDB (Dexie.js)</li>
                    <li>Visualizations: Chart.js</li>
                  </ul>
                </div>
                
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <p className="text-gray-500 text-sm">
                    © 2025 Engineering Director's Project Tracking Tool. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;