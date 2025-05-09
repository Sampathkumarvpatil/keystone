import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const SprintPerformance = ({ filterStatus, filterPriority, filterDateRange, filterProjectId, filterSprintId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => 
    selectedProjectId 
      ? db.sprints.where('projectId').equals(selectedProjectId).toArray() 
      : db.sprints.toArray()
  );
  
  // Set first project as selected by default when data loads
  useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);
  
  // Get active sprint
  const activeSprint = sprints ? sprints.find(s => s.status === 'Active') : null;
  
  // Prepare data for commitment reliability gauge
  const commitmentReliabilityData = activeSprint ? {
    labels: ['Accepted', 'Remaining'],
    datasets: [
      {
        data: [activeSprint.acceptedPoints, activeSprint.committedPoints - activeSprint.acceptedPoints],
        backgroundColor: ['#34D399', '#E5E7EB'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  } : {
    labels: ['No Data'],
    datasets: [
      {
        data: [1],
        backgroundColor: ['#E5E7EB'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };
  
  // Prepare data for story points chart
  const storyPointsData = activeSprint ? {
    labels: ['Committed', 'Accepted', 'Added', 'Descoped'],
    datasets: [
      {
        label: 'Points',
        data: [
          activeSprint.committedPoints,
          activeSprint.acceptedPoints,
          activeSprint.addedPoints,
          activeSprint.descopedPoints,
        ],
        backgroundColor: ['#60A5FA', '#34D399', '#F59E0B', '#EF4444'],
        borderWidth: 1,
      },
    ],
  } : {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Points',
        data: [0],
        backgroundColor: ['#E5E7EB'],
        borderWidth: 1,
      },
    ],
  };
  
  // Options for gauge chart
  const gaugeOptions = {
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    rotation: -90,
    circumference: 180,
    maintainAspectRatio: false,
  };
  
  // Options for bar chart
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Calculate completion percentage
  const completionPercentage = activeSprint 
    ? Math.round((activeSprint.acceptedPoints / activeSprint.committedPoints) * 100) 
    : 0;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sprint Performance</h2>
        
        <select 
          className="form-select rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(Number(e.target.value))}
        >
          {projects && projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      
      {activeSprint ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Commitment Reliability Gauge */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">Commitment Reliability</h3>
              <div className="h-48 relative">
                <Doughnut data={commitmentReliabilityData} options={gaugeOptions} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-gray-800">{completionPercentage}%</span>
                  <span className="text-sm text-gray-500">of committed</span>
                </div>
              </div>
            </div>
            
            {/* Sprint Info Card */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Sprint</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{activeSprint.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {activeSprint.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">
                    {new Date(activeSprint.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">
                    {new Date(activeSprint.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium">
                    {Math.max(0, Math.ceil((new Date(activeSprint.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Story Points Chart */}
            <div className="bg-white p-4 rounded shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Story Points</h3>
              <div className="h-48">
                <Bar data={storyPointsData} options={barOptions} />
              </div>
            </div>
          </div>
          
          {/* Sprint Stats Table */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sprint Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded">
                <div className="text-sm text-blue-600">Committed Points</div>
                <div className="text-2xl font-bold text-blue-800">{activeSprint.committedPoints}</div>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-green-600">Accepted Points</div>
                <div className="text-2xl font-bold text-green-800">{activeSprint.acceptedPoints}</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded">
                <div className="text-sm text-yellow-600">Added Points</div>
                <div className="text-2xl font-bold text-yellow-800">{activeSprint.addedPoints}</div>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <div className="text-sm text-red-600">Descoped Points</div>
                <div className="text-2xl font-bold text-red-800">{activeSprint.descopedPoints}</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 p-8 rounded text-center">
          <p className="text-gray-500 text-lg">No active sprint found for this project.</p>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            Start New Sprint
          </button>
        </div>
      )}
    </div>
  );
};

export default SprintPerformance;
