import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import db from '../db/db';

Chart.register(...registerables);

const Team = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    capacity: 40,
    avatar: ''
  });
  
  // Chart ref
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load team members
        const teamMembersData = await db.teamMembers.toArray();
        setTeamMembers(teamMembersData);
        
        // Load projects
        const projectsData = await db.projects.toArray();
        setProjects(projectsData);
        
        // Load tasks
        const tasksData = await db.tasks.toArray();
        setTasks(tasksData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Initialize chart
  useEffect(() => {
    if (chartRef.current && teamMembers.length > 0) {
      // Destroy previous chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // Calculate data for chart
      const labels = teamMembers.map(member => member.name);
      const capacityData = teamMembers.map(member => member.capacity);
      
      // Calculate allocated and used hours for each team member
      const allocatedData = teamMembers.map(member => {
        const memberTasks = tasks.filter(task => task.assigneeId === member.id);
        return memberTasks.reduce((total, task) => total + (parseFloat(task.estimatedHours) || 0), 0);
      });
      
      const usedData = teamMembers.map(member => {
        const memberTasks = tasks.filter(task => task.assigneeId === member.id);
        return memberTasks.reduce((total, task) => total + (parseFloat(task.actualHours) || 0), 0);
      });
      
      // Create chart with a slight delay to ensure the container has proper dimensions
      setTimeout(() => {
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Capacity (hrs)',
                data: capacityData,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              },
              {
                label: 'Allocated (hrs)',
                data: allocatedData,
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
              },
              {
                label: 'Used (hrs)',
                data: usedData,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Hours'
                }
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Team Workload'
              }
            }
          }
        });
      }, 100); // Short delay to ensure container is rendered
    }
    
    // Clean up function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [teamMembers, tasks]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle edit functionality
  const handleEditTeamMember = (member) => {
    setNewMember({
      ...member
    });
    setShowAddMemberForm(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check if editing or adding new
      if (newMember.id) {
        // Update existing team member
        await db.teamMembers.update(newMember.id, {
          ...newMember,
          updatedAt: new Date()
        });
        
        // Update state
        setTeamMembers(prev => 
          prev.map(member => 
            member.id === newMember.id ? { ...newMember, updatedAt: new Date() } : member
          )
        );
      } else {
        // Add new team member
        const id = await db.teamMembers.add({
          ...newMember,
          createdAt: new Date()
        });
        
        // Update state
        setTeamMembers(prev => [...prev, { ...newMember, id, createdAt: new Date() }]);
      }
      
      // Reset form and close it
      setNewMember({
        name: '',
        role: '',
        capacity: 40,
        avatar: ''
      });
      setShowAddMemberForm(false);
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member. Please try again.');
    }
  };
  
  // Calculate workload metrics for each team member
  const calculateWorkloadMetrics = (teamMemberId) => {
    const memberTasks = tasks.filter(task => task.assigneeId === teamMemberId);
    const allocatedHours = memberTasks.reduce((total, task) => total + (parseFloat(task.estimatedHours) || 0), 0);
    const usedHours = memberTasks.reduce((total, task) => total + (parseFloat(task.actualHours) || 0), 0);
    
    return {
      allocatedHours,
      usedHours
    };
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Team Management</h1>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
          onClick={() => setShowAddMemberForm(true)}
        >
          Add Team Member
        </button>
      </div>
      
      {/* Team Workload Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Team Workload</h2>
        <div style={{ height: '300px' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
      
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {teamMembers.map(member => {
          const { allocatedHours, usedHours } = calculateWorkloadMetrics(member.id);
          const capacityPercentage = Math.min(100, Math.round((allocatedHours / member.capacity) * 100));
          const usedPercentage = allocatedHours > 0 ? Math.round((usedHours / allocatedHours) * 100) : 0;
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {member.avatar ? (
                      <img 
                        src={member.avatar}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl text-gray-500">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      <p className="text-gray-500">{member.role}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Capacity</span>
                      <span className="text-sm font-medium text-gray-700">{member.capacity} hrs/week</span>
                    </div>
                    <div className="w-full bg-blue-100 h-2 rounded-full">
                      <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Allocated</span>
                      <span className="text-sm font-medium text-gray-700">{allocatedHours} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${
                          capacityPercentage > 100 ? 'bg-red-600' : 
                          capacityPercentage > 80 ? 'bg-yellow-600' : 'bg-blue-600'
                        }`} 
                        style={{ width: `${Math.min(100, capacityPercentage)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{capacityPercentage}% of capacity</div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Used</span>
                      <span className="text-sm font-medium text-gray-700">{usedHours} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${usedPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{usedPercentage}% of allocated</div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button 
                    onClick={() => handleEditTeamMember(member)}
                    className="text-gray-700 hover:text-gray-900"
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
      
      {/* Add/Edit Team Member Form */}
      {showAddMemberForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {newMember.id ? 'Edit Team Member' : 'Add Team Member'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newMember.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role</label>
                <input
                  type="text"
                  name="role"
                  value={newMember.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Weekly Capacity (hours)</label>
                <input
                  type="number"
                  name="capacity"
                  value={newMember.capacity}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  max="168"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Avatar URL</label>
                <input
                  type="url"
                  name="avatar"
                  value={newMember.avatar}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use initials instead
                </p>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md"
                  onClick={() => {
                    setNewMember({
                      name: '',
                      role: '',
                      capacity: 40,
                      avatar: ''
                    });
                    setShowAddMemberForm(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  {newMember.id ? 'Update Member' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;