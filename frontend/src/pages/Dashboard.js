import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ExecutiveOverview from '../components/Dashboard/ExecutiveOverview';
import ProjectsOverview from '../components/Dashboard/ProjectsOverview';
import SprintPerformance from '../components/Dashboard/SprintPerformance';
import TasksOverview from '../components/Dashboard/TasksOverview';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { PROJECT_STATUS, PROJECT_PRIORITY } from '../db/db';

const Dashboard = () => {
  const [filterStatusDashboard, setFilterStatusDashboard] = useState('all');
  const [filterPriorityDashboard, setFilterPriorityDashboard] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  
  // References for PDF export
  const dashboardRef = useRef(null);
  
  // Get projects for filtering
  const projects = useLiveQuery(() => db.projects.toArray());
  
  // Export dashboard to PDF
  const handleExportPDF = async () => {
    try {
      if (!dashboardRef.current) return;
      
      const pdf = new jsPDF('landscape', 'pt', 'a4');
      
      // Set title
      pdf.setFontSize(18);
      pdf.text('Engineering Director Dashboard', 40, 40);
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 40, 60);
      
      // Add filters applied
      pdf.text(`Status Filter: ${filterStatusDashboard === 'all' ? 'All Statuses' : filterStatusDashboard}`, 40, 80);
      pdf.text(`Priority Filter: ${filterPriorityDashboard === 'all' ? 'All Priorities' : filterPriorityDashboard}`, 40, 100);
      pdf.text(`Date Range: ${filterDateRange === 'all' ? 'All Time' : filterDateRange}`, 40, 120);
      
      // Calculate height of content
      const contentHeight = dashboardRef.current.scrollHeight;
      
      // Create scale factor based on width
      const scale = 740 / dashboardRef.current.offsetWidth;
      
      // Set canvas dimensions
      const canvas = await html2canvas(dashboardRef.current, {
        height: contentHeight,
        width: dashboardRef.current.offsetWidth,
        scale: 2
      });
      
      // Get image data
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate height to maintain aspect ratio
      const imgHeight = (canvas.height * 740) / canvas.width;
      
      // Add image to PDF (scaled to fit page width)
      pdf.addImage(imgData, 'PNG', 40, 140, 740, imgHeight);
      
      // Save the PDF
      pdf.save(`Dashboard_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Engineering Director Dashboard</h1>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
        >
          Export PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Dashboard Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Status</label>
            <select
              value={filterStatusDashboard}
              onChange={(e) => setFilterStatusDashboard(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="all">All Statuses</option>
              {Object.values(PROJECT_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriorityDashboard}
              onChange={(e) => setFilterPriorityDashboard(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="all">All Priorities</option>
              {Object.values(PROJECT_PRIORITY).map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="all">All Time</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
        </div>
      </div>
      
      <div ref={dashboardRef} className="space-y-6">
        <ExecutiveOverview 
          filterStatus={filterStatusDashboard} 
          filterPriority={filterPriorityDashboard}
          filterDateRange={filterDateRange}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectsOverview 
            filterStatus={filterStatusDashboard} 
            filterPriority={filterPriorityDashboard}
            filterDateRange={filterDateRange}
          />
          <SprintPerformance 
            filterStatus={filterStatusDashboard} 
            filterPriority={filterPriorityDashboard}
            filterDateRange={filterDateRange}
          />
        </div>
        
        <TasksOverview 
          filterStatus={filterStatusDashboard} 
          filterPriority={filterPriorityDashboard}
          filterDateRange={filterDateRange}
        />
      </div>
    </div>
  );
};

export default Dashboard;