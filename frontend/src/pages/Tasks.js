import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { TASK_STATUS, PROJECT_PRIORITY, BUG_SEVERITY } from '../db/db';

const Tasks = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isBugFormOpen, setIsBugFormOpen] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    projectId: '',
    sprintId: '',
    title: '',
    description: '',
    status: TASK_STATUS.NEW,
    priority: PROJECT_PRIORITY.MEDIUM,
    severity: BUG_SEVERITY.MEDIUM,
    assignee: '',
    estimatedHours: 0
  });
  const [bugFormData, setBugFormData] = useState({
    taskId: '',
    projectId: '',
    sprintId: '',
    title: '',
    description: '',
    status: TASK_STATUS.NEW,
    priority: PROJECT_PRIORITY.MEDIUM,
    severity: BUG_SEVERITY.MEDIUM,
    assignee: '',
    estimatedHours: 0
  });
  const [isTaskEditing, setIsTaskEditing] = useState(false);
  const [isBugEditing, setIsBugEditing] = useState(false);
  
  // Filter states
  const [taskFilters, setTaskFilters] = useState({
    projectId: 'all',
    sprintId: 'all',
    status: 'all',
    priority: 'all',
    assignee: 'all'
  });
  
  const [bugFilters, setBugFilters] = useState({
    projectId: 'all',
    sprintId: 'all',
    status: 'all',
    priority: 'all',
    severity: 'all',
    assignee: 'all'
  });

  const projects = useLiveQuery(() => db.projects.toArray());
  const sprints = useLiveQuery(() => db.sprints.toArray());
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const bugs = useLiveQuery(() => db.bugs.toArray());
  const team = useLiveQuery(() => db.team.toArray());
  
  // Filtered tasks and bugs
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  
  // Apply task filters
  useEffect(() => {
    if (!tasks) {
      setFilteredTasks([]);
      return;
    }
    
    let filtered = [...tasks];
    
    if (taskFilters.projectId !== 'all') {
      filtered = filtered.filter(task => task.projectId === parseInt(taskFilters.projectId));
    }
    
    if (taskFilters.sprintId !== 'all') {
      filtered = filtered.filter(task => task.sprintId === parseInt(taskFilters.sprintId));
    }
    
    if (taskFilters.status !== 'all') {
      filtered = filtered.filter(task => task.status === taskFilters.status);
    }
    
    if (taskFilters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === taskFilters.priority);
    }
    
    if (taskFilters.assignee !== 'all') {
      filtered = filtered.filter(task => task.assignee === taskFilters.assignee);
    }
    
    setFilteredTasks(filtered);
  }, [tasks, taskFilters]);
  
  // Apply bug filters
  useEffect(() => {
    if (!bugs) {
      setFilteredBugs([]);
      return;
    }
    
    let filtered = [...bugs];
    
    if (bugFilters.projectId !== 'all') {
      filtered = filtered.filter(bug => bug.projectId === parseInt(bugFilters.projectId));
    }
    
    if (bugFilters.sprintId !== 'all') {
      filtered = filtered.filter(bug => bug.sprintId === parseInt(bugFilters.sprintId));
    }
    
    if (bugFilters.status !== 'all') {
      filtered = filtered.filter(bug => bug.status === bugFilters.status);
    }
    
    if (bugFilters.priority !== 'all') {
      filtered = filtered.filter(bug => bug.priority === bugFilters.priority);
    }
    
    if (bugFilters.severity !== 'all') {
      filtered = filtered.filter(bug => bug.severity === bugFilters.severity);
    }
    
    if (bugFilters.assignee !== 'all') {
      filtered = filtered.filter(bug => bug.assignee === bugFilters.assignee);
    }
    
    setFilteredBugs(filtered);
  }, [bugs, bugFilters]);

  // Handle task form input changes
  const handleTaskInputChange = (e) => {
    const { name, value } = e.target;
    setTaskFormData({
      ...taskFormData,
      [name]: name === 'estimatedHours' ? parseFloat(value) : value,
    });
  };

  // Handle bug form input changes
  const handleBugInputChange = (e) => {
    const { name, value } = e.target;
    setBugFormData({
      ...bugFormData,
      [name]: name === 'estimatedHours' ? parseFloat(value) : value,
    });
  };
  
  // Handle task filter changes
  const handleTaskFilterChange = (e) => {
    const { name, value } = e.target;
    setTaskFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If project filter changed, reset sprint filter if the sprint doesn't belong to the selected project
    if (name === 'projectId' && value !== 'all') {
      const projectSprints = sprints ? sprints.filter(s => s.projectId === parseInt(value)) : [];
      const sprintIds = projectSprints.map(s => s.id);
      
      if (taskFilters.sprintId !== 'all' && !sprintIds.includes(parseInt(taskFilters.sprintId))) {
        setTaskFilters(prev => ({
          ...prev,
          sprintId: 'all'
        }));
      }
    }
  };
  
  // Handle bug filter changes
  const handleBugFilterChange = (e) => {
    const { name, value } = e.target;
    setBugFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If project filter changed, reset sprint filter if the sprint doesn't belong to the selected project
    if (name === 'projectId' && value !== 'all') {
      const projectSprints = sprints ? sprints.filter(s => s.projectId === parseInt(value)) : [];
      const sprintIds = projectSprints.map(s => s.id);
      
      if (bugFilters.sprintId !== 'all' && !sprintIds.includes(parseInt(bugFilters.sprintId))) {
        setBugFilters(prev => ({
          ...prev,
          sprintId: 'all'
        }));
      }
    }
  };

  // Handle task form submission
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isTaskEditing) {
        // Update existing task
        const updatedTask = {
          ...taskFormData,
          projectId: parseInt(taskFormData.projectId),
          sprintId: parseInt(taskFormData.sprintId),
          updatedAt: new Date()
        };
        
        await db.tasks.update(taskFormData.id, updatedTask);
      } else {
        // Add new task
        const newTask = {
          ...taskFormData,
          projectId: parseInt(taskFormData.projectId),
          sprintId: parseInt(taskFormData.sprintId),
          actualHours: 0,
          createdAt: new Date()
        };
        
        await db.tasks.add(newTask);
      }
      
      // Reset form
      setTaskFormData({
        projectId: '',
        sprintId: '',
        title: '',
        description: '',
        status: TASK_STATUS.NEW,
        priority: PROJECT_PRIORITY.MEDIUM,
        severity: BUG_SEVERITY.MEDIUM,
        assignee: '',
        estimatedHours: 0
      });
      setIsTaskEditing(false);
      setIsTaskFormOpen(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  // Handle bug form submission
  const handleBugSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isBugEditing) {
        // Update existing bug
        const updatedBug = {
          ...bugFormData,
          projectId: parseInt(bugFormData.projectId),
          sprintId: parseInt(bugFormData.sprintId),
          taskId: bugFormData.taskId ? parseInt(bugFormData.taskId) : null,
          updatedAt: new Date()
        };
        
        await db.bugs.update(bugFormData.id, updatedBug);
      } else {
        // Add new bug
        const newBug = {
          ...bugFormData,
          projectId: parseInt(bugFormData.projectId),
          sprintId: parseInt(bugFormData.sprintId),
          taskId: bugFormData.taskId ? parseInt(bugFormData.taskId) : null,
          actualHours: 0,
          createdAt: new Date()
        };
        
        await db.bugs.add(newBug);
      }
      
      // Reset form
      setBugFormData({
        taskId: '',
        projectId: '',
        sprintId: '',
        title: '',
        description: '',
        status: TASK_STATUS.NEW,
        priority: PROJECT_PRIORITY.MEDIUM,
        severity: BUG_SEVERITY.MEDIUM,
        assignee: '',
        estimatedHours: 0
      });
      setIsBugEditing(false);
      setIsBugFormOpen(false);
    } catch (error) {
      console.error('Error saving bug:', error);
      alert('Failed to save bug. Please try again.');
    }
  };
  
  // Handle edit task
  const handleEditTask = (task) => {
    setTaskFormData({
      id: task.id,
      projectId: task.projectId.toString(),
      sprintId: task.sprintId.toString(),
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      estimatedHours: task.estimatedHours
    });
    setIsTaskEditing(true);
    setIsTaskFormOpen(true);
  };
  
  // Handle edit bug
  const handleEditBug = (bug) => {
    setBugFormData({
      id: bug.id,
      taskId: bug.taskId ? bug.taskId.toString() : '',
      projectId: bug.projectId.toString(),
      sprintId: bug.sprintId.toString(),
      title: bug.title,
      description: bug.description || '',
      status: bug.status,
      priority: bug.priority,
      severity: bug.severity,
      assignee: bug.assignee,
      estimatedHours: bug.estimatedHours
    });
    setIsBugEditing(true);
    setIsBugFormOpen(true);
  };

  // Get sprint options for the selected project
  const getSprintOptions = (projectId) => {
    if (!sprints || !projectId) return [];
    return sprints.filter(s => s.projectId === parseInt(projectId));
  };

  // Get task options for the selected project and sprint
  const getTaskOptions = (projectId, sprintId) => {
    if (!tasks || !projectId || !sprintId) return [];
    return tasks.filter(t => t.projectId === parseInt(projectId) && t.sprintId === parseInt(sprintId));
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case TASK_STATUS.NEW:
        return 'bg-gray-100 text-gray-800';
      case TASK_STATUS.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TASK_STATUS.TESTING:
        return 'bg-yellow-100 text-yellow-800';
      case TASK_STATUS.DONE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case PROJECT_PRIORITY.LOW:
        return 'bg-gray-100 text-gray-800';
      case PROJECT_PRIORITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case PROJECT_PRIORITY.HIGH:
        return 'bg-yellow-100 text-yellow-800';
      case PROJECT_PRIORITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case BUG_SEVERITY.LOW:
        return 'bg-gray-100 text-gray-800';
      case BUG_SEVERITY.MEDIUM:
        return 'bg-blue-100 text-blue-800';
      case BUG_SEVERITY.HIGH:
        return 'bg-yellow-100 text-yellow-800';
      case BUG_SEVERITY.CRITICAL:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get project name by id
  const getProjectName = (projectId) => {
    if (!projects) return 'Unknown Project';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Get sprint name by id
  const getSprintName = (sprintId) => {
    if (!sprints) return 'Unknown Sprint';
    const sprint = sprints.find(s => s.id === sprintId);
    return sprint ? sprint.name : 'Unknown Sprint';
  };

  // Get task name by id
  const getTaskName = (taskId) => {
    if (!tasks || !taskId) return 'No Linked Task';
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Tasks & Bugs</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setIsTaskFormOpen(true);
              setIsBugFormOpen(false);
              setIsTaskEditing(false);
              setTaskFormData({
                projectId: '',
                sprintId: '',
                title: '',
                description: '',
                status: TASK_STATUS.NEW,
                priority: PROJECT_PRIORITY.MEDIUM,
                assignee: '',
                estimatedHours: 0
              });
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Create Task
          </button>
          <button
            onClick={() => {
              setIsBugFormOpen(true);
              setIsTaskFormOpen(false);
              setIsBugEditing(false);
              setBugFormData({
                taskId: '',
                projectId: '',
                sprintId: '',
                title: '',
                description: '',
                status: TASK_STATUS.NEW,
                priority: PROJECT_PRIORITY.MEDIUM,
                severity: BUG_SEVERITY.MEDIUM,
                assignee: '',
                estimatedHours: 0
              });
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-md"
          >
            Report Bug
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'tasks' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === 'bugs' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('bugs')}
          >
            Bugs
          </button>
        </div>
      </div>

      {/* Task Form */}
      {isTaskFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isTaskEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
          <form onSubmit={handleTaskSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Project</label>
                <select
                  name="projectId"
                  value={taskFormData.projectId}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Project</option>
                  {projects && projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Sprint</label>
                <select
                  name="sprintId"
                  value={taskFormData.sprintId}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!taskFormData.projectId}
                >
                  <option value="">Select Sprint</option>
                  {getSprintOptions(taskFormData.projectId).map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskFormData.title}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={taskFormData.description}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={taskFormData.status}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(TASK_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={taskFormData.priority}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(PROJECT_PRIORITY).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Assignee</label>
                <select
                  name="assignee"
                  value={taskFormData.assignee}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Assignee</option>
                  {team && team.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={taskFormData.estimatedHours}
                  onChange={handleTaskInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTaskFormOpen(false)}
                className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                {isTaskEditing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bug Form */}
      {isBugFormOpen && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {isBugEditing ? 'Edit Bug' : 'Report Bug'}
          </h2>
          <form onSubmit={handleBugSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Project</label>
                <select
                  name="projectId"
                  value={bugFormData.projectId}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Project</option>
                  {projects && projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Sprint</label>
                <select
                  name="sprintId"
                  value={bugFormData.sprintId}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  disabled={!bugFormData.projectId}
                >
                  <option value="">Select Sprint</option>
                  {getSprintOptions(bugFormData.projectId).map(sprint => (
                    <option key={sprint.id} value={sprint.id}>
                      {sprint.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Related Task (Optional)</label>
                <select
                  name="taskId"
                  value={bugFormData.taskId}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={!bugFormData.projectId || !bugFormData.sprintId}
                >
                  <option value="">No Related Task</option>
                  {getTaskOptions(bugFormData.projectId, bugFormData.sprintId).map(task => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Bug Title</label>
                <input
                  type="text"
                  name="title"
                  value={bugFormData.title}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={bugFormData.description}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                ></textarea>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={bugFormData.status}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(TASK_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Priority</label>
                <select
                  name="priority"
                  value={bugFormData.priority}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(PROJECT_PRIORITY).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Severity</label>
                <select
                  name="severity"
                  value={bugFormData.severity}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {Object.values(BUG_SEVERITY).map(severity => (
                    <option key={severity} value={severity}>{severity}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Assignee</label>
                <select
                  name="assignee"
                  value={bugFormData.assignee}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select Assignee</option>
                  {team && team.map(member => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.role}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Estimated Hours</label>
                <input
                  type="number"
                  name="estimatedHours"
                  value={bugFormData.estimatedHours}
                  onChange={handleBugInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsBugFormOpen(false)}
                className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {isBugEditing ? 'Update Bug' : 'Report Bug'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {activeTab === 'tasks' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Tasks</h2>
          
          {/* Task Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Project</label>
              <select
                name="projectId"
                value={taskFilters.projectId}
                onChange={handleTaskFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Projects</option>
                {projects && projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Sprint</label>
              <select
                name="sprintId"
                value={taskFilters.sprintId}
                onChange={handleTaskFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Sprints</option>
                {taskFilters.projectId === 'all'
                  ? sprints && sprints.map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))
                  : getSprintOptions(taskFilters.projectId).map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Status</label>
              <select
                name="status"
                value={taskFilters.status}
                onChange={handleTaskFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.values(TASK_STATUS).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Priority</label>
              <select
                name="priority"
                value={taskFilters.priority}
                onChange={handleTaskFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Priorities</option>
                {Object.values(PROJECT_PRIORITY).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Assignee</label>
              <select
                name="assignee"
                value={taskFilters.assignee}
                onChange={handleTaskFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Assignees</option>
                {team && team.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project / Sprint
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Hours
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks && filteredTasks.length > 0 ? (
                  filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {task.title}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <div>
                          {getProjectName(task.projectId)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getSprintName(task.sprintId)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {task.assignee}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {task.estimatedHours} hrs
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditTask(task)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                      No tasks found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bugs List */}
      {activeTab === 'bugs' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">All Bugs</h2>
          
          {/* Bug Filters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Project</label>
              <select
                name="projectId"
                value={bugFilters.projectId}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Projects</option>
                {projects && projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Sprint</label>
              <select
                name="sprintId"
                value={bugFilters.sprintId}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Sprints</option>
                {bugFilters.projectId === 'all'
                  ? sprints && sprints.map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))
                  : getSprintOptions(bugFilters.projectId).map(sprint => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Status</label>
              <select
                name="status"
                value={bugFilters.status}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.values(TASK_STATUS).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Priority</label>
              <select
                name="priority"
                value={bugFilters.priority}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Priorities</option>
                {Object.values(PROJECT_PRIORITY).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Severity</label>
              <select
                name="severity"
                value={bugFilters.severity}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Severities</option>
                {Object.values(BUG_SEVERITY).map(severity => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-sm">Assignee</label>
              <select
                name="assignee"
                value={bugFilters.assignee}
                onChange={handleBugFilterChange}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">All Assignees</option>
                {team && team.map(member => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project / Sprint
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Related Task
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBugs && filteredBugs.length > 0 ? (
                  filteredBugs.map(bug => (
                    <tr key={bug.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm font-medium text-gray-900">
                        {bug.title}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <div>
                          {getProjectName(bug.projectId)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {getSprintName(bug.sprintId)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {getTaskName(bug.taskId)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bug.status)}`}>
                          {bug.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(bug.priority)}`}>
                          {bug.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(bug.severity)}`}>
                          {bug.severity}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        {bug.assignee}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-500">
                        <button 
                          onClick={() => handleEditBug(bug)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">View</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-4 px-4 text-center text-gray-500">
                      No bugs found matching the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;