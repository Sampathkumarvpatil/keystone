import Dexie from 'dexie';

const db = new Dexie('engineeringDirectorDB');

// Database schema
db.version(1).stores({
  projects: '++id, name, status, priority, startDate, endDate, createdAt',
  sprints: '++id, projectId, name, startDate, endDate, status, committedPoints, acceptedPoints, addedPoints, descopedPoints',
  tasks: '++id, sprintId, projectId, title, description, status, priority, severity, assignee, estimatedHours, actualHours, createdAt',
  bugs: '++id, taskId, sprintId, projectId, title, description, status, priority, severity, assignee, estimatedHours, actualHours, createdAt',
  timeEntries: '++id, taskId, sprintId, projectId, date, hours, description, createdAt',
  team: '++id, name, role, capacity'
});

// Project statuses and priorities
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

// Sprint statuses
export const SPRINT_STATUS = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  COMPLETED: 'Completed'
};

// Task statuses
export const TASK_STATUS = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  TESTING: 'Testing',
  DONE: 'Done'
};

// Bug severities
export const BUG_SEVERITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Sample data generation to populate the app initially
export async function populateSampleData() {
  try {
    // Check if data already exists
    const projectCount = await db.projects.count();
    if (projectCount > 0) return;

    // Create sample projects
    const projectIds = await Promise.all([
      db.projects.add({
        name: 'Cloud Migration',
        status: PROJECT_STATUS.IN_PROGRESS,
        priority: PROJECT_PRIORITY.HIGH,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-06-30'),
        createdAt: new Date()
      }),
      db.projects.add({
        name: 'Mobile App Refactor',
        status: PROJECT_STATUS.IN_PROGRESS,
        priority: PROJECT_PRIORITY.CRITICAL,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-04-30'),
        createdAt: new Date()
      }),
      db.projects.add({
        name: 'API Platform',
        status: PROJECT_STATUS.NOT_STARTED,
        priority: PROJECT_PRIORITY.MEDIUM,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-08-31'),
        createdAt: new Date()
      }),
      db.projects.add({
        name: 'DevOps Automation',
        status: PROJECT_STATUS.IN_PROGRESS,
        priority: PROJECT_PRIORITY.HIGH,
        startDate: new Date('2025-01-10'),
        endDate: new Date('2025-05-15'),
        createdAt: new Date()
      }),
      db.projects.add({
        name: 'Security Compliance',
        status: PROJECT_STATUS.ON_HOLD,
        priority: PROJECT_PRIORITY.CRITICAL,
        startDate: new Date('2025-02-15'),
        endDate: new Date('2025-04-15'),
        createdAt: new Date()
      }),
      db.projects.add({
        name: 'Data Lake Implementation',
        status: PROJECT_STATUS.COMPLETED,
        priority: PROJECT_PRIORITY.MEDIUM,
        startDate: new Date('2024-11-01'),
        endDate: new Date('2025-02-28'),
        createdAt: new Date()
      })
    ]);
    
    // Add more sample data here for sprints, team members, tasks, etc.

  } catch (error) {
    console.error('Error populating sample data:', error);
    throw error;
  }
}

export default db;
