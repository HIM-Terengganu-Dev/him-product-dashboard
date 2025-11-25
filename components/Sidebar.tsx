import React, { useState } from 'react';
import Link from 'next/link';
import type { ViewType } from '../app/page';
import { DashboardIcon, OrdersIcon, CrmIcon, SalesIcon, ProductsIcon, MessagesIcon, SettingsIcon, ChevronLeftIcon, ChevronDownIcon } from './Icons';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  unreadTicketCount?: number;
}

type SubSubItem = {
  name: string;
  view: ViewType;
};

type SubItem = {
  name: string;
  view?: ViewType;
  subItems?: SubSubItem[];
};

type NavItem = {
  name: string;
  view?: ViewType;
  href?: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  subItems?: SubItem[];
};

const navItems: NavItem[] = [
  { name: 'Home', view: 'Dashboard', icon: DashboardIcon },
  { name: 'Orders', view: 'Orders', icon: OrdersIcon },
  {
    name: 'CRM',
    icon: CrmIcon,
    subItems: [
      { name: 'Main', view: 'CRM' },
      { name: 'Prospect Status', view: 'Prospect Status' },
      { name: 'Client Status', view: 'Client Status' },
      { name: 'Client Segment', view: 'Client Segment' },
    ],
  },
  {
    name: 'Sales',
    icon: SalesIcon,
    subItems: [
      {
        name: 'BI Dashboard',
        subItems: [
          { name: 'All', view: 'Sales BI All' },
          { name: 'TikTok', view: 'Sales BI TikTok' },
          { name: 'Shopee', view: 'Sales BI Shopee' },
          { name: 'WhatsApp', view: 'Sales BI WhatsApp' },
          { name: 'Lazada', view: 'Sales BI Lazada' },
        ],
      },
      {
        name: 'Data Management',
        view: 'Sales Data Management',
        subItems: [
          { name: 'TikTok', view: 'Sales Data TikTok' },
          { name: 'Shopee', view: 'Sales Data Shopee' },
          { name: 'WhatsApp', view: 'Sales Data WhatsApp' },
          { name: 'Lazada', view: 'Sales Data Lazada' },
        ],
      },
    ],
  },
  { name: 'Products', view: 'Products', icon: ProductsIcon },
  { name: 'Messages', view: 'Messages', icon: MessagesIcon },
  {
    name: 'Settings',
    icon: SettingsIcon,
    subItems: [
      { name: 'General', view: 'Settings' },
      { name: 'Support Tickets', view: 'Support Tickets' },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setOpen, unreadTicketCount = 0 }) => {
  const [openSubmenus, setOpenSubmenus] = useState<{ [key: string]: boolean }>({
    'CRM': true,
    'Sales': true,
    'BI Dashboard': true,
    'Data Management': true,
  });

  const toggleSubmenu = (itemName: string) => {
    setOpenSubmenus(prev => ({ ...prev, [itemName]: !prev[itemName] }));
  };

  // Helper function to check if any nested sub-item is active
  const isNestedSubItemActive = (subItems?: SubItem[]): boolean => {
    if (!subItems) return false;
    return subItems.some(subItem => {
      if (subItem.view && activeView === subItem.view) return true;
      if (subItem.subItems) {
        return subItem.subItems.some(subSubItem => activeView === subSubItem.view);
      }
      return false;
    });
  };

  const baseItemClass = "flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors duration-200";
  const activeItemClass = "bg-indigo-600 text-white shadow-lg";
  const inactiveItemClass = "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600";

  const baseSubItemClass = "flex items-center p-3 pl-12 my-1 rounded-lg cursor-pointer transition-colors duration-200 text-sm";
  const activeSubItemClass = "bg-indigo-50 text-indigo-700 font-semibold";
  const inactiveSubItemClass = "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-white text-gray-700 flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200
        fixed lg:static inset-y-0 left-0 z-50
        ${isOpen ? 'w-64' : 'w-20 lg:w-20 -translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 h-20 border-b border-gray-200">
          <div className={`flex items-center transition-opacity duration-300 ${isOpen ? 'pl-2' : 'justify-center w-full'}`}>
            {isOpen ? (
              <span className="text-xl sm:text-2xl font-bold text-indigo-700">HIM Product</span>
            ) : (
              <span className="text-xl sm:text-2xl font-bold text-indigo-700">HP</span>
            )}
          </div>
          <button onClick={() => setOpen(!isOpen)} className="p-2 rounded-full hover:bg-gray-100 hidden lg:block">
            <ChevronLeftIcon className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
          </button>
          <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100 lg:hidden">
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.href ? (
                // Link-based navigation for external routes
                <Link href={item.href}>
                  <div className={`${baseItemClass} ${inactiveItemClass}`}>
                    <item.icon className="h-6 w-6" />
                    {isOpen && <span className="ml-4 font-medium">{item.name}</span>}
                  </div>
                </Link>
              ) : (
                // View-based navigation for dashboard views
                <div
                  onClick={() => {
                    if (item.subItems) {
                      toggleSubmenu(item.name);
                    } else if (item.view) {
                      setActiveView(item.view);
                    }
                  }}
                  className={`${baseItemClass} ${(activeView === item.view || isNestedSubItemActive(item.subItems)) ? activeItemClass : inactiveItemClass
                    }`}
                >
                  <item.icon className="h-6 w-6" />
                  {isOpen && <span className="ml-4 font-medium">{item.name}</span>}
                  {isOpen && item.subItems && (
                    <ChevronDownIcon className={`w-5 h-5 ml-auto transition-transform duration-200 ${openSubmenus[item.name] ? '' : '-rotate-90'}`} />
                  )}
                  {!isOpen && item.subItems?.some(si => si.view === 'Support Tickets') && unreadTicketCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadTicketCount > 9 ? '9+' : unreadTicketCount}
                    </span>
                  )}
                </div>
              )}
              {isOpen && openSubmenus[item.name] && item.subItems && (
                <div className="ml-4 border-l-2 border-indigo-100">
                  {item.subItems.map((subItem) => (
                    <div key={subItem.name}>
                      {subItem.subItems ? (
                        // Nested sub-menu (has its own sub-items)
                        <>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSubmenu(subItem.name);
                            }}
                            className={`${baseSubItemClass} ${(subItem.view && activeView === subItem.view) || (subItem.subItems?.some(ssi => activeView === ssi.view)) ? activeSubItemClass : inactiveSubItemClass} relative`}
                          >
                            <span>{subItem.name}</span>
                            <ChevronDownIcon className={`w-4 h-4 ml-auto transition-transform duration-200 ${openSubmenus[subItem.name] ? '' : '-rotate-90'}`} />
                          </div>
                          {openSubmenus[subItem.name] && subItem.subItems && (
                            <div className="ml-4 border-l-2 border-indigo-100">
                              {subItem.subItems.map((subSubItem) => (
                                <div
                                  key={subSubItem.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveView(subSubItem.view);
                                  }}
                                  className={`${baseSubItemClass} pl-8 ${activeView === subSubItem.view ? activeSubItemClass : inactiveSubItemClass} relative`}
                                >
                                  <span>{subSubItem.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        // Regular sub-item (no nested sub-items)
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (subItem.view) setActiveView(subItem.view);
                          }}
                          className={`${baseSubItemClass} ${subItem.view && activeView === subItem.view ? activeSubItemClass : inactiveSubItemClass} relative`}
                        >
                          <span>{subItem.name}</span>
                          {subItem.view === 'Support Tickets' && unreadTicketCount > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {unreadTicketCount > 99 ? '99+' : unreadTicketCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;