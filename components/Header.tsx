import React, { useState, useRef, useEffect } from 'react';
import type { ViewType } from '../app/page';
import { SearchIcon, MenuIcon, LogoutIcon } from './Icons';

interface User {
  name: string;
  email: string;
  picture: string;
}

interface HeaderProps {
  currentView: ViewType;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  user: User;
  onSignOut: () => void;
  setActiveView: (view: ViewType) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, toggleSidebar, user, onSignOut, setActiveView }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-20 bg-white border-b border-gray-200 px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-gray-100 lg:hidden transition-colors">
          <MenuIcon className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {currentView}
        </h1>
      </div>
      <div className="flex items-center space-x-3 md:space-x-4">
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(p => !p)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <img src={user.picture} alt="User" className="w-10 h-10 rounded-full ring-2 ring-gray-200 group-hover:ring-indigo-300 transition-all" />
            <span className="hidden sm:inline font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{user.name.split(' ')[0]}</span>
            <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img src={user.picture} alt="User" className="w-12 h-12 rounded-full ring-2 ring-white" />
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setActiveView('Support Tickets');
                  }}
                  className="w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                  </svg>
                  <span className="font-medium">Support Tickets</span>
                </button>
                <button
                  onClick={onSignOut}
                  className="w-full text-left flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group"
                >
                  <LogoutIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;