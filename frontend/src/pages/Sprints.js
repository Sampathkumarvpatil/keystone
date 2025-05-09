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
      const projectIdNum = parseInt(selectedProjectId);
      const filtered = allSprints.filter(sprint => sprint.projectId === projectIdNum);
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

      // Define chart container dimensions 
      const container = chartRef.current.parentNode;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set the chart canvas to match container size properly
      chartRef.current.width = containerWidth;
      chartRef.current.height = containerHeight;

      // Create chart data
      const labels = filteredSprints.map(sprint => sprint.name);
      const committedPointsData = filteredSprints.map(sprint => sprint.committedPoints);
      const acceptedPointsData = filteredSprints.map(sprint => sprint.acceptedPoints);
      const addedPointsData = filteredSprints.map(sprint => sprint.addedPoints);
      const descopedPointsData = filteredSprints.map(sprint => sprint.descopedPoints);
      
      // Initialize the chart
      const ctx = chartRef.current.getContext('2d');
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
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">All Projects</option>
            {projects && projects.map(project => (
              <option key={project.id} value={project.id.toString()}>
                {project.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => {
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
              setIsFormOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Create New Sprint
          </button>
        </div>
      </div>

      {/* Sprint Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isEditing ? 'Edit Sprint' : 'Create New Sprint'}
          </h2>
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
                    <option key={project.id} value={project.id.toString()}>
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
                <label className="block text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.values(SPRINT_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
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
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Accepted Points</label>
                <input
                  type="number"
                  name="acceptedPoints"
                  value={formData.acceptedPoints}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Added Points</label>
                <input
                  type="number"
                  name="addedPoints"
                  value={formData.addedPoints}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Descoped Points</label>
                <input
                  type="number"
                  name="descopedPoints"
                  value={formData.descopedPoints}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                />
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
                {isEditing ? 'Update Sprint' : 'Create Sprint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sprint Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sprint Performance</h2>
        <div style={{ height: "300px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Sprints Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">All Sprints</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">NAME</th>
                <th className="py-3 px-4 text-left">PROJECT</th>
                <th className="py-3 px-4 text-left">STATUS</th>
                <th className="py-3 px-4 text-left">TIMELINE</th>
                <th className="py-3 px-4 text-left">STORY POINTS</th>
                <th className="py-3 px-4 text-left">COMPLETION</th>
                <th className="py-3 px-4 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSprints && filteredSprints.length > 0 ? (
                filteredSprints.map(sprint => {
                  // Calculate completion percentage
                  const completion = calculateCompletion(sprint);
                  
                  return (
                    <tr key={sprint.id} className="border-t border-gray-200">
                      <td className="py-3 px-4">{sprint.name}</td>
                      <td className="py-3 px-4">{getProjectName(sprint.projectId)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          sprint.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          sprint.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sprint.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div>Committed: {sprint.committedPoints}</div>
                        <div>Accepted: {sprint.acceptedPoints}</div>
                        <div>Added: {sprint.addedPoints}</div>
                        <div>Descoped: {sprint.descopedPoints}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${completion}%` }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1">{completion}%</div>
                      </td>
                      <td className="py-3 px-4">
                        <button 
                          onClick={() => handleEditSprint(sprint)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          Edit
                        </button>
                        <button className="text-blue-600 hover:text-blue-800">
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-3 px-4 text-center text-gray-500">
                    No sprints found{selectedProjectId !== 'all' ? ' for the selected project' : ''}. Create your first sprint to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sprints;