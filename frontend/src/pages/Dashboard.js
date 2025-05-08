import React, { useEffect } from 'react';
import ExecutiveOverview from '../components/Dashboard/ExecutiveOverview';
import ProjectsOverview from '../components/Dashboard/ProjectsOverview';
import SprintPerformance from '../components/Dashboard/SprintPerformance';
import TasksOverview from '../components/Dashboard/TasksOverview';
import { populateSampleData } from '../db/db';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Engineering Director Dashboard</h1>
      
      <ExecutiveOverview />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectsOverview />
        <SprintPerformance />
      </div>
      
      <TasksOverview />
    </div>
  );
};

export default Dashboard;
