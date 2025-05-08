import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const TimeTracking = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [formData, setFormData] = useState({
    taskId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: ''
  });

  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => 
    selectedProjectId 
      ? db.sprints.where('projectId').equals(parseInt(selectedProjectId)).toArray() 
      : db.sprints.toArray()
  );
  const tasks = useLiveQuery(() => 
    selectedSprintId 
      ? db.tasks.where('sprintId').equals(parseInt(selectedSprintId)).toArray() 
      : db.tasks.toArray()
  );
  const team = useLiveQuery(() => db.team.toArray());
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'hours' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get project and sprint ids for the selected task
    const selectedTask = tasks ? tasks.find(t => t.id === parseInt(formData.taskId)) : null;
    
    if (!selectedTask) {
      alert('Please select a valid task');
      return;
    }
    
    const newTimeEntry = {
      ...formData,
      taskId: parseInt(formData.taskId),
      sprintId: selectedTask.sprintId,
      projectId: selectedTask.projectId,
      createdAt: new Date()
    };
    
    await db.timeEntries.add(newTimeEntry);
    setFormData({
      taskId: '',
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      description: ''
    });
    setIsFormOpen(false);
  };

  // Get projects for the filter dropdown
  const getProjects = () => {
    if (!projects) return [];
    return projects;
  };

  // Get sprints for the filter dropdown
  const getSprints = () => {
    if (!sprints) return [];
    if (!selectedProjectId) return sprints;
    return sprints.filter(s => s.projectId === parseInt(selectedProjectId));
  };

  // Get tasks for the form dropdown
  const getTasksForForm = () => {
    if (!tasks) return [];
    if (!selectedSprintId) return tasks;
    
    // If team member is selected, filter tasks by assignee
    if (selectedTeamMember) {
      return tasks.filter(t => 
        t.sprintId === parseInt(selectedSprintId) && 
        t.assignee === selectedTeamMember
      );
    }
    
    return tasks.filter(t => t.sprintId === parseInt(selectedSprintId));
  };

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

  // Get task name by id
  const getTaskName = (taskId) => {
    if (!tasks) return 'Unknown Task';
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  // Filter time entries based on selections
  const getFilteredTimeEntries = () => {
    if (!timeEntries) return [];
    
    let filtered = timeEntries;
    
    // Filter by project
    if (selectedProjectId) {
      filtered = filtered.filter(entry => entry.projectId === parseInt(selectedProjectId));
    }
    
    // Filter by sprint
    if (selectedSprintId) {
      filtered = filtered.filter(entry => entry.sprintId === parseInt(selectedSprintId));
    }
    
    // Filter by team member
    if (selectedTeamMember) {
      // We need to join with tasks to filter by assignee
      filtered = filtered.filter(entry => {
        const task = tasks ? tasks.find(t => t.id === entry.taskId) : null;
        return task && task.assignee === selectedTeamMember;
      });
    }
    
    // Sort by date (most recent first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Time tracking data for chart
  const prepareTimeChartData = () => {
    const filteredEntries = getFilteredTimeEntries();
    
    // Get unique dates in the entries (last 7 days or less if we have fewer data points)
    const dates = [...new Set(filteredEntries.map(entry => entry.date))];
    dates.sort((a, b) => new Date(a) - new Date(b)); // Sort dates in ascending order
    
    // Keep only the last 7 days (or all if less than 7)
    const recentDates = dates.slice(-7);
    
    // Calculate hours for each date
    const hoursPerDay = recentDates.map(date => {
      const entriesOnDate = filteredEntries.filter(entry => entry.date === date);
      return entriesOnDate.reduce((sum, entry) => sum + entry.hours, 0);
    });
    
    // Format dates for display
    const formattedDates = recentDates.map(date => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    return {
      labels: formattedDates,
      datasets: [
        {
          label: 'Hours Worked',
          data: hoursPerDay,
          backgroundColor: 'rgba(139, 92, 246, 0.7)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Time Tracking (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours',
        },
      },
    },
  };

  // Total hours in selected filters
  const totalHours = getFilteredTimeEntries().reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Log Time
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Team Member</label>
            <select
              value={selectedTeamMember}
              onChange={(e) => setSelectedTeamMember(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Team Members</option>
              {team && team.map(member => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedSprintId(''); // Reset sprint when project changes
              }}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Projects</option>
              {getProjects().map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Sprint</label>
            <select
              value={selectedSprintId}
              onChange={(e) => setSelectedSprintId(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!selectedProjectId}
            >
              <option value="">All Sprints</option>
              {getSprints().map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Time Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Log Time Entry</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setSelectedSprintId('');
                    setFormData({ ...formData, taskId: '' });
                  }}
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
                <label className="block text-gray-700 mb-1">Sprint</label>
                <select
                  value={selectedSprintId}
                  onChange={(e) => {
                    setSelectedSprintId(e.target.value);
                    setFormData({ ...formData, taskId: '' });
                  }}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedProjectId}
                >
                  <option value="">Select Sprint</option>
                  {getSprints().map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Task</label>
                <select
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedSprintId}
                >
                  <option value="">Select Task</option>
                  {getTasksForForm().map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title} - {task.assignee}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  name="hours"
                  value={formData.hours}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0.5"
                  max="24"
                  step="0.5"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                ></textarea>
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
                Log Time
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Tracking Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Time Tracking History</h2>
          <div className="h-80">
            <Bar data={prepareTimeChartData()} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-lg font-semibold text-purple-800">Total Hours</div>
              <div className="text-3xl font-bold text-purple-600">{totalHours.toFixed(1)}</div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">Time Entries</div>
              <div className="text-3xl font-bold text-blue-600">{getFilteredTimeEntries().length}</div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-800">Average Hours/Day</div>
              <div className="text-3xl font-bold text-green-600">
                {getFilteredTimeEntries().length > 0 
                  ? (totalHours / [...new Set(getFilteredTimeEntries().map(e => e.date))].length).toFixed(1) 
                  : '0.0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Time Entries</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project / Sprint
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredTimeEntries().map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <div>
                      {getProjectName(entry.projectId)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {getSprintName(entry.sprintId)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {getTaskName(entry.taskId)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {entry.hours} hrs
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {entry.description}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                    <button className="text-gray-600 hover:text-gray-900">Delete</button>
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

export default TimeTracking;
