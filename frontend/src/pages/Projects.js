import React, { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import db from '../db/db';
import { PROJECT_STATUS, PROJECT_PRIORITY } from '../db/db';

Chart.register(...registerables);

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    status: 'Not Started',
    priority: 'Medium',
    startDate: '',
    endDate: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const tasks = useLiveQuery(() => db.sprints.toArray());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newProject = {
      ...formData,
      createdAt: new Date(),
    };
    
    await db.projects.add(newProject);
    setFormData({
      name: '',
      status: PROJECT_STATUS.NOT_STARTED,
      priority: PROJECT_PRIORITY.MEDIUM,
      startDate: '',
      endDate: '',
    });
    setIsFormOpen(false);
  };

  // Function to calculate project metrics
  const calculateProjectMetrics = (projectId) => {
    if (!sprints || !tasks) return { sprintCount: 0, taskCount: 0, completionRate: 0 };
    
    const projectSprints = sprints.filter(s => s.projectId === projectId);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    const sprintCount = projectSprints.length;
    const taskCount = projectTasks.length;
    
    const completedSprints = projectSprints.filter(s => s.status === 'Completed');
    const completionRate = completedSprints.length > 0
      ? completedSprints.reduce((acc, sprint) => acc + (sprint.acceptedPoints / sprint.committedPoints), 0) / completedSprints.length
      : 0;
    
    return {
      sprintCount,
      taskCount,
      completionRate: Math.round(completionRate * 100),
    };
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case PROJECT_STATUS.NOT_STARTED:
        return 'bg-purple-100 text-purple-800';
      case PROJECT_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case PROJECT_STATUS.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      case PROJECT_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case PROJECT_PRIORITY.LOW:
        return 'bg-gray-100 text-gray-800';
      case PROJECT_PRIORITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case PROJECT_PRIORITY.HIGH:
        return 'bg-yellow-100 text-yellow-800';
      case PROJECT_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Create New Project
        </button>
      </div>

      {/* New Project Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Project Name</label>
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
                  {Object.values(PROJECT_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.values(PROJECT_PRIORITY).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
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
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.map(project => {
          const metrics = calculateProjectMetrics(project.id);
          
          return (
            <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{project.name}</h2>
                
                <div className="flex items-center mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs mr-2 ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex justify-between mb-1">
                    <span>Start Date:</span>
                    <span className="font-medium">
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>End Date:</span>
                    <span className="font-medium">
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center my-4">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xl font-bold text-blue-700">{metrics.sprintCount}</div>
                    <div className="text-xs text-blue-600">Sprints</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-xl font-bold text-purple-700">{metrics.taskCount}</div>
                    <div className="text-xs text-purple-600">Tasks</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xl font-bold text-green-700">{metrics.completionRate}%</div>
                    <div className="text-xs text-green-600">Completion</div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <button className="px-3 py-1 bg-gray-100 rounded text-gray-800 hover:bg-gray-200">
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-blue-600 rounded text-white hover:bg-blue-700">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
