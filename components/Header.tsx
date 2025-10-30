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
}

const Header: React.FC<HeaderProps> = ({ currentView, toggleSidebar, user, onSignOut }) => {
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
    <header className="flex items-center justify-between h-20 bg-white border-b border-gray-200 px-4 md:px-6">
      <div className="flex items-center">
        <button onClick={toggleSidebar} className="p-2 mr-4 rounded-full hover:bg-gray-100 lg:hidden">
            <MenuIcon className="w-6 h-6 text-gray-600"/>
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{currentView}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-500" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(p => !p)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition">
                <img src={user.picture} alt="User" className="w-10 h-10 rounded-full" />
                <span className="hidden sm:inline font-medium text-gray-700">{user.name.split(' ')[0]}</span>
            </button>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100">
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <button 
                            onClick={onSignOut}
                            className="w-full text-left flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>Sign Out</span>
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