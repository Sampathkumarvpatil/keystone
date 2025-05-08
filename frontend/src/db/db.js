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

    // Create sample sprints
    const sprintIds = await Promise.all([
    db.sprints.add({
      projectId: projectIds[0],
      name: 'Sprint 1',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-28'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 45,
      acceptedPoints: 42,
      addedPoints: 5,
      descopedPoints: 8
    }),
    db.sprints.add({
      projectId: projectIds[0],
      name: 'Sprint 2',
      startDate: new Date('2025-01-29'),
      endDate: new Date('2025-02-11'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 48,
      acceptedPoints: 45,
      addedPoints: 3,
      descopedPoints: 6
    }),
    db.sprints.add({
      projectId: projectIds[0],
      name: 'Sprint 3',
      startDate: new Date('2025-02-12'),
      endDate: new Date('2025-02-25'),
      status: SPRINT_STATUS.ACTIVE,
      committedPoints: 50,
      acceptedPoints: 25,
      addedPoints: 8,
      descopedPoints: 0
    }),
    db.sprints.add({
      projectId: projectIds[1],
      name: 'Sprint 1',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-02-14'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 40,
      acceptedPoints: 38,
      addedPoints: 0,
      descopedPoints: 2
    }),
    db.sprints.add({
      projectId: projectIds[1],
      name: 'Sprint 2',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-28'),
      status: SPRINT_STATUS.COMPLETED,
      committedPoints: 42,
      acceptedPoints: 40,
      addedPoints: 4,
      descopedPoints: 6
    }),
    db.sprints.add({
      projectId: projectIds[1],
      name: 'Sprint 3',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-14'),
      status: SPRINT_STATUS.ACTIVE,
      committedPoints: 45,
      acceptedPoints: 20,
      addedPoints: 0,
      descopedPoints: 0
    })
  ]);

  // Create sample tasks
  await Promise.all([
    db.tasks.add({
      sprintId: sprintIds[2],
      projectId: projectIds[0],
      title: 'Set up cloud infrastructure',
      description: 'Create AWS account and set up initial infrastructure',
      status: TASK_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.HIGH,
      severity: BUG_SEVERITY.MEDIUM,
      assignee: 'John Doe',
      estimatedHours: 12,
      actualHours: 8,
      createdAt: new Date()
    }),
    db.tasks.add({
      sprintId: sprintIds[2],
      projectId: projectIds[0],
      title: 'Migrate database',
      description: 'Migrate existing database to cloud',
      status: TASK_STATUS.NEW,
      priority: PROJECT_PRIORITY.HIGH,
      severity: BUG_SEVERITY.MEDIUM,
      assignee: 'Jane Smith',
      estimatedHours: 24,
      actualHours: 0,
      createdAt: new Date()
    }),
    db.tasks.add({
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      title: 'Refactor authentication module',
      description: 'Improve authentication flow and security',
      status: TASK_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.CRITICAL,
      severity: BUG_SEVERITY.HIGH,
      assignee: 'Mike Johnson',
      estimatedHours: 16,
      actualHours: 12,
      createdAt: new Date()
    }),
    db.tasks.add({
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      title: 'Implement push notifications',
      description: 'Add support for push notifications',
      status: TASK_STATUS.TESTING,
      priority: PROJECT_PRIORITY.MEDIUM,
      severity: BUG_SEVERITY.MEDIUM,
      assignee: 'Sarah Williams',
      estimatedHours: 8,
      actualHours: 10,
      createdAt: new Date()
    })
  ]);

  // Create sample bugs
  await Promise.all([
    db.bugs.add({
      taskId: 1,
      sprintId: sprintIds[2],
      projectId: projectIds[0],
      title: 'IAM permissions issue',
      description: 'Insufficient permissions for S3 bucket access',
      status: TASK_STATUS.IN_PROGRESS,
      priority: PROJECT_PRIORITY.HIGH,
      severity: BUG_SEVERITY.HIGH,
      assignee: 'John Doe',
      estimatedHours: 4,
      actualHours: 2,
      createdAt: new Date()
    }),
    db.bugs.add({
      taskId: 3,
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      title: 'Login failure on Android',
      description: 'Authentication fails on specific Android devices',
      status: TASK_STATUS.NEW,
      priority: PROJECT_PRIORITY.CRITICAL,
      severity: BUG_SEVERITY.CRITICAL,
      assignee: 'Mike Johnson',
      estimatedHours: 8,
      actualHours: 0,
      createdAt: new Date()
    })
  ]);

  // Create sample team members
  await Promise.all([
    db.team.add({
      name: 'John Doe',
      role: 'Senior Backend Developer',
      capacity: 40
    }),
    db.team.add({
      name: 'Jane Smith',
      role: 'DevOps Engineer',
      capacity: 40
    }),
    db.team.add({
      name: 'Mike Johnson',
      role: 'Mobile Developer',
      capacity: 40
    }),
    db.team.add({
      name: 'Sarah Williams',
      role: 'Frontend Developer',
      capacity: 40
    })
  ]);

  // Create sample time entries
  await Promise.all([
    db.timeEntries.add({
      taskId: 1,
      sprintId: sprintIds[2],
      projectId: projectIds[0],
      date: new Date('2025-02-12'),
      hours: 4,
      description: 'Initial setup of AWS resources',
      createdAt: new Date()
    }),
    db.timeEntries.add({
      taskId: 1,
      sprintId: sprintIds[2],
      projectId: projectIds[0],
      date: new Date('2025-02-13'),
      hours: 4,
      description: 'Configuration of security groups and IAM roles',
      createdAt: new Date()
    }),
    db.timeEntries.add({
      taskId: 3,
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      date: new Date('2025-03-01'),
      hours: 6,
      description: 'Refactoring authentication service',
      createdAt: new Date()
    }),
    db.timeEntries.add({
      taskId: 3,
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      date: new Date('2025-03-02'),
      hours: 6,
      description: 'Implementing token refresh flow',
      createdAt: new Date()
    }),
    db.timeEntries.add({
      taskId: 4,
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      date: new Date('2025-03-03'),
      hours: 5,
      description: 'Setting up notification service',
      createdAt: new Date()
    }),
    db.timeEntries.add({
      taskId: 4,
      sprintId: sprintIds[5],
      projectId: projectIds[1],
      date: new Date('2025-03-04'),
      hours: 5,
      description: 'Testing notifications on different devices',
      createdAt: new Date()
    })
  ]);
}

export default db;
