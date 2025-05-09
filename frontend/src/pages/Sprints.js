import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import db, { SPRINT_STATUS } from '../db/db';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const Sprints = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    startDate: '',
    endDate: '',
    committedPoints: 0,
    acceptedPoints: 0,
    addedPoints: 0,
    descopedPoints: 0,
    status: SPRINT_STATUS.PLANNING
  });
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);
  const [filteredSprints, setFilteredSprints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Chart ref for sprint performance chart
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const projectsData = await db.projects.toArray();
        setProjects(projectsData);
        
        const sprintsData = await db.sprints.toArray();
        setAllSprints(sprintsData);
        setFilteredSprints(sprintsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Filter sprints when project selection changes
  useEffect(() => {
    if (selectedProjectId === 'all') {
      setFilteredSprints(allSprints);
    } else {
      const filtered = allSprints.filter(sprint => 
        sprint.projectId === parseInt(selectedProjectId)
      );
      setFilteredSprints(filtered);
    }
  }, [selectedProjectId, allSprints]);

  // Initialize chart when data changes
  useEffect(() => {
    if (chartRef.current && filteredSprints.length > 0) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      // Wait for the DOM to update
      setTimeout(() => {
        const ctx = chartRef.current.getContext('2d');
        
        // Create chart data
        const labels = filteredSprints.map(sprint => sprint.name);
        const committedPointsData = filteredSprints.map(sprint => sprint.committedPoints);
        const acceptedPointsData = filteredSprints.map(sprint => sprint.acceptedPoints);
        const addedPointsData = filteredSprints.map(sprint => sprint.addedPoints);
        const descopedPointsData = filteredSprints.map(sprint => sprint.descopedPoints);
        
        // Initialize the chart
        chartInstance.current = new ChartJS(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Committed Points',
                data: committedPointsData,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'Accepted Points',
                data: acceptedPointsData,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              },
              {
                label: 'Added Points',
                data: addedPointsData,
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
              },
              {
                label: 'Descoped Points',
                data: descopedPointsData,
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Sprint Performance'
              }
            }
          }
        });
      }, 100);
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredSprints]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'committedPoints' || name === 'acceptedPoints' || 
              name === 'addedPoints' || name === 'descopedPoints' 
              ? parseInt(value) 
              : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const sprintData = {
        ...formData,
        projectId: parseInt(formData.projectId),
        status: formData.status
      };

      let id;
      if (isEditing) {
        // Update existing sprint
        id = formData.id;
        await db.sprints.update(id, {
          ...sprintData,
          updatedAt: new Date()
        });
        
        // Update state
        setAllSprints(prev => 
          prev.map(sprint => sprint.id === id ? { ...sprintData, id, updatedAt: new Date() } : sprint)
        );
      } else {
        // Add new sprint
        id = await db.sprints.add({
          ...sprintData,
          createdAt: new Date()
        });
        
        // Update state
        setAllSprints(prev => [...prev, { ...sprintData, id, createdAt: new Date() }]);
      }
      
      // Reset form and close it
      setFormData({
        projectId: '',
        name: '',
        startDate: '',
        endDate: '',
        committedPoints: 0,
        acceptedPoints: 0,
        addedPoints: 0,
        descopedPoints: 0,
        status: SPRINT_STATUS.PLANNING
      });
      setIsEditing(false);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving sprint:', error);
      alert('Failed to save sprint. Please try again.');
    }
  };

  // Calculate sprint completion percentage
  const calculateCompletion = (sprint) => {
    if (sprint.committedPoints === 0) return 0;
    return Math.round((sprint.acceptedPoints / sprint.committedPoints) * 100);
  };

  // Get project name by id
  const getProjectName = (projectId) => {
    if (!projects) return 'Unknown Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Handle edit sprint
  const handleEditSprint = (sprint) => {
    setFormData({
      id: sprint.id,
      projectId: sprint.projectId.toString(),
      name: sprint.name,
      startDate: new Date(sprint.startDate).toISOString().split('T')[0],
      endDate: new Date(sprint.endDate).toISOString().split('T')[0],
      committedPoints: sprint.committedPoints,
      acceptedPoints: sprint.acceptedPoints,
      addedPoints: sprint.addedPoints,
      descopedPoints: sprint.descopedPoints,
      status: sprint.status
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sprints</h1>
        <div className="flex items-center space-x-4">
          <select 
            className="form-select rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects && projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Create New Sprint
          </button>
        </div>
      </div>

      {/* New Sprint Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Sprint</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Project</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Project</option>
                  {projects && projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Sprint Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Committed Points</label>
                <input
                  type="number"
                  name="committedPoints"
                  value={formData.committedPoints}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(SPRINT_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Create Sprint
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprint Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sprint Performance</h2>
        <div className="h-80">
          <Bar data={sprintChartData} options={chartOptions} />
        </div>
      </div>

      {/* Sprints Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">All Sprints</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timeline
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Story Points
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sprints && sprints.map(sprint => (
                <tr key={sprint.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">
                    {sprint.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {getProjectName(sprint.projectId)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(sprint.status)}`}>
                      {sprint.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <div className="flex flex-col">
                      <span>Committed: {sprint.committedPoints}</span>
                      <span>Accepted: {sprint.acceptedPoints}</span>
                      <span>Added: {sprint.addedPoints}</span>
                      <span>Descoped: {sprint.descopedPoints}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${calculateCompletion(sprint)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs mt-1 block">{calculateCompletion(sprint)}%</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-gray-600 hover:text-gray-900">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sprints;
