import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { TASK_STATUS, PROJECT_PRIORITY, BUG_SEVERITY } from '../../db/db';

const TasksOverview = () => {
  const [filter, setFilter] = useState('all');
  
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const bugs = useLiveQuery(() => db.bugs.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());
  
  // Combine tasks and bugs for display
  const allItems = [];
  
  if (tasks) {
    allItems.push(...tasks.map(task => ({ ...task, type: 'task' })));
  }
  
  if (bugs) {
    allItems.push(...bugs.map(bug => ({ ...bug, type: 'bug' })));
  }
  
  // Filter items based on the selected filter
  const filteredItems = allItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'tasks') return item.type === 'task';
    if (filter === 'bugs') return item.type === 'bug';
    if (filter === 'in-progress') return item.status === TASK_STATUS.IN_PROGRESS;
    if (filter === 'testing') return item.status === TASK_STATUS.TESTING;
    return true;
  });
  
  // Sort items by priority (highest first)
  const sortedItems = [...filteredItems].sort((a, b) => {
    const priorityOrder = {
      [PROJECT_PRIORITY.CRITICAL]: 0,
      [PROJECT_PRIORITY.HIGH]: 1,
      [PROJECT_PRIORITY.MEDIUM]: 2,
      [PROJECT_PRIORITY.LOW]: 3
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Get project name by id
  const getProjectName = (projectId) => {
    if (!projects) return 'Unknown Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };
  
  // Get sprint name by id
  const getSprintName = (sprintId) => {
    if (!sprints) return 'Unknown Sprint';
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : 'Unknown Sprint';
  };
  
  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case TASK_STATUS.NEW:
        return 'bg-gray-100 text-gray-800';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TASK_STATUS.TESTING:
        return 'bg-yellow-100 text-yellow-800';
      case TASK_STATUS.DONE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority class
  const getPriorityClass = (priority) => {
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
  
  // Get severity class
  const getSeverityClass = (severity) => {
    switch (severity) {
      case BUG_SEVERITY.LOW:
        return 'bg-gray-100 text-gray-800';
      case BUG_SEVERITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case BUG_SEVERITY.HIGH:
        return 'bg-yellow-100 text-yellow-800';
      case BUG_SEVERITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks & Bugs</h2>
        <div className="flex space-x-2">
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
            New Task
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
            New Bug
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('all')}
        >
          All Items
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'tasks' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('tasks')}
        >
          Tasks Only
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'bugs' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('bugs')}
        >
          Bugs Only
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'in-progress' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress
        </button>
        <button
          className={`px-4 py-2 rounded ${filter === 'testing' ? 'bg-gray-200' : 'bg-gray-100'}`}
          onClick={() => setFilter('testing')}
        >
          Testing
        </button>
      </div>
      
      {/* Tasks and Bugs Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project / Sprint
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assignee
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effort (Est/Act)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedItems.map(item => (
              <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                <td className="py-4 px-4 text-sm font-medium text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs ${item.type === 'bug' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.type === 'bug' ? 'Bug' : 'Task'}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm font-medium text-gray-900">
                  {item.title}
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  <div>
                    {getProjectName(item.projectId)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getSprintName(item.sprintId)}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(item.priority)}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs ${getSeverityClass(item.severity)}`}>
                    {item.severity}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {item.assignee}
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {item.estimatedHours} / {item.actualHours} hrs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TasksOverview;
