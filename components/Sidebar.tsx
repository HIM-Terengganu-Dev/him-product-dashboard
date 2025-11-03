import React, { useState } from 'react';
import type { ViewType } from '../app/page';
import { DashboardIcon, OrdersIcon, CrmIcon, SalesIcon, ProductsIcon, MessagesIcon, SettingsIcon, ChevronLeftIcon, ChevronDownIcon } from './Icons';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

type NavItem = {
  name: string;
  view?: ViewType;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  subItems?: { name: string; view: ViewType }[];
};

const navItems: NavItem[] = [
  { name: 'Dashboard', view: 'Dashboard', icon: DashboardIcon },
  { name: 'Orders', view: 'Orders', icon: OrdersIcon },
  {
    name: 'CRM',
    icon: CrmIcon,
    subItems: [
      { name: 'Main', view: 'CRM' },
      { name: 'Client Status', view: 'Client Status' },
      { name: 'Prospect Status', view: 'Prospect Status' },
      { name: 'Client Segment', view: 'Client Segment' },
    ],
  },
  { name: 'Sales', view: 'Sales', icon: SalesIcon },
  { name: 'Products', view: 'Products', icon: ProductsIcon },
  { name: 'Messages', view: 'Messages', icon: MessagesIcon },
  { name: 'Settings', view: 'Settings', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setOpen }) => {
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({
    'CRM': true,
  });

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  const baseItemClass = "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200";
  const activeItemClass = "bg-indigo-600 text-white shadow-lg";
  const inactiveItemClass = "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600";
  
  const baseSubItemClass = "flex items-center p-3 pl-12 my-1 rounded-lg cursor-pointer transition-colors duration-200 text-sm";
  const activeSubItemClass = "bg-indigo-50 text-indigo-700 font-semibold";
  const inactiveSubItemClass = "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600";

  return (
    <div className={`bg-white text-gray-700 flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200 ${isOpen ? 'w-64' : 'w-20'}`}>
       <div className="flex items-center justify-between p-4 h-20 border-b border-gray-200">
        <div className={`flex items-center transition-opacity duration-300 ${isOpen ? 'pl-2' : 'justify-center w-full'}`}>
            {isOpen ? (
                <span className="text-2xl font-bold text-indigo-700">HIM Product</span>
              ) : (
                <span className="text-2xl font-bold text-indigo-700">HP</span>
            )}
        </div>
        <button onClick={() => setOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 hidden lg:block">
          <ChevronLeftIcon className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <div key={item.name}>
            <div
              onClick={() => {
                if (item.subItems) {
                  toggleSubmenu(item.name);
                } else if (item.view) {
                  setActiveView(item.view);
                }
              }}
              className={`${baseItemClass} ${
                (activeView === item.view || item.subItems?.some(si => si.view === activeView)) ? activeItemClass : inactiveItemClass
              }`}
            >
              <item.icon className="h-6 w-6" />
              {isOpen && <span className="ml-4 font-medium">{item.name}</span>}
              {isOpen && item.subItems && (
                <ChevronDownIcon className={`w-5 h-5 ml-auto transition-transform duration-200 ${openSubmenus[item.name] ? '' : '-rotate-90'}`} />
              )}
            </div>
            {isOpen && openSubmenus[item.name] && item.subItems && (
              <div className="ml-4 border-l-2 border-indigo-100">
                {item.subItems.map((subItem) => (
                  <div
                    key={subItem.name}
                    onClick={() => setActiveView(subItem.view)}
                    className={`${baseSubItemClass} ${activeView === subItem.view ? activeSubItemClass : inactiveSubItemClass}`}
                  >
                    <span>{subItem.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;