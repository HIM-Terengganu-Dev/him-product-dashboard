'use client';

import React, { useState, useEffect } from 'react';
import { UserGroupIcon, UserCheckIcon, UserSearchIcon, TrendingUpIcon, ChartBarIcon, CalendarIcon } from './Icons';

interface DashboardStats {
  totalContacts: number;
  totalClients: number;
  totalProspects: number;
  totalLeads: number;
}

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch summary data
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/contacts/summary');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalContacts: data.totalContacts || 0,
            totalClients: data.clients || 0,
            totalProspects: data.prospects || 0,
            totalLeads: data.leads || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const StatCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    gradient,
    trend
  }: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    value: string;
    subtitle: string;
    gradient: string;
    trend?: string;
  }) => (
    <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-10 rounded-bl-full`}></div>
      <div className="relative p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className={`p-2.5 sm:p-3 rounded-xl ${gradient}`}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          {trend && (
            <span className="text-green-600 text-xs sm:text-sm font-semibold flex items-center gap-1">
              <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  const QuickActionCard = ({
    icon: Icon,
    title,
    description,
    href,
    color
  }: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    href: string;
    color: string;
  }) => (
    <a
      href={href}
      className="block bg-white rounded-lg sm:rounded-xl shadow-md border border-gray-100 p-4 sm:p-5 hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`p-2 sm:p-2.5 rounded-lg ${color} group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
            {title}
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{description}</p>
        </div>
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative p-4 sm:p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome to HIM Wellness Dashboard
              </h1>
              <p className="text-indigo-100 text-sm sm:text-base md:text-lg">
                <span className="hidden sm:inline">{formatDate(currentTime)} • </span>{formatTime(currentTime)}
              </p>
            </div>
            <div className="mt-0 md:mt-0">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 border border-white/20">
                <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-200">Today's Date</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date().toLocaleDateString('en-MY')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 animate-pulse">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 rounded-xl mb-3 sm:mb-4"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-7 sm:h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </>
          ) : stats ? (
            <>
              <StatCard
                icon={UserGroupIcon}
                title="Total Contacts"
                value={stats.totalContacts.toLocaleString()}
                subtitle="All contacts in system"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
                trend="+12%"
              />
              <StatCard
                icon={UserCheckIcon}
                title="Clients"
                value={stats.totalClients.toLocaleString()}
                subtitle="Active customers"
                gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                trend="+8%"
              />
              <StatCard
                icon={UserSearchIcon}
                title="Prospects"
                value={stats.totalProspects.toLocaleString()}
                subtitle="Potential customers"
                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                trend="+5%"
              />
              <StatCard
                icon={ChartBarIcon}
                title="Leads"
                value={stats.totalLeads.toLocaleString()}
                subtitle="New opportunities"
                gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                trend="+15%"
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Available Features Section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Available Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* CRM Features */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">CRM System</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Contact management & database</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Client status tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Client segmentation analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Prospect status management</span>
              </li>
            </ul>
          </div>

          {/* Sales BI Dashboard */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Sales BI Dashboard</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Multi-marketplace analytics (All, TikTok, Shopee, WhatsApp, Lazada)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Performance metrics & insights</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Advanced analytics (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Sales Data Management */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <TrendingUpIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Sales Data Management</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>TikTok Live GMV & Product GMV data entry</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>File upload with auto date detection</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Manual data entry option</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Operation logs & audit trail</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Other marketplaces (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* Support & Ticketing */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Support & Ticketing</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ticket submission & management</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Real-time chat conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unread notification system</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Ticket status tracking</span>
              </li>
            </ul>
          </div>

          {/* TikTok Live GMV Dashboard */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-pink-500 to-red-600 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">TikTok Live GMV</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Real-time campaign analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>KPI metrics: Revenue, Orders, Cost, ROAS</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Date comparison (vs Yesterday, Custom Date)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Group & campaign performance breakdown</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>Product GMV Dashboard (Coming Soon)</span>
              </li>
            </ul>
          </div>

          {/* System Features */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">System Features</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>User authentication & authorization</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Responsive design (mobile & desktop)</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Data validation & error handling</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Operation logging & audit trail</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <QuickActionCard
            icon={UserGroupIcon}
            title="CRM"
            description="Manage contacts, clients, and prospects"
            href="#"
            color="bg-blue-500"
          />
          <QuickActionCard
            icon={ChartBarIcon}
            title="Sales BI Dashboard"
            description="View analytics and performance metrics"
            href="#"
            color="bg-indigo-500"
          />
          <QuickActionCard
            icon={TrendingUpIcon}
            title="TikTok Live GMV"
            description="View TikTok Live GMV dashboard"
            href="/sales-portal/live-gmv"
            color="bg-pink-500"
          />
          <QuickActionCard
            icon={TrendingUpIcon}
            title="Data Management"
            description="Upload and manage sales data"
            href="#"
            color="bg-amber-500"
          />
          <QuickActionCard
            icon={CalendarIcon}
            title="Support Tickets"
            description="Submit and track support requests"
            href="#"
            color="bg-green-500"
          />
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Getting Started</h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Navigate using the sidebar menu to access all features. Use <strong>Sales → BI Dashboard</strong> for analytics and reports (CEO-facing), 
              and <strong>Sales → Data Management</strong> for data entry and operations (team-facing). 
              Access CRM tools, support tickets, and more from the navigation menu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;