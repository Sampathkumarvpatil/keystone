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

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await db.projects.toArray();
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    loadProjects();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle project edit
  const handleEditProject = (project) => {
    setNewProject({
      ...project,
      startDate: new Date(project.startDate).toISOString().split('T')[0],
      endDate: new Date(project.endDate).toISOString().split('T')[0]
    });
    setIsEditing(true);
    setShowProjectForm(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const projectData = {
        ...newProject,
        createdAt: new Date()
      };
      
      let id;
      if (isEditing) {
        // Update existing project
        id = newProject.id;
        await db.projects.update(id, projectData);
        
        // Update state
        setProjects(prev => 
          prev.map(project => project.id === id ? { ...projectData, id } : project)
        );
      } else {
        // Add new project
        id = await db.projects.add(projectData);
        
        // Update state
        setProjects(prev => [...prev, { ...projectData, id }]);
      }
      
      // Reset form and close it
      setNewProject({
        name: '',
        status: 'Not Started',
        priority: 'Medium',
        startDate: '',
        endDate: ''
      });
      setIsEditing(false);
      setShowProjectForm(false);
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
    }
  };

  // Calculate project progress
  const calculateProgress = (project) => {
    // For demo purposes, generate a random progress for completed projects
    // In a real app, this would be calculated based on tasks, story points, etc.
    if (project.status === PROJECT_STATUS.COMPLETED) {
      return 100;
    } else if (project.status === PROJECT_STATUS.NOT_STARTED) {
      return 0;
    } else {
      // Generate a random progress between 10% and 90% for in-progress projects
      return Math.floor(Math.random() * 81) + 10;
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case PROJECT_STATUS.COMPLETED:
        return 'bg-green-100 text-green-800';
      case PROJECT_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case PROJECT_STATUS.ON_HOLD:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case PROJECT_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      case PROJECT_PRIORITY.HIGH:
        return 'bg-orange-100 text-orange-800';
      case PROJECT_PRIORITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => {
            setNewProject({
              name: '',
              status: 'Not Started',
              priority: 'Medium',
              startDate: '',
              endDate: ''
            });
            setIsEditing(false);
            setShowProjectForm(true);
          }}
        >
          Create Project
        </button>
      </div>
      
      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {projects.map(project => {
          const progress = calculateProgress(project);
          
          return (
            <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">{project.name}</h2>
                  <div className="flex space-x-2">
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(project.status)}`}
                    >
                      {project.status}
                    </span>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs ${getPriorityBadgeClass(project.priority)}`}
                    >
                      {project.priority}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="text-sm font-medium">
                        {new Date(project.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="text-sm font-medium">
                        {new Date(project.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleEditProject(project)}
                  >
                    Edit
                  </button>
                  <button className="text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Project Form */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={newProject.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={newProject.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value={PROJECT_STATUS.NOT_STARTED}>Not Started</option>
                    <option value={PROJECT_STATUS.IN_PROGRESS}>In Progress</option>
                    <option value={PROJECT_STATUS.ON_HOLD}>On Hold</option>
                    <option value={PROJECT_STATUS.COMPLETED}>Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Priority</label>
                  <select
                    name="priority"
                    value={newProject.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value={PROJECT_PRIORITY.LOW}>Low</option>
                    <option value={PROJECT_PRIORITY.MEDIUM}>Medium</option>
                    <option value={PROJECT_PRIORITY.HIGH}>High</option>
                    <option value={PROJECT_PRIORITY.CRITICAL}>Critical</option>
                  </select>
                </div>
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newProject.startDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newProject.endDate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md"
                  onClick={() => setShowProjectForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  {isEditing ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
