import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { SPRINT_STATUS } from '../db/db';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Sprints = () => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    startDate: '',
    endDate: '',
    committedPoints: 0,
    status: SPRINT_STATUS.PLANNING
  });

  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => 
    selectedProjectId 
      ? db.sprints.where('projectId').equals(parseInt(selectedProjectId)).toArray() 
      : db.sprints.toArray()
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'committedPoints' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newSprint = {
      ...formData,
      projectId: parseInt(formData.projectId),
      acceptedPoints: 0,
      addedPoints: 0,
      descopedPoints: 0
    };
    
    await db.sprints.add(newSprint);
    setFormData({
      projectId: '',
      name: '',
      startDate: '',
      endDate: '',
      committedPoints: 0,
      status: SPRINT_STATUS.PLANNING
    });
    setIsFormOpen(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case SPRINT_STATUS.PLANNING:
        return 'bg-purple-100 text-purple-800';
      case SPRINT_STATUS.ACTIVE:
        return 'bg-blue-100 text-blue-800';
      case SPRINT_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Prepare data for burndown chart
  const sprintChartData = {
    labels: sprints ? sprints.map(s => s.name) : [],
    datasets: [
      {
        label: 'Committed Points',
        data: sprints ? sprints.map(s => s.committedPoints) : [],
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
      },
      {
        label: 'Accepted Points',
        data: sprints ? sprints.map(s => s.acceptedPoints) : [],
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
      },
      {
        label: 'Added Points',
        data: sprints ? sprints.map(s => s.addedPoints) : [],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      },
      {
        label: 'Descoped Points',
        data: sprints ? sprints.map(s => s.descopedPoints) : [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sprint Points Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
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
