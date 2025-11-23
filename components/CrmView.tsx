import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DotsVerticalIcon, UserGroupIcon, UserCheckIcon, UserSearchIcon, ChevronDownIcon } from './Icons';

// Data types from the new unified API
type ContactType = 'Client' | 'Prospect' | 'Lead';
interface Contact {
    id: string;
    name: string;
    phone: string;
    type: ContactType;
    lastPurchaseDate: string | null;
    lastPurchaseProduct: string | null;
    lastMarketplace: string | null;
}

interface TypeSummaryData {
    type: ContactType;
    count: number;
}

interface MarketplaceSummaryData {
    marketplace: string;
    count: number;
}

interface SummaryData {
    typeSummary: TypeSummaryData[];
    marketplaceSummary: MarketplaceSummaryData[];
    totalContacts: number;
}

interface FilterOptions {
    allMarketplaces: string[];
    allProducts: string[];
}

interface UnifiedResponse {
    contacts: Contact[];
    totalContactsInTable: number;
    totalPages: number;
    summary: SummaryData;
    filterOptions: FilterOptions;
}

interface Filters {
    name: string;
    type: ContactType[];
    marketplace: string[];
    product: string[];
    startDate: string;
    endDate: string;
}

const typeStyles: { [key in ContactType]: { badge: string; chart: string } } = {
    'Client': { badge: 'bg-green-100 text-green-800', chart: '#10b981' },
    'Prospect': { badge: 'bg-yellow-100 text-yellow-800', chart: '#f59e0b' },
    'Lead': { badge: 'bg-blue-100 text-blue-800', chart: '#3b82f6' },
};

const MARKETPLACE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

const CONTACTS_PER_PAGE = 10;

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    iconColor: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon: Icon, iconColor }) => (
    <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 flex items-center space-x-3 sm:space-x-4 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
        <div className={`p-3 sm:p-4 rounded-xl ${iconColor} shadow-md flex-shrink-0`}>
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider truncate">{title}</h3>
            <p className="text-2xl sm:text-3xl font-bold mt-1 text-gray-900 truncate">{value}</p>
        </div>
    </div>
);

const KpiCardSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex items-center space-x-4 animate-pulse">
        <div className="p-4 rounded-xl bg-gray-200 w-14 h-14"></div>
        <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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


const CrmView: React.FC = () => {
    // All state is managed here
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
    const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalContactsInTable, setTotalContactsInTable] = useState(0);

    const [activeSegments, setActiveSegments] = useState<Set<ContactType>>(new Set());
    const [activeMarketplaces, setActiveMarketplaces] = useState<Set<string>>(new Set());

    const [filters, setFilters] = useState<Filters>({
        name: '', type: [], marketplace: [], product: [], startDate: '', endDate: ''
    });

    // Single data fetching effect
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const params = new URLSearchParams({
                    page: String(currentPage),
                    limit: String(CONTACTS_PER_PAGE),
                });

                Object.entries(filters).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        if (value.length > 0) params.append(key, value.join(','));
                    } else if (value) {
                        params.append(key, value as string);
                    }
                });

                const response = await fetch(`/api/contacts?${params.toString()}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data.');
                }
                const data: UnifiedResponse = await response.json();

                // Atomic state update
                setContacts(data.contacts);
                setSummaryData(data.summary);
                setFilterOptions(data.filterOptions);
                setTotalPages(data.totalPages);
                setTotalContactsInTable(data.totalContactsInTable);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                // Clear data on error to prevent showing stale info
                setContacts([]);
                setSummaryData(null);
                setFilterOptions(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentPage, filters]);

    // Effect to initialize chart filters when data loads
    useEffect(() => {
        if (summaryData) {
            setActiveSegments(new Set(summaryData.typeSummary.map(item => item.type)));
            setActiveMarketplaces(new Set(summaryData.marketplaceSummary.map(item => item.marketplace)));
        }
    }, [summaryData]);

    // Reset page to 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // All derived data is calculated with useMemo for performance
    const { typeSummary, marketplaceSummary } = useMemo(() => ({
        typeSummary: summaryData?.typeSummary || [],
        marketplaceSummary: summaryData?.marketplaceSummary || [],
    }), [summaryData]);

    const filteredTypeSummary = useMemo(() => typeSummary.filter(item => activeSegments.has(item.type)), [typeSummary, activeSegments]);
    const filteredMarketplaceSummary = useMemo(() => marketplaceSummary.filter(item => activeMarketplaces.has(item.marketplace)), [marketplaceSummary, activeMarketplaces]);

    const totalContactsSummary = useMemo(() => filteredTypeSummary.reduce((acc, item) => acc + item.count, 0), [filteredTypeSummary]);
    const totalMarketplaceContacts = useMemo(() => filteredMarketplaceSummary.reduce((acc, item) => acc + item.count, 0), [filteredMarketplaceSummary]);

    const marketplaceColorMap = useMemo(() => {
        const map = new Map<string, string>();
        marketplaceSummary.forEach((item, index) => {
            map.set(item.marketplace, MARKETPLACE_COLORS[index % MARKETPLACE_COLORS.length]);
        });
        return map;
    }, [marketplaceSummary]);

    const { clientCount, prospectCount } = useMemo(() => {
        const clientData = typeSummary.find(d => d.type === 'Client');
        const prospectData = typeSummary.find(d => d.type === 'Prospect');
        return {
            clientCount: clientData ? clientData.count.toLocaleString() : '0',
            prospectCount: prospectData ? prospectData.count.toLocaleString() : '0',
        }
    }, [typeSummary]);

    const marketplaceOptions = useMemo(() => {
        const options = [{ value: '_NONE_', label: '[Not Specified]' }];
        if (filterOptions?.allMarketplaces) {
            filterOptions.allMarketplaces.forEach(m => options.push({ value: m, label: m }));
        }
        return options;
    }, [filterOptions]);

    const productOptions = useMemo(() => {
        const options = [{ value: '_NONE_', label: '[Not Specified]' }];
        if (filterOptions?.allProducts) {
            filterOptions.allProducts.forEach(p => options.push({ value: p, label: p }));
        }
        return options;
    }, [filterOptions]);


    // Handler functions
    const handleTextFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (name: 'type' | 'marketplace' | 'product', value: string[]) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = () => {
        // ... export logic remains the same
    };

    // Skeletons and Render functions
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-200 rounded w-32"></div></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-5 bg-gray-200 rounded-full w-20"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
            <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 rounded w-36"></div></td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><div className="h-5 w-5 bg-gray-200 rounded"></div></td>
        </tr>
    );

    const ChartSkeleton = () => (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse w-full">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 flex items-center justify-center"><div className="w-48 h-48 bg-gray-200 rounded-full"></div></div>
        </div>
    );

    const renderTableBody = () => {
        if (isLoading && contacts.length === 0) return Array.from({ length: CONTACTS_PER_PAGE }).map((_, index) => <SkeletonRow key={index} />);
        if (error) return (<tr><td colSpan={4} className="text-center py-10 px-4"><div className="text-red-500 font-medium text-sm">Error: {error}</div><p className="text-gray-500 text-xs sm:text-sm mt-2">Could not load contact data.</p></td></tr>);
        if (contacts.length === 0) return (<tr><td colSpan={4} className="text-center py-10 px-4"><div className="text-gray-500 text-sm">No contacts found for the selected filters.</div></td></tr>);
        return contacts.map((contact) => (
            <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div>
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{contact.phone}</div>
                        {/* Show marketplace on mobile in name cell */}
                        <div className="text-xs text-gray-500 mt-1 sm:hidden">{contact.lastMarketplace || 'N/A'}</div>
                    </div>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyles[contact.type].badge}`}>{contact.type}</span>
                </td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{contact.lastMarketplace || 'N/A'}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{contact.lastPurchaseDate || 'N/A'}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">{contact.lastPurchaseProduct || 'N/A'}</td>
                <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-indigo-600">
                        <DotsVerticalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </td>
            </tr>
        ));
    };

    const Pagination = () => {
        const startItem = totalContactsInTable > 0 ? (currentPage - 1) * CONTACTS_PER_PAGE + 1 : 0;
        const endItem = Math.min(currentPage * CONTACTS_PER_PAGE, totalContactsInTable);
        return (<div className="py-3 px-4 flex items-center justify-between border-t border-gray-200"><div><p className="text-sm text-gray-700">Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}<span className="font-medium">{totalContactsInTable}</span> results</p></div><div className="flex-1 flex justify-end"><button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || isLoading} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button><button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || isLoading} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button></div></div>);
    };

    const renderCustomTooltip = (total: number) => ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = data.count;
            const name = data.type || data.marketplace;
            const color = payload[0].fill;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return (<div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-50"><div className="flex items-center mb-2"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span><p className="font-bold text-gray-800 text-base">{name}</p></div><p className="text-sm text-gray-600 pl-5">Count: <span className="font-medium text-gray-700">{value.toLocaleString()}</span></p><p className="text-sm text-gray-600 pl-5">Percentage: <span className="font-medium text-gray-700">{percentage}%</span></p></div>);
        }
        return null;
    };

    const handleSegmentLegendClick = (segmentType: ContactType) => setActiveSegments(prev => { const s = new Set(prev); s.has(segmentType) ? s.delete(segmentType) : s.add(segmentType); return s; });
    const handleMarketplaceLegendClick = (marketplace: string) => setActiveMarketplaces(prev => { const s = new Set(prev); s.has(marketplace) ? s.delete(marketplace) : s.add(marketplace); return s; });

    const renderSegmentLegend = () => (<div className="flex justify-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs">{typeSummary.map(entry => (<div key={entry.type} onClick={() => handleSegmentLegendClick(entry.type)} className={`flex items-center cursor-pointer transition-all duration-200 rounded-full px-2 py-0.5 ${activeSegments.has(entry.type) ? 'opacity-100 bg-gray-50' : 'opacity-40'}`}><span className="w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: typeStyles[entry.type].chart }}></span><span className="text-gray-700">{entry.type}</span></div>))}</div>);
    const renderMarketplaceLegend = () => (<div className="flex justify-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs">{marketplaceSummary.map(entry => (<div key={entry.marketplace} onClick={() => handleMarketplaceLegendClick(entry.marketplace)} className={`flex items-center cursor-pointer transition-all duration-200 rounded-full px-2 py-0.5 ${activeMarketplaces.has(entry.marketplace) ? 'opacity-100 bg-gray-50' : 'opacity-40'}`}><span className="w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: marketplaceColorMap.get(entry.marketplace) }}></span><span className="text-gray-700">{entry.marketplace}</span></div>))}</div>);

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Contacts by Type</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Distribution of contact segments</p>
                    {isLoading && !summaryData ? <ChartSkeleton /> : error ? <div className="text-red-500 text-center py-10 text-sm">{error}</div> : (<>
                        <div className="relative w-full h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    {/* FIX: Cast `filteredTypeSummary` to `any` to resolve recharts TypeScript error. */}
                                    <Pie data={filteredTypeSummary as any} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="count" nameKey="type" cornerRadius={5}>
                                        {filteredTypeSummary.map((entry) => <Cell key={`cell-${entry.type}`} fill={typeStyles[entry.type].chart} />)}
                                    </Pie>
                                    <Tooltip wrapperStyle={{ zIndex: 1000 }} content={renderCustomTooltip(totalContactsSummary)} cursor={{ fill: 'transparent' }} />
                                    <Legend verticalAlign="bottom" content={renderSegmentLegend} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-800">{totalContactsSummary.toLocaleString()}</span>
                                <p className="text-xs sm:text-sm text-gray-500">Total Contacts</p>
                            </div>
                        </div>
                    </>)}
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">Contacts by Last Marketplace</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Contact distribution across marketplaces</p>
                    {isLoading && !summaryData ? <ChartSkeleton /> : error ? <div className="text-red-500 text-center py-10 text-sm">{error}</div> : (<>
                        <div className="relative w-full h-64 sm:h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    {/* FIX: Cast `filteredMarketplaceSummary` to `any` to resolve recharts TypeScript error. */}
                                    <Pie data={filteredMarketplaceSummary as any} cx="50%" cy="50%" innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="count" nameKey="marketplace" cornerRadius={5}>
                                        {filteredMarketplaceSummary.map((entry) => <Cell key={`cell-${entry.marketplace}`} fill={marketplaceColorMap.get(entry.marketplace)} />)}
                                    </Pie>
                                    <Tooltip wrapperStyle={{ zIndex: 1000 }} content={renderCustomTooltip(totalMarketplaceContacts)} cursor={{ fill: 'transparent' }} />
                                    <Legend verticalAlign="bottom" content={renderMarketplaceLegend} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-2xl sm:text-3xl font-bold text-gray-800">{totalMarketplaceContacts.toLocaleString()}</span>
                                <p className="text-xs sm:text-sm text-gray-500 leading-tight">Marketplace<br />Contacts</p>
                            </div>
                        </div>
                    </>)}
                </div>
            </div>

            {isLoading && !summaryData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"><KpiCardSkeleton /><KpiCardSkeleton /><KpiCardSkeleton /></div>
            ) : !error && summaryData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <KpiCard title="Total Contacts" value={(summaryData.totalContacts).toLocaleString()} icon={UserGroupIcon} iconColor="bg-blue-500" />
                    <KpiCard title="Clients" value={clientCount} icon={UserCheckIcon} iconColor="bg-green-500" />
                    <KpiCard title="Prospects" value={prospectCount} icon={UserSearchIcon} iconColor="bg-yellow-500" />
                </div>
            ) : null}

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6"><h3 className="text-base sm:text-lg font-semibold text-gray-800">All Contacts ({totalContactsInTable})</h3></div>
                <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-b border-gray-200 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <input type="text" name="name" placeholder="Filter by Name..." value={filters.name} onChange={handleTextFilterChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <MultiSelectDropdown options={[{ value: 'Client', label: 'Client' }, { value: 'Prospect', label: 'Prospect' }, { value: 'Lead', label: 'Lead' }]} selected={filters.type} onChange={(selected) => handleMultiSelectChange('type', selected)} placeholder="All Contact Types" />
                        <MultiSelectDropdown options={marketplaceOptions} selected={filters.marketplace} onChange={(selected) => handleMultiSelectChange('marketplace', selected)} placeholder="All Last Marketplaces" disabled={isLoading} />
                        <MultiSelectDropdown options={productOptions} selected={filters.product} onChange={(selected) => handleMultiSelectChange('product', selected)} placeholder="All Last Purchase Product" disabled={isLoading} />
                        <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleTextFilterChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" title="Start Date" />
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleTextFilterChange} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" title="End Date" />
                    </div>
                </div>
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Last Marketplace</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">Last Purchase Date</th>
                                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">Last Purchase Product</th>
                                <th scope="col" className="relative px-4 sm:px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">{renderTableBody()}</tbody>
                    </table>
                </div>
                {!error && totalPages > 0 && <Pagination />}
            </div>
        </div>
    );
};

export default CrmView;
