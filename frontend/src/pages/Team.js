import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Team = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    capacity: 40
  });

  const team = useLiveQuery(() => db.team.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const timeEntries = useLiveQuery(() => db.timeEntries.toArray());

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'capacity' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await db.team.add(formData);
    setFormData({
      name: '',
      role: '',
      capacity: 40
    });
    setIsFormOpen(false);
  };

  // Calculate allocation for team members
  const calculateAllocation = (memberName) => {
    if (!tasks || !timeEntries) return { allocated: 0, used: 0 };
    
    // Get tasks assigned to this team member
    const memberTasks = tasks.filter(task => task.assignee === memberName);
    
    // Calculate estimated hours
    const allocated = memberTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    
    // Get time entries for these tasks
    const memberTimeEntries = timeEntries.filter(entry => 
      memberTasks.some(task => task.id === entry.taskId)
    );
    
    // Calculate actual hours used
    const used = memberTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    
    return { allocated, used };
  };

  // Prepare team workload chart data
  const workloadData = {
    labels: team ? team.map(member => member.name) : [],
    datasets: [
      {
        label: 'Capacity (hrs)',
        data: team ? team.map(member => member.capacity) : [],
        backgroundColor: 'rgba(96, 165, 250, 0.7)',
      },
      {
        label: 'Allocated (hrs)',
        data: team ? team.map(member => calculateAllocation(member.name).allocated) : [],
        backgroundColor: 'rgba(139, 92, 246, 0.7)',
      },
      {
        label: 'Used (hrs)',
        data: team ? team.map(member => calculateAllocation(member.name).used) : [],
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Team Workload',
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Team Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Add Team Member
        </button>
      </div>

      {/* Team Member Form */}
      {isFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add Team Member</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Name</label>
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
                <label className="block text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Weekly Capacity (hours)</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                  max="168"
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
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Workload Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Team Workload</h2>
        <div className="h-80">
          <Bar data={workloadData} options={chartOptions} />
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team && team.map(member => {
          const { allocated, used } = calculateAllocation(member.name);
          const utilizationPercentage = member.capacity > 0 ? Math.round((allocated / member.capacity) * 100) : 0;
          const progressClass = 
            utilizationPercentage > 100 ? 'bg-red-500' : 
            utilizationPercentage > 80 ? 'bg-yellow-500' : 
            'bg-green-500';
          
          return (
            <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{member.name}</h2>
                <p className="text-gray-600 mb-4">{member.role}</p>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Capacity</span>
                      <span className="text-sm font-medium text-gray-700">{member.capacity} hrs/week</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full w-full"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Allocated</span>
                      <span className="text-sm font-medium text-gray-700">{allocated} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`${progressClass} h-2.5 rounded-full`} 
                        style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-xs mt-1">
                      {utilizationPercentage}% of capacity
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Used</span>
                      <span className="text-sm font-medium text-gray-700">{used} hrs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: `${Math.min((used / allocated) * 100 || 0, 100)}%` }}
                      ></div>
                    </div>
                    {allocated > 0 && (
                      <div className="text-right text-xs mt-1">
                        {Math.round((used / allocated) * 100)}% of allocated
                      </div>
                    )}
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

export default Team;
