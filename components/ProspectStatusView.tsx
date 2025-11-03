import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserCheckIcon, UserMinusIcon, DotsVerticalIcon } from './Icons';

type Status = "Active" | "Inactive";

interface Prospect {
  id: string;
  name: string;
  phone: string;
  status: Status;
  lastContactDate: string | null;
}

interface Summary {
    'Active': number;
    'Inactive': number;
}

const PROSPECTS_PER_PAGE = 10;

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconColor: string;
    onClick?: () => void;
    isActive?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, iconColor, onClick, isActive }) => (
    <div 
        className={`bg-white p-6 rounded-xl shadow-md border flex items-center space-x-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''} ${isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100'}`}
        onClick={onClick}
    >
        <div className={`p-3 rounded-full ${iconColor}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
        </div>
    </div>
);

const KpiCardSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4 animate-pulse">
        <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
        <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
    </div>
);

const statusInfo: { [key in Status]: { color: string; badge: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; iconBg: string; } } = {
    'Active': { color: '#10b981', badge: 'bg-green-100 text-green-800', icon: UserCheckIcon, iconBg: 'bg-green-500' },
    'Inactive': { color: '#ef4444', badge: 'bg-red-100 text-red-800', icon: UserMinusIcon, iconBg: 'bg-red-500' },
};

const statuses: Status[] = ["Active", "Inactive"];

const ProspectStatusView: React.FC = () => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalProspects, setTotalProspects] = useState(0);
    const [activeFilter, setActiveFilter] = useState<Status | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProspectStatusData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: String(currentPage),
                    limit: String(PROSPECTS_PER_PAGE),
                    status: activeFilter,
                });
                if (searchTerm) params.append('search', searchTerm);
                
                const response = await fetch(`/api/prospects/status?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch prospect status data. Please check the API server.');
                }
                const data = await response.json();
                setProspects(data.prospects);
                setSummary(data.summary);
                setTotalPages(data.totalPages);
                setTotalProspects(data.totalProspects);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProspectStatusData();
    }, [currentPage, activeFilter, searchTerm]);
    
    // Reset page to 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, searchTerm]);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const chartData = useMemo(() => {
        if (!summary) return [];
        return statuses.map(status => ({
            name: status,
            value: summary[status] || 0,
        })).filter(item => item.value > 0);
    }, [summary]);

    const totalSummaryProspects = useMemo(() => {
        if (!summary) return 0;
        return Object.values(summary).reduce((acc, count) => acc + count, 0);
    }, [summary]);

    const handleFilterClick = (status: Status | 'All') => {
        setActiveFilter(status);
    };
    
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = totalSummaryProspects > 0 ? ((data.value / totalSummaryProspects) * 100).toFixed(1) : 0;
            return (
                <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="flex items-center mb-2">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: statusInfo[data.name as Status].color }}></span>
                        <p className="font-bold text-gray-800 text-base">{data.name}</p>
                    </div>
                    <p className="text-sm text-gray-600 pl-5">
                        Count: <span className="font-medium text-gray-700">{data.value.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600 pl-5">
                        Percentage: <span className="font-medium text-gray-700">{percentage}%</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    const SkeletonRow = () => (
      <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
        <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
      </tr>
    );

    const renderTableBody = () => {
        if (isLoading && prospects.length === 0) {
            return Array.from({ length: PROSPECTS_PER_PAGE }).map((_, index) => <SkeletonRow key={index} />);
        }
        if (error) {
            return <tr><td colSpan={4} className="text-center py-10 text-red-500 font-medium">{error}</td></tr>;
        }
        if (prospects.length === 0) {
            return <tr><td colSpan={4} className="text-center py-10 text-gray-500">No prospects found for this filter.</td></tr>;
        }
        return prospects.map((prospect) => (
            <tr key={prospect.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{prospect.name}</div><div className="text-sm text-gray-500">{prospect.phone}</div></div></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo[prospect.status].badge}`}>{prospect.status}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prospect.lastContactDate || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button className="text-gray-400 hover:text-indigo-600"><DotsVerticalIcon className="w-5 h-5"/></button></td>
            </tr>
        ));
    };
    
    const Pagination = () => {
        const startItem = totalProspects > 0 ? (currentPage - 1) * PROSPECTS_PER_PAGE + 1 : 0;
        const endItem = Math.min(currentPage * PROSPECTS_PER_PAGE, totalProspects);
    
        return (
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
                <div>
                    <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                        <span className="font-medium">{totalProspects}</span> results
                    </p>
                </div>
                <div className="flex-1 flex justify-end">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
            </div>
        );
    };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Prospect Status Distribution</h3>
                {isLoading && !summary ? (
                    <div className="animate-pulse flex items-center justify-center h-64">
                        <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
                    </div>
                ) : error ? (
                    <div className="text-red-500 text-center py-10">Could not load chart data.</div>
                ) : (
                    <div className="relative w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData as any}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="name"
                                    cornerRadius={5}
                                >
                                    {chartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={statusInfo[entry.name as Status].color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    wrapperStyle={{ zIndex: 1000 }}
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend
                                    iconType="circle"
                                    onClick={(data) => handleFilterClick(data.value as Status)}
                                    formatter={(value) => <span className={`ml-2 cursor-pointer ${activeFilter === value || activeFilter === 'All' ? 'text-gray-700' : 'text-gray-400'}`}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-3xl font-bold text-gray-800">{totalSummaryProspects.toLocaleString()}</span>
                            <p className="text-sm text-gray-500">Total Prospects</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-center">
                {isLoading && !summary ? (
                    <>
                        <KpiCardSkeleton />
                        <KpiCardSkeleton />
                    </>
                ) : (
                    statuses.map(status => (
                        <KpiCard 
                            key={status}
                            title={status}
                            value={(summary?.[status] || 0).toLocaleString()} 
                            icon={statusInfo[status].icon} 
                            iconColor={statusInfo[status].iconBg}
                            onClick={() => handleFilterClick(status)} 
                            isActive={activeFilter === status} 
                        />
                    ))
                )}
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Prospect Details ({totalProspects})</h3>
                     <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleFilterClick('All')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                        {statuses.map(status => (
                          <button key={status} onClick={() => handleFilterClick(status)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{status}</button>
                        ))}
                    </div>
                </div>
            </div>
             <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                 <div className="sm:max-w-xs">
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by Name/Phone..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prospect</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>
            {!error && totalPages > 0 && <Pagination />}
        </div>
    </div>
  );
};

export default ProspectStatusView;