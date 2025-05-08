import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { to: '/projects', label: 'Projects', icon: 'fas fa-project-diagram' },
    { to: '/sprints', label: 'Sprints', icon: 'fas fa-running' },
    { to: '/tasks', label: 'Tasks & Bugs', icon: 'fas fa-tasks' },
    { to: '/team', label: 'Team', icon: 'fas fa-users' },
    { to: '/time', label: 'Time Tracking', icon: 'fas fa-clock' },
    { to: '/settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <div className="bg-purple-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <div className="text-center">
        <h2 className="text-xl font-bold">Engineering Director</h2>
        <p className="text-sm text-purple-200">Project Tracking Tool</p>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center py-2.5 px-4 rounded transition duration-200 hover:bg-purple-700 ${
                isActive ? 'bg-purple-900' : ''
              }`
            }
          >
            <i className={`${item.icon} w-6`}></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;