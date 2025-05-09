import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [timeEntryToDelete, setTimeEntryToDelete] = useState(null);
  
  // Refs for PDF export
  const timeTableRef = useRef(null);
  const chartContainerRef = useRef(null);
  const summaryRef = useRef(null);

  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => 
    selectedProjectId 
      ? db.sprints.where('projectId').equals(parseInt(selectedProjectId)).toArray() 
      : db.sprints.toArray()
  );
  const allTasks = useLiveQuery(() => db.tasks.toArray());
  const allBugs = useLiveQuery(() => db.bugs.toArray());
  const team = useLiveQuery(() => db.team.toArray());
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray());
  
  // Combined tasks and bugs for time entry selection
  const getTasksAndBugs = () => {
    const tasksList = allTasks || [];
    const bugsList = allBugs || [];
    
    // Transform bugs to look like tasks for the selection
    const bugsAsItems = bugsList.map(bug => ({
      id: `bug-${bug.id}`, // Prefix with 'bug-' to distinguish from tasks
      projectId: bug.projectId,
      sprintId: bug.sprintId,
      title: `[BUG] ${bug.title}`,
      assignee: bug.assignee,
      isBug: true,
      originalId: bug.id
    }));
    
    // Convert tasks to standard format with identifiers
    const tasksAsItems = tasksList.map(task => ({
      id: `task-${task.id}`, // Prefix with 'task-' to distinguish from bugs
      projectId: task.projectId,
      sprintId: task.sprintId,
      title: task.title,
      assignee: task.assignee,
      isBug: false,
      originalId: task.id
    }));
    
    return [...tasksAsItems, ...bugsAsItems];
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'hours' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse the selected item ID
    const [itemType, itemId] = formData.taskId.split('-');
    const originalId = parseInt(itemId);
    
    // Get the appropriate item (task or bug)
    let selectedItem;
    if (itemType === 'task') {
      selectedItem = allTasks ? allTasks.find(t => t.id === originalId) : null;
    } else if (itemType === 'bug') {
      selectedItem = allBugs ? allBugs.find(b => b.id === originalId) : null;
    }
    
    if (!selectedItem) {
      alert('Please select a valid task or bug');
      return;
    }
    
    const newTimeEntry = {
      ...formData,
      taskId: originalId,
      isTaskEntry: itemType === 'task',
      isBugEntry: itemType === 'bug',
      sprintId: selectedItem.sprintId,
      projectId: selectedItem.projectId,
      createdAt: new Date()
    };
    
    // If it's a completed task/bug, update the actual hours
    if (selectedItem.status === 'Done') {
      if (itemType === 'task') {
        const oldHours = selectedItem.actualHours || 0;
        await db.tasks.update(originalId, { 
          actualHours: oldHours + parseFloat(formData.hours) 
        });
      } else if (itemType === 'bug') {
        const oldHours = selectedItem.actualHours || 0;
        await db.bugs.update(originalId, { 
          actualHours: oldHours + parseFloat(formData.hours) 
        });
      }
    }
    
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

  // Get tasks and bugs for the form dropdown
  const getItemsForForm = () => {
    const items = getTasksAndBugs();
    if (!items.length) return [];
    
    let filtered = items;
    
    // Filter by sprint if selected
    if (selectedSprintId) {
      filtered = filtered.filter(item => item.sprintId === parseInt(selectedSprintId));
    } else if (selectedProjectId) {
      // If only project is selected, filter by project
      filtered = filtered.filter(item => item.projectId === parseInt(selectedProjectId));
    }
    
    // Filter by team member if selected
    if (selectedTeamMember) {
      filtered = filtered.filter(item => item.assignee === selectedTeamMember);
    }
    
    return filtered;
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

  // Get task/bug name by id and type
  const getItemName = (taskId, isTaskEntry = true) => {
    if (isTaskEntry) {
      if (!allTasks) return 'Unknown Task';
      const task = allTasks.find(t => t.id === taskId);
      return task ? task.title : 'Unknown Task';
    } else {
      if (!allBugs) return 'Unknown Bug';
      const bug = allBugs.find(b => b.id === taskId);
      return bug ? `[BUG] ${bug.title}` : 'Unknown Bug';
    }
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
      // We need to join with tasks and bugs to filter by assignee
      filtered = filtered.filter(entry => {
        if (entry.isTaskEntry) {
          const task = allTasks ? allTasks.find(t => t.id === entry.taskId) : null;
          return task && task.assignee === selectedTeamMember;
        } else {
          const bug = allBugs ? allBugs.find(b => b.id === entry.taskId) : null;
          return bug && bug.assignee === selectedTeamMember;
        }
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
  
  // Handle delete time entry confirmation
  const handleDeleteConfirm = (entry) => {
    setTimeEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };
  
  // Handle actual deletion of time entry
  const handleDeleteTimeEntry = async () => {
    if (!timeEntryToDelete) return;
    
    try {
      // If the entry was for a completed task/bug, update the actual hours
      if (timeEntryToDelete.isTaskEntry) {
        const task = allTasks ? allTasks.find(t => t.id === timeEntryToDelete.taskId) : null;
        if (task && task.status === 'Done') {
          const oldHours = task.actualHours || 0;
          const newHours = Math.max(0, oldHours - timeEntryToDelete.hours);
          await db.tasks.update(task.id, { actualHours: newHours });
        }
      } else if (timeEntryToDelete.isBugEntry) {
        const bug = allBugs ? allBugs.find(b => b.id === timeEntryToDelete.taskId) : null;
        if (bug && bug.status === 'Done') {
          const oldHours = bug.actualHours || 0;
          const newHours = Math.max(0, oldHours - timeEntryToDelete.hours);
          await db.bugs.update(bug.id, { actualHours: newHours });
        }
      }
      
      // Delete the time entry
      await db.timeEntries.delete(timeEntryToDelete.id);
      
      // Close modal
      setIsDeleteModalOpen(false);
      setTimeEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting time entry:', error);
      alert('Failed to delete time entry. Please try again.');
    }
  };
  
  // Export time tracking data to PDF
  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      
      // Set title
      pdf.setFontSize(18);
      pdf.text('Time Tracking Report', 40, 40);
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);
      
      // Add filters applied
      pdf.text(`Project Filter: ${selectedProjectId ? getProjectName(parseInt(selectedProjectId)) : 'All Projects'}`, 40, 80);
      pdf.text(`Sprint Filter: ${selectedSprintId ? getSprintName(parseInt(selectedSprintId)) : 'All Sprints'}`, 40, 100);
      pdf.text(`Team Member Filter: ${selectedTeamMember || 'All Team Members'}`, 40, 120);
      
      // Export chart
      if (chartContainerRef.current) {
        const chartCanvas = await html2canvas(chartContainerRef.current);
        const chartImgData = chartCanvas.toDataURL('image/png');
        
        pdf.addImage(chartImgData, 'PNG', 40, 140, 500, 200);
      }
      
      // Export summary
      if (summaryRef.current) {
        const summaryCanvas = await html2canvas(summaryRef.current);
        const summaryImgData = summaryCanvas.toDataURL('image/png');
        
        pdf.addImage(summaryImgData, 'PNG', 570, 140, 200, 200);
      }
      
      // Export table
      if (timeTableRef.current) {
        const tableCanvas = await html2canvas(timeTableRef.current);
        const tableImgData = tableCanvas.toDataURL('image/png');
        
        pdf.addImage(tableImgData, 'PNG', 40, 360, 730, 200);
      }
      
      // Add footer
      pdf.setFontSize(8);
      pdf.text('Engineering Director - Time Tracking Report', 40, pdf.internal.pageSize.height - 20);
      
      // Save the PDF
      pdf.save(`Time_Tracking_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Time Tracking</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Export PDF
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Log Time
          </button>
        </div>
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
                <label className="block text-gray-700 mb-1">Task or Bug</label>
                <select
                  name="taskId"
                  value={formData.taskId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!selectedProjectId}
                >
                  <option value="">Select Task or Bug</option>
                  {getItemsForForm().map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title} - {item.assignee}
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
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md" ref={chartContainerRef}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Time Tracking History</h2>
          <div className="h-80">
            <Bar data={prepareTimeChartData()} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md" ref={summaryRef}>
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
      <div className="bg-white p-6 rounded-lg shadow-md" ref={timeTableRef}>
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
                  Task / Bug
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
                    {getItemName(entry.taskId, entry.isTaskEntry !== false)}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {entry.hours} hrs
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {entry.description}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    <button 
                      onClick={() => handleDeleteConfirm(entry)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {getFilteredTimeEntries().length === 0 && (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No time entries found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Time Entry
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this time entry? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteTimeEntry}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setTimeEntryToDelete(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracking;