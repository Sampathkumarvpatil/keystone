import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import db, { PROJECT_STATUS, TASK_STATUS } from '../../db/db';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const ExecutiveOverview = ({ filterStatus, filterPriority, filterDateRange, filterProjectId, filterSprintId }) => {
  const allProjects = useLiveQuery(() => db.projects.toArray());
  const allSprints = useLiveQuery(() => db.sprints.toArray());
  const allTasks = useLiveQuery(() => db.tasks.toArray());
  
  // Apply filters to data
  const projects = React.useMemo(() => {
    if (!allProjects) return [];
    
    let filtered = [...allProjects];
    
    // Filter by status
    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }
    
    // Filter by priority
    if (filterPriority && filterPriority !== 'all') {
      filtered = filtered.filter(p => p.priority === filterPriority);
    }
    
    // Filter by specific project
    if (filterProjectId && filterProjectId !== 'all') {
      filtered = filtered.filter(p => p.id === parseInt(filterProjectId));
    }
    
    // Filter by date range
    if (filterDateRange && filterDateRange !== 'all') {
      const now = new Date();
      let cutoffDate;
      
      if (filterDateRange === 'last-30-days') {
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
      } else if (filterDateRange === 'last-90-days') {
        cutoffDate = new Date(now.setDate(now.getDate() - 90));
      } else if (filterDateRange === 'this-year') {
        cutoffDate = new Date(now.getFullYear(), 0, 1);
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(p => new Date(p.startDate) >= cutoffDate || new Date(p.endDate) >= cutoffDate);
      }
    }
    
    return filtered;
  }, [allProjects, filterStatus, filterPriority, filterDateRange, filterProjectId]);
  
  // Get sprints and tasks for filtered projects
  const projectIds = projects?.map(p => p.id) || [];
  
  const sprints = React.useMemo(() => {
    if (!allSprints || projectIds.length === 0) return [];
    return allSprints.filter(s => projectIds.includes(s.projectId));
  }, [allSprints, projectIds]);
  
  const tasks = React.useMemo(() => {
    if (!allTasks || projectIds.length === 0) return [];
    return allTasks.filter(t => projectIds.includes(t.projectId));
  }, [allTasks, projectIds]);

  const [projectStatusData, setProjectStatusData] = useState({
    labels: Object.values(PROJECT_STATUS),
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ['#C4B5FD', '#60A5FA', '#F59E0B', '#34D399'],
        borderWidth: 1,
      },
    ],
  });

  const [sprintPerformanceData, setSprintPerformanceData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Committed',
        data: [],
        backgroundColor: '#60A5FA',
      },
      {
        label: 'Accepted',
        data: [],
        backgroundColor: '#34D399',
      },
      {
        label: 'Added',
        data: [],
        backgroundColor: '#F59E0B',
      },
      {
        label: 'Descoped',
        data: [],
        backgroundColor: '#EF4444',
      },
    ],
  });

  const [velocityTrendData, setVelocityTrendData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Velocity',
        data: [],
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.5)',
        tension: 0.4,
      },
    ],
  });

  // Update project status chart when projects change
  useEffect(() => {
    if (projects) {
      const statusCounts = Object.values(PROJECT_STATUS).map(
        status => projects.filter(p => p.status === status).length
      );
      
      setProjectStatusData(prev => ({
        ...prev,
        datasets: [
          {
            ...prev.datasets[0],
            data: statusCounts,
          },
        ],
      }));
    }
  }, [projects]);

  // Update sprint performance charts when sprints change
  useEffect(() => {
    if (sprints) {
      // Get the last 6 completed sprints
      const completedSprints = sprints
        .filter(s => s.status === 'Completed')
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))
        .slice(0, 6)
        .reverse();
      
      const sprintNames = completedSprints.map(s => s.name);
      const committedPoints = completedSprints.map(s => s.committedPoints);
      const acceptedPoints = completedSprints.map(s => s.acceptedPoints);
      const addedPoints = completedSprints.map(s => s.addedPoints);
      const descopedPoints = completedSprints.map(s => s.descopedPoints);
      
      setSprintPerformanceData({
        labels: sprintNames,
        datasets: [
          {
            label: 'Committed',
            data: committedPoints,
            backgroundColor: '#60A5FA',
          },
          {
            label: 'Accepted',
            data: acceptedPoints,
            backgroundColor: '#34D399',
          },
          {
            label: 'Added',
            data: addedPoints,
            backgroundColor: '#F59E0B',
          },
          {
            label: 'Descoped',
            data: descopedPoints,
            backgroundColor: '#EF4444',
          },
        ],
      });
      
      // Calculate velocity as accepted points per sprint
      setVelocityTrendData({
        labels: sprintNames,
        datasets: [
          {
            label: 'Velocity',
            data: acceptedPoints,
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            tension: 0.4,
          },
        ],
      });
    }
  }, [sprints]);

  // Calculate high-level metrics
  const activeProjects = projects ? projects.filter(p => p.status === PROJECT_STATUS.IN_PROGRESS).length : 0;
  const completedProjects = projects ? projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length : 0;
  const activeSprints = sprints ? sprints.filter(s => s.status === 'Active').length : 0;
  const tasksInProgress = tasks ? tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length : 0;

  const doughnutOptions = {
    plugins: {
      legend: {
        position: 'right',
      },
    },
    maintainAspectRatio: false,
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Sprint Performance',
      },
    },
    scales: {
      x: {
        stacked: false,
      },
      y: {
        stacked: false,
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Velocity Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Executive Overview</h2>
      
      {/* Metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-purple-800">Active Projects</h3>
          <p className="text-3xl font-bold text-purple-600">{activeProjects}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-blue-800">Active Sprints</h3>
          <p className="text-3xl font-bold text-blue-600">{activeSprints}</p>
        </div>
        <div className="bg-green-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-green-800">Completed Projects</h3>
          <p className="text-3xl font-bold text-green-600">{completedProjects}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-yellow-800">Tasks In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">{tasksInProgress}</p>
        </div>
      </div>
      
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Project Status</h3>
          <div className="h-64">
            <Doughnut data={projectStatusData} options={doughnutOptions} />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sprint Performance</h3>
          <div className="h-64">
            <Bar data={sprintPerformanceData} options={barOptions} />
          </div>
        </div>
      </div>
      
      {/* Velocity trend */}
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Velocity Trend</h3>
        <div className="h-64">
          <Line data={velocityTrendData} options={lineOptions} />
        </div>
      </div>
    </div>
  );
};

export default ExecutiveOverview;