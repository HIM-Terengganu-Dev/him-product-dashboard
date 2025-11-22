import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StarIcon, CurrencyDollarIcon, RefreshIcon, UserIcon, DotsVerticalIcon, ChevronDownIcon } from './Icons';

type Segment = "Loyal Client" | "High-Spender Client" | "Repeat Client" | "One-time Client";

interface Client {
    id: string;
    name: string;
    phone: string;
    segment: Segment;
    totalSpent: number;
    aov: number;
    totalOrders: number;
}

interface Summary {
    'Loyal Client': number;
    'High-Spender Client': number;
    'Repeat Client': number;
    'One-time Client': number;
}

interface Filters {
    search: string;
    marketplace: string[];
}

const CLIENTS_PER_PAGE = 10;

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

const MultiSelectDropdown = ({ options, selected, onChange, placeholder, disabled = false }: {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter(item => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const displayValue = selected.length === 0
        ? placeholder
        : selected.length === 1
            ? options.find(o => o.value === selected[0])?.label ?? placeholder
            : `${selected.length} selected`;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out bg-white text-left flex justify-between items-center disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <ul className="max-h-60 overflow-y-auto p-2">
                        {options.map(option => (
                            <li key={option.value}>
                                <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(option.value)}
                                        onChange={() => handleSelect(option.value)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

const segmentInfo: { [key in Segment]: { color: string; badge: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; iconBg: string; } } = {
    'Loyal Client': { color: '#f59e0b', badge: 'bg-yellow-100 text-yellow-800', icon: StarIcon, iconBg: 'bg-yellow-500' },
    'High-Spender Client': { color: '#8b5cf6', badge: 'bg-purple-100 text-purple-800', icon: CurrencyDollarIcon, iconBg: 'bg-purple-500' },
    'Repeat Client': { color: '#3b82f6', badge: 'bg-blue-100 text-blue-800', icon: RefreshIcon, iconBg: 'bg-blue-500' },
    'One-time Client': { color: '#6b7280', badge: 'bg-gray-100 text-gray-800', icon: UserIcon, iconBg: 'bg-gray-500' },
};

const segments: Segment[] = ["Loyal Client", "High-Spender Client", "Repeat Client", "One-time Client"];

const ClientSegmentView: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalClients, setTotalClients] = useState(0);
    const [activeFilter, setActiveFilter] = useState<Segment | 'All'>('All');
    const [filters, setFilters] = useState<Filters>({ search: '', marketplace: [] });
    const [allMarketplaces, setAllMarketplaces] = useState<string[]>([]);

    useEffect(() => {
        const fetchClientSegmentData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: String(currentPage),
                    limit: String(CLIENTS_PER_PAGE),
                    segment: activeFilter,
                });
                if (filters.search) params.append('search', filters.search);
                if (filters.marketplace.length > 0) params.append('marketplace', filters.marketplace.join(','));

                const response = await fetch(`/api/clients/segment?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch client segment data. Please check the API server.');
                }
                const data = await response.json();
                setClients(data.clients);
                setSummary(data.summary);
                setTotalPages(data.totalPages);
                setTotalClients(data.totalClients);
                setAllMarketplaces(data.allMarketplaces);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClientSegmentData();
    }, [currentPage, activeFilter, filters]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleMarketplaceFilterChange = (marketplaces: string[]) => {
        setFilters(prev => ({ ...prev, marketplace: marketplaces }));
    };

    const chartData = useMemo(() => {
        if (!summary) return [];
        return segments.map(segment => ({
            name: segment,
            value: summary[segment] || 0,
        })).filter(item => item.value > 0);
    }, [summary]);

    const totalSummaryClients = useMemo(() => {
        if (!summary) return 0;
        return Object.values(summary).reduce((acc, count) => acc + count, 0);
    }, [summary]);

    const handleFilterClick = (segment: Segment | 'All') => {
        setActiveFilter(segment);
    };

    const marketplaceOptions = useMemo(() => {
        const options = [{ value: '_NONE_', label: '[Not Specified]' }];
        allMarketplaces.forEach(m => options.push({ value: m, label: m }));
        return options;
    }, [allMarketplaces]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = totalSummaryClients > 0 ? ((data.value / totalSummaryClients) * 100).toFixed(1) : 0;
            return (
                <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="flex items-center mb-2">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segmentInfo[data.name as Segment].color }}></span>
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value);
    }

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-gray-200 rounded-full w-28"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
        </tr>
    );

    const renderTableBody = () => {
        if (isLoading && clients.length === 0) {
            return Array.from({ length: CLIENTS_PER_PAGE }).map((_, index) => <SkeletonRow key={index} />);
        }
        if (error) {
            return <tr><td colSpan={6} className="text-center py-10 text-red-500 font-medium">{error}</td></tr>;
        }
        if (clients.length === 0) {
            return <tr><td colSpan={6} className="text-center py-10 text-gray-500">No clients found for this filter.</td></tr>;
        }
        return clients.map((client) => (
            <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap"><div><div className="text-sm font-medium text-gray-900">{client.name}</div><div className="text-sm text-gray-500">{client.phone}</div></div></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${segmentInfo[client.segment].badge}`}>{client.segment}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(client.totalSpent)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(client.aov)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.totalOrders}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button className="text-gray-400 hover:text-indigo-600"><DotsVerticalIcon className="w-5 h-5" /></button></td>
            </tr>
        ));
    };

    const Pagination = () => {
        const startItem = totalClients > 0 ? (currentPage - 1) * CLIENTS_PER_PAGE + 1 : 0;
        const endItem = Math.min(currentPage * CLIENTS_PER_PAGE, totalClients);

        return (
            <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
                <div><p className="text-sm text-gray-700">Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}<span className="font-medium">{totalClients}</span> results</p></div>
                <div className="flex-1 flex justify-end">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
                </div>
            </div>
        );
    };

    const renderCustomLegend = () => {
        return (
            <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
                {segments.map((segment) => {
                    const isActive = activeFilter === 'All' || activeFilter === segment;
                    return (
                        <div
                            key={segment}
                            onClick={() => handleFilterClick(segment)}
                            className={`flex items-center cursor-pointer transition-all duration-200 rounded-full px-2 py-1 ${isActive ? 'opacity-100 bg-gray-100' : 'opacity-50 hover:opacity-100'}`}
                        >
                            <span className="w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: segmentInfo[segment].color }}></span>
                            <span className="text-gray-700 font-medium">{segment}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800">Client Segment Distribution</h3>
                    {isLoading && !summary ? (
                        <div className="animate-pulse flex items-center justify-center h-72">
                            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-10">Could not load chart data.</div>
                    ) : (
                        <div className="relative w-full h-72">
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
                                            <Cell key={`cell-${entry.name}`} fill={segmentInfo[entry.name as Segment].color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        wrapperStyle={{ zIndex: 1000 }}
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend content={renderCustomLegend} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">{totalSummaryClients.toLocaleString()}</span>
                                <p className="text-sm text-gray-500">Total Clients</p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoading && !summary ? (
                        <>
                            <KpiCardSkeleton />
                            <KpiCardSkeleton />
                            <KpiCardSkeleton />
                            <KpiCardSkeleton />
                        </>
                    ) : (
                        segments.map(segment => (
                            <KpiCard
                                key={segment}
                                title={segment}
                                value={(summary?.[segment] || 0).toLocaleString()}
                                icon={segmentInfo[segment].icon}
                                iconColor={segmentInfo[segment].iconBg}
                                onClick={() => handleFilterClick(segment)}
                                isActive={activeFilter === segment}
                            />
                        ))
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Client Segment Details ({totalClients})</h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleFilterClick('All')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                            {segments.map(segment => (
                                <button key={segment} onClick={() => handleFilterClick(segment)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === segment ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{segment}</button>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Filter Section */}
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="w-full">
                            <input
                                type="text"
                                name="search"
                                placeholder="Search by Name/Phone..."
                                value={filters.search}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            />
                        </div>
                        <div className="w-full">
                            <MultiSelectDropdown
                                options={marketplaceOptions}
                                selected={filters.marketplace}
                                onChange={handleMarketplaceFilterChange}
                                placeholder="Filter by Marketplace"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AOV</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
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

export default ClientSegmentView;