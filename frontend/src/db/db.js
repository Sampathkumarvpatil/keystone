// db.js - Local database using Dexie (IndexedDB wrapper)
import Dexie from 'dexie';

// Create and configure database
const db = new Dexie('agileTrackerDB');

// Define schemas for database tables
db.version(1).stores({
  projects: '++id, name, status, priority, startDate, endDate, createdAt, updatedAt',
  sprints: '++id, projectId, name, startDate, endDate, status, committedPoints, acceptedPoints, addedPoints, descopedPoints, createdAt, updatedAt',
  tasks: '++id, projectId, sprintId, title, description, status, priority, assigneeId, estimatedHours, actualHours, createdAt, updatedAt',
  bugs: '++id, taskId, projectId, sprintId, title, description, status, priority, severity, assigneeId, estimatedHours, actualHours, createdAt, updatedAt',
  teamMembers: '++id, name, role, capacity, avatar, createdAt, updatedAt',
  team: '++id, name, role, capacity, avatar, createdAt, updatedAt', // Duplicate of teamMembers for backward compatibility
});

// Define constants for status, priority, etc.
export const PROJECT_STATUS = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
};

export const PROJECT_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

export const SPRINT_STATUS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  COMPLETED: 'Completed'
};

export const TASK_STATUS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  TESTING: 'Testing',
  DONE: 'Done'
};

export const BUG_SEVERITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Helper function to populate sample data
export const populateSampleData = async () => {
  // Only populate if database is empty
  const projectCount = await db.projects.count();
  if (projectCount > 0) return;

  // Sample projects
  const projectIds = await db.projects.bulkAdd([
    {
      name: 'Website Redesign',
      status: PROJECT_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.HIGH,
      startDate: new Date('2023-01-10'),
      endDate: new Date('2023-06-30'),
      createdAt: new Date()
    },
    {
      name: 'Mobile App Development',
      status: PROJECT_STATUS.NOT_STARTED,
      priority: PROJECT_PRIORITY.CRITICAL,
      startDate: new Date('2023-03-15'),
      endDate: new Date('2023-09-01'),
      createdAt: new Date()
    },
    {
      name: 'Data Migration Project',
      status: PROJECT_STATUS.ON_HOLD,
      priority: PROJECT_PRIORITY.MEDIUM,
      startDate: new Date('2023-02-01'),
      endDate: new Date('2023-04-15'),
      createdAt: new Date()
    }
  ], { allKeys: true });

  // Sample team members
  const teamMemberIds = await db.teamMembers.bulkAdd([
    {
      name: 'Jane Smith',
      role: 'Frontend Developer',
      capacity: 40,
      avatar: '',
      createdAt: new Date()
    },
    {
      name: 'John Doe',
      role: 'Backend Developer',
      capacity: 35,
      avatar: '',
      createdAt: new Date()
    },
    {
      name: 'Alex Johnson',
      role: 'UX Designer',
      capacity: 30,
      avatar: '',
      createdAt: new Date()
    },
    {
      name: 'Maria Garcia',
      role: 'Project Manager',
      capacity: 40,
      avatar: '',
      createdAt: new Date()
    }
  ], { allKeys: true });

  // Duplicate team members to team table for backward compatibility
  await db.teamMembers.toArray().then(members => {
    db.team.bulkAdd(members);
  });

  // Sample sprints for the first project
  const sprintIds = await db.sprints.bulkAdd([
    {
      projectId: projectIds[0],
      name: 'Sprint 1',
      startDate: new Date('2023-01-10'),
      endDate: new Date('2023-01-24'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 40,
      acceptedPoints: 35,
      addedPoints: 5,
      descopedPoints: 2,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      name: 'Sprint 2',
      startDate: new Date('2023-01-25'),
      endDate: new Date('2023-02-08'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 45,
      acceptedPoints: 42,
      addedPoints: 3,
      descopedPoints: 1,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      name: 'Sprint 3',
      startDate: new Date('2023-02-09'),
      endDate: new Date('2023-02-23'),
      status: SPRINT_STATUS.ACTIVE,
      committedPoints: 50,
      acceptedPoints: 20,
      addedPoints: 7,
      descopedPoints: 0,
      createdAt: new Date()
    },
    {
      projectId: projectIds[1],
      name: 'Planning Sprint',
      startDate: new Date('2023-03-15'),
      endDate: new Date('2023-03-29'),
      status: SPRINT_STATUS.PLANNING,
      committedPoints: 35,
      acceptedPoints: 0,
      addedPoints: 0,
      descopedPoints: 0,
      createdAt: new Date()
    }
  ], { allKeys: true });

  // Sample tasks for different sprints
  await db.tasks.bulkAdd([
    {
      projectId: projectIds[0],
      sprintId: sprintIds[0],
      title: 'Design homepage wireframes',
      description: 'Create wireframes for the new homepage design',
      status: TASK_STATUS.DONE,
      priority: PROJECT_PRIORITY.HIGH,
      assignee: 'Alex Johnson',
      assigneeId: teamMemberIds[2],
      estimatedHours: 8,
      actualHours: 10,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      sprintId: sprintIds[0],
      title: 'Implement navigation menu',
      description: 'Develop the new responsive navigation menu',
      status: TASK_STATUS.DONE,
      priority: PROJECT_PRIORITY.MEDIUM,
      assignee: 'Jane Smith',
      assigneeId: teamMemberIds[0],
      estimatedHours: 6,
      actualHours: 5,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      sprintId: sprintIds[1],
      title: 'Optimize images',
      description: 'Compress and optimize all website images',
      status: TASK_STATUS.DONE,
      priority: PROJECT_PRIORITY.LOW,
      assignee: 'Jane Smith',
      assigneeId: teamMemberIds[0],
      estimatedHours: 4,
      actualHours: 3,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      sprintId: sprintIds[1],
      title: 'Implement authentication',
      description: 'Set up user authentication system',
      status: TASK_STATUS.DONE,
      priority: PROJECT_PRIORITY.HIGH,
      assignee: 'John Doe',
      assigneeId: teamMemberIds[1],
      estimatedHours: 12,
      actualHours: 14,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      sprintId: sprintIds[2],
      title: 'Create user profiles',
      description: 'Design and implement user profile pages',
      status: TASK_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.MEDIUM,
      assignee: 'Jane Smith',
      assigneeId: teamMemberIds[0],
      estimatedHours: 10,
      actualHours: 5,
      createdAt: new Date()
    },
    {
      projectId: projectIds[0],
      sprintId: sprintIds[2],
      title: 'Implement search functionality',
      description: 'Add search feature to the website',
      status: TASK_STATUS.NEW,
      priority: PROJECT_PRIORITY.MEDIUM,
      assignee: 'John Doe',
      assigneeId: teamMemberIds[1],
      estimatedHours: 8,
      actualHours: 0,
      createdAt: new Date()
    }
  ]);

  // Sample bugs
  await db.bugs.bulkAdd([
    {
      taskId: 1,
      projectId: projectIds[0],
      sprintId: sprintIds[0],
      title: 'Navigation breaks on mobile',
      description: 'The navigation menu is not responding correctly on mobile devices',
      status: TASK_STATUS.DONE,
      priority: PROJECT_PRIORITY.HIGH,
      severity: BUG_SEVERITY.HIGH,
      assignee: 'Jane Smith',
      assigneeId: teamMemberIds[0],
      estimatedHours: 3,
      actualHours: 2,
      createdAt: new Date()
    },
    {
      taskId: 4,
      projectId: projectIds[0],
      sprintId: sprintIds[1],
      title: 'Login fails with special characters',
      description: 'Users cannot log in when their password contains certain special characters',
      status: TASK_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.CRITICAL,
      severity: BUG_SEVERITY.CRITICAL,
      assignee: 'John Doe',
      assigneeId: teamMemberIds[1],
      estimatedHours: 5,
      actualHours: 3,
      createdAt: new Date()
    },
    {
      taskId: null,
      projectId: projectIds[0],
      sprintId: sprintIds[2],
      title: 'Incorrect form validation',
      description: 'Contact form allows submission with invalid email format',
      status: TASK_STATUS.NEW,
      priority: PROJECT_PRIORITY.MEDIUM,
      severity: BUG_SEVERITY.MEDIUM,
      assignee: 'Jane Smith',
      assigneeId: teamMemberIds[0],
      estimatedHours: 2,
      actualHours: 0,
      createdAt: new Date()
    }
  ]);
};

export default db;