import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import db, { SPRINT_STATUS } from '../db/db';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

// Hours to story points conversion ratio (configurable)
const HOURS_TO_POINTS_RATIO = 8; // 8 hours = 1 story point

const Sprints = () => {
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    startDate: '',
    endDate: '',
    committedPoints: 0,
    addedPoints: 0,
    descopedPoints: 0,
    status: SPRINT_STATUS.PLANNING
  });
  const [projects, setProjects] = useState([]);
  const [allSprints, setAllSprints] = useState([]);
  const [filteredSprints, setFilteredSprints] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sprintToDelete, setSprintToDelete] = useState(null);
  
  // Refs for PDF export
  const sprintTableRef = useRef(null);
  const chartContainerRef = useRef(null);

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
        
        const tasksData = await db.tasks.toArray();
        setTasks(tasksData);
        
        const bugsData = await db.bugs.toArray();
        setBugs(bugsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  // Calculate accepted points for each sprint based on completed tasks and bugs
  const calculateAcceptedPoints = (sprintId) => {
    // Filter tasks and bugs that belong to this sprint and are completed
    const completedTasks = tasks.filter(
      task => task.sprintId === sprintId && task.status === 'Done'
    );
    
    const completedBugs = bugs.filter(
      bug => bug.sprintId === sprintId && bug.status === 'Done'
    );
    
    // Calculate total actual hours
    const totalTaskHours = completedTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
    const totalBugHours = completedBugs.reduce((sum, bug) => sum + (bug.actualHours || 0), 0);
    const totalActualHours = totalTaskHours + totalBugHours;
    
    // Convert hours to story points (rounded to nearest integer)
    return Math.round(totalActualHours / HOURS_TO_POINTS_RATIO);
  };

  // Enhance sprints with calculated accepted points
  const getEnhancedSprints = (sprints) => {
    return sprints.map(sprint => {
      const calculatedAcceptedPoints = calculateAcceptedPoints(sprint.id);
      return {
        ...sprint,
        // Only use calculated points if status is Active or Completed
        calculatedAcceptedPoints,
        acceptedPoints: sprint.status === 'Planning' ? 0 : calculatedAcceptedPoints
      };
    });
  };

  // Get enhanced filtered sprints
  const enhancedFilteredSprints = getEnhancedSprints(filteredSprints);

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
    if (chartRef.current && enhancedFilteredSprints.length > 0) {
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
      const labels = enhancedFilteredSprints.map(sprint => sprint.name);
      const committedPointsData = enhancedFilteredSprints.map(sprint => sprint.committedPoints);
      const acceptedPointsData = enhancedFilteredSprints.map(sprint => sprint.acceptedPoints);
      const addedPointsData = enhancedFilteredSprints.map(sprint => sprint.addedPoints);
      const descopedPointsData = enhancedFilteredSprints.map(sprint => sprint.descopedPoints);
      
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
  }, [enhancedFilteredSprints]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'committedPoints' || name === 'addedPoints' || name === 'descopedPoints' 
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
        status: formData.status,
        // Remove acceptedPoints from form data as it will be calculated
        acceptedPoints: 0
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
      addedPoints: sprint.addedPoints,
      descopedPoints: sprint.descopedPoints,
      status: sprint.status
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  // Handle delete sprint confirmation
  const handleDeleteConfirm = (sprint) => {
    setSprintToDelete(sprint);
    setIsDeleteModalOpen(true);
  };
  
  // Handle actual deletion of sprint
  const handleDeleteSprint = async () => {
    if (!sprintToDelete) return;
    
    try {
      // Check if there are any tasks or bugs associated with this sprint
      const sprintTasks = tasks.filter(task => task.sprintId === sprintToDelete.id);
      const sprintBugs = bugs.filter(bug => bug.sprintId === sprintToDelete.id);
      
      if (sprintTasks.length > 0 || sprintBugs.length > 0) {
        if (!window.confirm(`This sprint has ${sprintTasks.length} tasks and ${sprintBugs.length} bugs associated with it. Deleting it will dissociate these items from the sprint. Continue?`)) {
          setIsDeleteModalOpen(false);
          setSprintToDelete(null);
          return;
        }
        
        // Update tasks and bugs to remove the sprint association
        for (const task of sprintTasks) {
          await db.tasks.update(task.id, { sprintId: null });
        }
        
        for (const bug of sprintBugs) {
          await db.bugs.update(bug.id, { sprintId: null });
        }
      }
      
      // Delete the sprint
      await db.sprints.delete(sprintToDelete.id);
      
      // Update state
      setAllSprints(prev => prev.filter(sprint => sprint.id !== sprintToDelete.id));
      
      // Close modal
      setIsDeleteModalOpen(false);
      setSprintToDelete(null);
    } catch (error) {
      console.error('Error deleting sprint:', error);
      alert('Failed to delete sprint. Please try again.');
    }
  };
  
  // Export sprint data to PDF
  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      
      // Set title
      pdf.setFontSize(18);
      pdf.text('Sprint Report', 40, 40);
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);
      
      // Add filters applied
      pdf.text(`Project Filter: ${selectedProjectId === 'all' ? 'All Projects' : getProjectName(parseInt(selectedProjectId))}`, 40, 80);
      
      // Export chart
      if (chartContainerRef.current) {
        const chartCanvas = await html2canvas(chartContainerRef.current);
        const chartImgData = chartCanvas.toDataURL('image/png');
        
        pdf.addImage(chartImgData, 'PNG', 40, 100, 500, 250);
      }
      
      // Export table
      if (sprintTableRef.current) {
        const tableCanvas = await html2canvas(sprintTableRef.current);
        const tableImgData = tableCanvas.toDataURL('image/png');
        
        pdf.addImage(tableImgData, 'PNG', 40, 370, 500, 250);
      }
      
      // Add footer
      pdf.setFontSize(8);
      pdf.text('Engineering Director - Sprint Management Report', 40, pdf.internal.pageSize.height - 20);
      
      // Save the PDF
      pdf.save(`Sprints_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
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
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Export PDF
          </button>
          
          <button
            onClick={() => {
              setFormData({
                projectId: '',
                name: '',
                startDate: '',
                endDate: '',
                committedPoints: 0,
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
              
              {isEditing && (
                <div className="col-span-2">
                  <p className="text-gray-600 italic text-sm">
                    Note: Accepted points are automatically calculated based on completed tasks and bugs in this sprint.
                  </p>
                </div>
              )}
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
      <div className="bg-white p-6 rounded-lg shadow-md mb-6" ref={chartContainerRef}>
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sprint Performance</h2>
        <div style={{ height: "300px" }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Sprints Table */}
      <div className="bg-white p-6 rounded-lg shadow-md" ref={sprintTableRef}>
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
              {enhancedFilteredSprints && enhancedFilteredSprints.length > 0 ? (
                enhancedFilteredSprints.map(sprint => {
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
                        <div>
                          Accepted: {sprint.acceptedPoints}
                          {sprint.status !== 'Planning' && (
                            <span className="text-gray-500 text-xs ml-1">
                              (calculated from tasks)
                            </span>
                          )}
                        </div>
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
                        <button 
                          onClick={() => handleDeleteConfirm(sprint)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
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
                      Delete Sprint
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the sprint "{sprintToDelete?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteSprint}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSprintToDelete(null);
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

export default Sprints;