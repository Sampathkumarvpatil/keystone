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
  // Initial state with default values
  const [filterStatusDashboard, setFilterStatusDashboard] = useState('all');
  const [filterPriorityDashboard, setFilterPriorityDashboard] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterProjectId, setFilterProjectId] = useState('all');
  const [filterSprintId, setFilterSprintId] = useState('all');
  
  // References for PDF export
  const dashboardRef = useRef(null);
  
  // Get data for filtering
  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => 
    filterProjectId !== 'all' 
      ? db.sprints.where('projectId').equals(parseInt(filterProjectId)).toArray() 
      : db.sprints.toArray()
  );
  
  // Handle project selection change
  const handleProjectChange = (e) => {
    const newValue = e.target.value;
    setFilterProjectId(newValue);
    // Reset sprint filter if project changes
    setFilterSprintId('all');
  };
  
  // Handle sprint selection change
  const handleSprintChange = (e) => {
    setFilterSprintId(e.target.value);
  };
  
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
      
      const projectName = filterProjectId === 'all' ? 'All Projects' : projects?.find(p => p.id.toString() === filterProjectId)?.name || 'Unknown';
      pdf.text(`Project: ${projectName}`, 40, 140);
      
      const sprintName = filterSprintId === 'all' ? 'All Sprints' : sprints?.find(s => s.id.toString() === filterSprintId)?.name || 'Unknown';
      pdf.text(`Sprint: ${sprintName}`, 40, 160);
      
      // Set initial y position
      let yPosition = 180;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      
      // Process each section individually
      const sections = dashboardRef.current.querySelectorAll('.bg-white');
      
      // Create an array to store each section image
      const sectionImages = [];
      
      // Capture each section individually
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const canvas = await html2canvas(section, { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: section.offsetWidth,
          height: section.offsetHeight
        });
        sectionImages.push({
          dataUrl: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height
        });
      }
      
      // Add sections to PDF
      for (let i = 0; i < sectionImages.length; i++) {
        const img = sectionImages[i];
        const imgWidth = contentWidth;
        const imgHeight = (img.height * imgWidth) / img.width;
        
        // Check if we need to add a new page
        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Add image
        pdf.addImage(img.dataUrl, 'PNG', margin, yPosition, imgWidth, imgHeight);
        
        // Update position for next section
        yPosition += imgHeight + 20;
      }
      
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={filterProjectId}
              onChange={handleProjectChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="all">All Projects</option>
              {projects && projects.map(project => (
                <option key={project.id} value={project.id.toString()}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sprint</label>
            <select
              value={filterSprintId}
              onChange={handleSprintChange}
              className="w-full border border-gray-300 rounded-md p-2"
              disabled={filterProjectId === 'all'}
            >
              <option value="all">All Sprints</option>
              {sprints && sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id.toString()}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div ref={dashboardRef} className="space-y-6">
        <ExecutiveOverview 
          filterStatus={filterStatusDashboard} 
          filterPriority={filterPriorityDashboard}
          filterDateRange={filterDateRange}
          filterProjectId={filterProjectId}
          filterSprintId={filterSprintId}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectsOverview 
            filterStatus={filterStatusDashboard} 
            filterPriority={filterPriorityDashboard}
            filterDateRange={filterDateRange}
            filterProjectId={filterProjectId}
            filterSprintId={filterSprintId}
          />
          <SprintPerformance 
            filterStatus={filterStatusDashboard} 
            filterPriority={filterPriorityDashboard}
            filterDateRange={filterDateRange}
            filterProjectId={filterProjectId}
            filterSprintId={filterSprintId}
          />
        </div>
        
        <TasksOverview 
          filterStatus={filterStatusDashboard} 
          filterPriority={filterPriorityDashboard}
          filterDateRange={filterDateRange}
          filterProjectId={filterProjectId}
          filterSprintId={filterSprintId}
        />
      </div>
    </div>
  );
};

export default Dashboard;