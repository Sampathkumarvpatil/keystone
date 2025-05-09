import React, { useState, useEffect, useRef } from 'react';
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
    avatar: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Chart refs
  const allocationChartRef = useRef(null);
  const allocationChartInstance = useRef(null);
  const workloadChartRef = useRef(null);
  const workloadChartInstance = useRef(null);

  // Load team data
  useEffect(() => {
    const loadData = async () => {
      try {
        const teamData = await db.team.toArray();
        setTeam(teamData);
        
        const tasksData = await db.tasks.toArray();
        setTasks(tasksData);
        
        const bugsData = await db.bugs.toArray();
        setBugs(bugsData);
      } catch (error) {
        console.error('Error loading team data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Initialize allocation chart when data changes
  useEffect(() => {
    if (allocationChartRef.current && team.length > 0) {
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
      const roles = {};
      team.forEach(member => {
        roles[member.role] = (roles[member.role] || 0) + 1;
      });
      
      const ctx = allocationChartRef.current.getContext('2d');
      allocationChartInstance.current = new ChartJS(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(roles),
          datasets: [
            {
              data: Object.values(roles),
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
  }, [team]);
  
  // Initialize workload chart when data changes
  useEffect(() => {
    if (workloadChartRef.current && team.length > 0 && (tasks.length > 0 || bugs.length > 0)) {
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
      
      team.forEach(member => {
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
  }, [team, tasks, bugs]);
  
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
      let id;
      if (isEditing) {
        // Update existing team member
        id = formData.id;
        await db.team.update(id, {
          ...formData,
          updatedAt: new Date()
        });
        
        setTeam(prev => 
          prev.map(member => member.id === id ? { ...formData, id, updatedAt: new Date() } : member)
        );
      } else {
        // Add new team member
        id = await db.team.add({
          ...formData,
          createdAt: new Date()
        });
        
        // Also add to teamMembers for backward compatibility
        await db.teamMembers.add({
          ...formData,
          createdAt: new Date()
        });
        
        setTeam(prev => [...prev, { ...formData, id, createdAt: new Date() }]);
      }
      
      // Reset form
      setFormData({
        name: '',
        role: '',
        capacity: 40,
        avatar: ''
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
      avatar: member.avatar || ''
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
              avatar: ''
            });
            setIsEditing(false);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Add Team Member
        </button>
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
                <th className="py-3 px-4 text-left">CAPACITY</th>
                <th className="py-3 px-4 text-left">ASSIGNED TASKS</th>
                <th className="py-3 px-4 text-left">ASSIGNED BUGS</th>
                <th className="py-3 px-4 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {team && team.length > 0 ? (
                team.map(member => (
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
                  <td colSpan="6" className="py-3 px-4 text-center text-gray-500">
                    No team members found. Add your first team member to get started.
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