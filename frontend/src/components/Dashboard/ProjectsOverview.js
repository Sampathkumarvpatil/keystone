import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { PROJECT_STATUS, PROJECT_PRIORITY } from '../../db/db';

const ProjectsOverview = () => {
  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Function to calculate project health
  const calculateProjectHealth = (project) => {
    if (!sprints) return { status: 'Unknown', color: 'gray' };
    
    const projectSprints = sprints.filter(s => s.projectId === project.id);
    
    if (projectSprints.length === 0) return { status: 'Not Started', color: 'gray' };
    
    // Calculate average completion rate for sprints
    const completedSprints = projectSprints.filter(s => s.status === 'Completed');
    if (completedSprints.length === 0) return { status: 'New', color: 'blue' };
    
    const completionRates = completedSprints.map(s => s.acceptedPoints / s.committedPoints);
    const averageCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;
    
    if (averageCompletionRate >= 0.9) return { status: 'Healthy', color: 'green' };
    if (averageCompletionRate >= 0.75) return { status: 'At Risk', color: 'yellow' };
    return { status: 'Critical', color: 'red' };
  };

  // Get project status color
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

  // Get health indicator color
  const getHealthColor = (health) => {
    switch (health) {
      case 'Healthy':
        return 'bg-green-500';
      case 'At Risk':
        return 'bg-yellow-500';
      case 'Critical':
        return 'bg-red-500';
      case 'New':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Projects Overview</h2>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
          New Project
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timeline
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Health
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects && projects.map(project => {
              const health = calculateProjectHealth(project);
              return (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">
                    {project.name}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getHealthColor(health.status)}`}></div>
                      {health.status}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-gray-600 hover:text-gray-900">View</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsOverview;
