import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import db from '../db/db';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Team = () => {
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    capacity: 40,
    avatar: '',
    projectId: '',
    sprintId: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    role: 'all',
    projectId: 'all',
    sprintId: 'all'
  });
  
  // Chart refs
  const allocationChartRef = useRef(null);
  const allocationChartInstance = useRef(null);
  const workloadChartRef = useRef(null);
  const workloadChartInstance = useRef(null);

  // Live queries for data
  const allProjects = useLiveQuery(() => db.projects.toArray());
  const allTeam = useLiveQuery(() => db.team.toArray());
  const allTasks = useLiveQuery(() => db.tasks.toArray());
  const allBugs = useLiveQuery(() => db.bugs.toArray());
  const allSprints = useLiveQuery(() => 
    filters.projectId !== 'all' 
      ? db.sprints.where('projectId').equals(parseInt(filters.projectId)).toArray()
      : db.sprints.toArray()
  );

  // Initialize data from live queries
  useEffect(() => {
    if (allTeam) setTeam(allTeam);
    if (allTasks) setTasks(allTasks);
    if (allBugs) setBugs(allBugs);
  }, [allTeam, allTasks, allBugs]);
  
  // Apply filters to team members
  const filteredTeam = useLiveQuery(() => {
    if (!allTeam) return [];
    
    let filtered = [...allTeam];
    
    if (filters.role !== 'all') {
      filtered = filtered.filter(member => member.role === filters.role);
    }
    
    if (filters.projectId !== 'all') {
      filtered = filtered.filter(member => 
        member.projectId && member.projectId.toString() === filters.projectId
      );
    }
    
    if (filters.sprintId !== 'all') {
      filtered = filtered.filter(member => 
        member.sprintId && member.sprintId.toString() === filters.sprintId
      );
    }
    
    return filtered;
  }, [allTeam, filters]);
  
  // Get all unique roles for filter dropdown
  const roles = useLiveQuery(() => {
    if (!allTeam) return [];
    const roleSet = new Set(allTeam.map(member => member.role));
    return Array.from(roleSet);
  }, [allTeam]);
  
  // Initialize allocation chart when data changes
  useEffect(() => {
    if (allocationChartRef.current && filteredTeam && filteredTeam.length > 0) {
      // Destroy previous chart instance if it exists
      if (allocationChartInstance.current) {
        allocationChartInstance.current.destroy();
      }
      
      // Define chart container dimensions 
      const container = allocationChartRef.current.parentNode;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set the chart canvas to match container size properly
      allocationChartRef.current.width = containerWidth;
      allocationChartRef.current.height = containerHeight;
      
      // Prepare data
      const roleCount = {};
      filteredTeam.forEach(member => {
        roleCount[member.role] = (roleCount[member.role] || 0) + 1;
      });
      
      const ctx = allocationChartRef.current.getContext('2d');
      allocationChartInstance.current = new ChartJS(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(roleCount),
          datasets: [
            {
              data: Object.values(roleCount),
              backgroundColor: [
                'rgba(54, 162, 235, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(153, 102, 255, 0.7)',
              ],
              borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(153, 102, 255, 1)',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Team Role Distribution'
            }
          }
        },
      });
    }
    
    return () => {
      if (allocationChartInstance.current) {
        allocationChartInstance.current.destroy();
      }
    };
  }, [filteredTeam]);
  
  // Initialize workload chart when data changes
  useEffect(() => {
    if (workloadChartRef.current && filteredTeam && filteredTeam.length > 0 && (tasks.length > 0 || bugs.length > 0)) {
      // Destroy previous chart instance if it exists
      if (workloadChartInstance.current) {
        workloadChartInstance.current.destroy();
      }
      
      // Define chart container dimensions 
      const container = workloadChartRef.current.parentNode;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Set the chart canvas to match container size properly
      workloadChartRef.current.width = containerWidth;
      workloadChartRef.current.height = containerHeight;
      
      // Prepare data
      const memberTasks = {};
      const memberBugs = {};
      
      filteredTeam.forEach(member => {
        memberTasks[member.name] = 0;
        memberBugs[member.name] = 0;
      });
      
      tasks.forEach(task => {
        if (task.assignee && memberTasks[task.assignee] !== undefined) {
          memberTasks[task.assignee]++;
        }
      });
      
      bugs.forEach(bug => {
        if (bug.assignee && memberBugs[bug.assignee] !== undefined) {
          memberBugs[bug.assignee]++;
        }
      });
      
      const ctx = workloadChartRef.current.getContext('2d');
      workloadChartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(memberTasks),
          datasets: [
            {
              label: 'Tasks',
              data: Object.values(memberTasks),
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
            {
              label: 'Bugs',
              data: Object.values(memberBugs),
              backgroundColor: 'rgba(255, 99, 132, 0.7)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            title: {
              display: true,
              text: 'Team Workload'
            }
          }
        },
      });
    }
    
    return () => {
      if (workloadChartInstance.current) {
        workloadChartInstance.current.destroy();
      }
    };
  }, [filteredTeam, tasks, bugs]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const teamData = {
        ...formData,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        sprintId: formData.sprintId ? parseInt(formData.sprintId) : null
      };
      
      let id;
      if (isEditing) {
        // Update existing team member
        id = formData.id;
        await db.team.update(id, {
          ...teamData,
          updatedAt: new Date()
        });
        
        // Also update in teamMembers for backward compatibility
        const existingInTeamMembers = await db.teamMembers.get({ name: formData.name });
        if (existingInTeamMembers) {
          await db.teamMembers.update(existingInTeamMembers.id, {
            ...teamData,
            updatedAt: new Date()
          });
        }
        
        setTeam(prev => 
          prev.map(member => member.id === id ? { ...teamData, id, updatedAt: new Date() } : member)
        );
      } else {
        // Add new team member
        id = await db.team.add({
          ...teamData,
          createdAt: new Date()
        });
        
        // Also add to teamMembers for backward compatibility
        await db.teamMembers.add({
          ...teamData,
          createdAt: new Date()
        });
        
        setTeam(prev => [...prev, { ...teamData, id, createdAt: new Date() }]);
      }
      
      // Reset form
      setFormData({
        name: '',
        role: '',
        capacity: 40,
        avatar: '',
        projectId: '',
        sprintId: ''
      });
      setIsEditing(false);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member. Please try again.');
    }
  };
  
  const handleEdit = (member) => {
    setFormData({
      id: member.id,
      name: member.name,
      role: member.role,
      capacity: member.capacity,
      avatar: member.avatar || '',
      projectId: member.projectId ? member.projectId.toString() : '',
      sprintId: member.sprintId ? member.sprintId.toString() : ''
    });
    setIsEditing(true);
    setShowForm(true);
  };
  
  const getTaskCount = (memberName) => {
    return tasks.filter(task => task.assignee === memberName).length;
  };
  
  const getBugCount = (memberName) => {
    return bugs.filter(bug => bug.assignee === memberName).length;
  };
  
  const getProjectName = (projectId) => {
    if (!allProjects || !projectId) return 'Not Assigned';
    const project = allProjects.find(p => p.id === projectId);
    return project ? project.name : 'Not Assigned';
  };
  
  const getSprintName = (sprintId) => {
    if (!allSprints || !sprintId) return 'Not Assigned';
    const sprint = allSprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : 'Not Assigned';
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // If changing project, reset sprint filter
    if (name === 'projectId') {
      setFilters(prev => ({
        ...prev,
        [name]: value,
        sprintId: 'all'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Get sprints based on selected project
  const getFilteredSprints = () => {
    if (!allSprints) return [];
    if (filters.projectId === 'all') return allSprints;
    return allSprints.filter(sprint => sprint.projectId === parseInt(filters.projectId));
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Team</h1>
        <button
          onClick={() => {
            setFormData({
              name: '',
              role: '',
              capacity: 40,
              avatar: '',
              projectId: '',
              sprintId: ''
            });
            setIsEditing(false);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Add Team Member
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Filters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              {roles && roles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Project</label>
            <select
              name="projectId"
              value={filters.projectId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {allProjects && allProjects.map(project => (
                <option key={project.id} value={project.id.toString()}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 mb-1">Sprint</label>
            <select
              name="sprintId"
              value={filters.sprintId}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={filters.projectId === 'all'}
            >
              <option value="all">All Sprints</option>
              {getFilteredSprints().map(sprint => (
                <option key={sprint.id} value={sprint.id.toString()}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Team Member Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isEditing ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Project</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Assigned</option>
                  {allProjects && allProjects.map(project => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Sprint</label>
                <select
                  name="sprintId"
                  value={formData.sprintId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.projectId}
                >
                  <option value="">Not Assigned</option>
                  {allSprints && formData.projectId && allSprints
                    .filter(sprint => sprint.projectId === parseInt(formData.projectId))
                    .map(sprint => (
                      <option key={sprint.id} value={sprint.id.toString()}>
                        {sprint.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Capacity (hours/week)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="80"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Avatar URL (optional)</label>
                <input
                  type="text"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {isEditing ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Team Role Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Role Distribution</h2>
          <div style={{ height: "300px" }}>
            <canvas ref={allocationChartRef}></canvas>
          </div>
        </div>
        
        {/* Team Workload Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Workload</h2>
          <div style={{ height: "300px" }}>
            <canvas ref={workloadChartRef}></canvas>
          </div>
        </div>
      </div>
      
      {/* Team Members Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Team Members</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">NAME</th>
                <th className="py-3 px-4 text-left">ROLE</th>
                <th className="py-3 px-4 text-left">PROJECT</th>
                <th className="py-3 px-4 text-left">SPRINT</th>
                <th className="py-3 px-4 text-left">CAPACITY</th>
                <th className="py-3 px-4 text-left">ASSIGNED TASKS</th>
                <th className="py-3 px-4 text-left">ASSIGNED BUGS</th>
                <th className="py-3 px-4 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam && filteredTeam.length > 0 ? (
                filteredTeam.map(member => (
                  <tr key={member.id} className="border-t border-gray-200">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                            {member.name.substring(0, 1)}
                          </div>
                        )}
                        {member.name}
                      </div>
                    </td>
                    <td className="py-3 px-4">{member.role}</td>
                    <td className="py-3 px-4">{getProjectName(member.projectId)}</td>
                    <td className="py-3 px-4">{getSprintName(member.sprintId)}</td>
                    <td className="py-3 px-4">{member.capacity} hours/week</td>
                    <td className="py-3 px-4">{getTaskCount(member.name)}</td>
                    <td className="py-3 px-4">{getBugCount(member.name)}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-3 px-4 text-center text-gray-500">
                    {filteredTeam && filteredTeam.length === 0 && team.length > 0 ? 
                      'No team members match the current filters.' : 
                      'No team members found. Add your first team member to get started.'}
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

export default Team;