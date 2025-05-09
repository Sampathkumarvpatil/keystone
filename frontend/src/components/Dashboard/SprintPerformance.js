import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../../db/db';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const SprintPerformance = ({ filterStatus, filterPriority, filterDateRange, filterProjectId, filterSprintId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [calculatedAcceptedPoints, setCalculatedAcceptedPoints] = useState({});
  
  // Get base data
  const projects = useLiveQuery(() => db.projects.toArray());
  const allSprints = useLiveQuery(() => db.sprints.toArray());
  const allTasks = useLiveQuery(() => db.tasks.toArray());
  const allBugs = useLiveQuery(() => db.bugs.toArray());
  
  // Set project from filter or default - FIXED TO AVOID INFINITE LOOPS
  useEffect(() => {
    if (filterProjectId && filterProjectId !== 'all' && filterProjectId !== selectedProjectId) {
      setSelectedProjectId(parseInt(filterProjectId));
    } else if (projects && projects.length > 0 && selectedProjectId === null) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, filterProjectId, selectedProjectId]);
  
  // Calculate accepted points from completed tasks and bugs
  useEffect(() => {
    if (allSprints && allTasks && allBugs) {
      const pointsMap = {};
      
      // Calculate for each sprint
      allSprints.forEach(sprint => {
        // Get completed tasks for this sprint
        const completedTasks = allTasks.filter(
          task => task.sprintId === sprint.id && task.status === 'Done'
        );
        
        // Get completed bugs for this sprint
        const completedBugs = allBugs.filter(
          bug => bug.sprintId === sprint.id && bug.status === 'Done'
        );
        
        // Calculate total actual hours
        const taskHours = completedTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0);
        const bugHours = completedBugs.reduce((sum, bug) => sum + (bug.actualHours || 0), 0);
        const totalHours = taskHours + bugHours;
        
        // Convert to story points (8 hours = 1 story point)
        const calculatedPoints = Math.round(totalHours / 8);
        
        pointsMap[sprint.id] = calculatedPoints;
      });
      
      setCalculatedAcceptedPoints(pointsMap);
    }
  }, [allSprints, allTasks, allBugs]);
  
  // Apply filters to sprints - Use memoization to avoid recalculation
  const filteredSprints = React.useMemo(() => {
    if (!allSprints) return [];
    
    // First filter by project if selected
    let filtered = selectedProjectId 
      ? allSprints.filter(s => s.projectId === selectedProjectId)
      : [...allSprints];
    
    // Apply specific sprint filter if provided
    if (filterSprintId && filterSprintId !== 'all') {
      filtered = filtered.filter(s => s.id === parseInt(filterSprintId));
    }
    
    return filtered;
  }, [allSprints, selectedProjectId, filterSprintId]);
  
  // Get active sprint, with preference to filtered sprint if specified
  const activeSprint = React.useMemo(() => {
    if (!filteredSprints || filteredSprints.length === 0) return null;
    
    // If a specific sprint is filtered, use that one
    if (filterSprintId && filterSprintId !== 'all') {
      return filteredSprints[0]; // Should be the only sprint after filtering
    }
    
    // Otherwise find the active sprint
    return filteredSprints.find(s => s.status === 'Active') || filteredSprints[0];
  }, [filteredSprints, filterSprintId]);
  
  // Use calculated accepted points if available
  const getAcceptedPoints = (sprint) => {
    if (!sprint) return 0;
    
    // If sprint is in planning, always return 0
    if (sprint.status === 'Planning') return 0;
    
    // Otherwise use calculated points
    return calculatedAcceptedPoints[sprint.id] || sprint.acceptedPoints || 0;
  };

  // Prepare data for commitment reliability gauge
  const commitmentReliabilityData = activeSprint ? {
    labels: ['Accepted', 'Remaining'],
    datasets: [
      {
        data: [
          getAcceptedPoints(activeSprint), 
          Math.max(0, activeSprint.committedPoints - getAcceptedPoints(activeSprint))
        ],
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
          getAcceptedPoints(activeSprint),
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
  const completionPercentage = activeSprint && activeSprint.committedPoints > 0
    ? Math.round((getAcceptedPoints(activeSprint) / activeSprint.committedPoints) * 100)
    : 0;

  // Handle project selection change
  const handleProjectChange = (e) => {
    const newProjectId = Number(e.target.value);
    setSelectedProjectId(newProjectId);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sprint Performance</h2>
        
        <select 
          className="form-select rounded border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          value={selectedProjectId || ''}
          onChange={handleProjectChange}
          disabled={filterProjectId && filterProjectId !== 'all'}
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
                <div className="text-2xl font-bold text-green-800">{getAcceptedPoints(activeSprint)}</div>
                {activeSprint.status !== 'Planning' && (
                  <div className="text-xs text-green-500">
                    (calculated from tasks)
                  </div>
                )}
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