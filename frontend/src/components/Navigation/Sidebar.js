import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon,
  TagIcon,
  UserGroupIcon,
  ClockIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'Projects', icon: ChartBarIcon, path: '/projects' },
    { name: 'Sprints', icon: ClipboardDocumentListIcon, path: '/sprints' },
    { name: 'Tasks & Bugs', icon: TagIcon, path: '/tasks' },
    { name: 'Team', icon: UserGroupIcon, path: '/team' },
    { name: 'Time Tracking', icon: ClockIcon, path: '/time' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <div className="h-screen w-64 bg-gray-800 text-white fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white">Engineering Director</h1>
        <p className="text-gray-400 text-sm">Project Tracking</p>
      </div>
      
      <nav className="mt-8">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-2">
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                  location.pathname === item.path ? 'bg-gray-700 text-white border-l-4 border-purple-500' : ''
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 bg-gray-900">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
            <span className="text-white font-bold">ED</span>
          </div>
          <div className="ml-3">
            <p className="text-white font-medium">Engineering Director</p>
            <p className="text-gray-400 text-xs">March 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
