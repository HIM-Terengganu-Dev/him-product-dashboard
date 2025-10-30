import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { DotsVerticalIcon, UserGroupIcon, UserCheckIcon, UserSearchIcon, ChevronDownIcon } from './Icons';

// This is the shape of our contact data, updated to match the new API response.
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

interface DashboardStats {
    typeSummary: TypeSummaryData[];
    marketplaceSummary: MarketplaceSummaryData[];
    totalContacts: number;
    allMarketplaces: string[];
    allProducts: string[];
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
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4">
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


const CrmView: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalContactsInTable, setTotalContactsInTable] = useState(0);
  
  const [activeSegments, setActiveSegments] = useState<Set<ContactType>>(new Set(['Client', 'Prospect', 'Lead']));
  const [activeMarketplaces, setActiveMarketplaces] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<Filters>({
    name: '',
    type: [],
    marketplace: [],
    product: [],
    startDate: '',
    endDate: ''
  });

  const summaryData = useMemo(() => dashboardStats?.typeSummary || [], [dashboardStats]);
  const marketplaceData = useMemo(() => dashboardStats?.marketplaceSummary || [], [dashboardStats]);

  useEffect(() => {
    if (!isStatsLoading && marketplaceData.length > 0) {
        setActiveMarketplaces(new Set(marketplaceData.map(item => item.marketplace)));
    }
  }, [isStatsLoading, marketplaceData]);

  const filteredSummaryData = useMemo(() => {
    return summaryData.filter(item => activeSegments.has(item.type));
  }, [summaryData, activeSegments]);

  const filteredMarketplaceData = useMemo(() => {
    return marketplaceData.filter(item => activeMarketplaces.has(item.marketplace));
  }, [marketplaceData, activeMarketplaces]);

  const totalContactsSummary = useMemo(() => {
    return filteredSummaryData.reduce((acc, item) => acc + item.count, 0);
  }, [filteredSummaryData]);

  const totalMarketplaceContacts = useMemo(() => {
    return filteredMarketplaceData.reduce((acc, item) => acc + item.count, 0);
  }, [filteredMarketplaceData]);
  
  const topSegments = useMemo(() => {
    if (!filteredSummaryData || filteredSummaryData.length === 0) return [];
    return filteredSummaryData
        .slice() 
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
  }, [filteredSummaryData]);
  
  const topMarketplaces = useMemo(() => {
    if (!filteredMarketplaceData || filteredMarketplaceData.length === 0) return [];
    return filteredMarketplaceData
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredMarketplaceData]);

  const marketplaceColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (dashboardStats?.marketplaceSummary || []).forEach((item, index) => {
        map.set(item.marketplace, MARKETPLACE_COLORS[index % MARKETPLACE_COLORS.length]);
    });
    return map;
  }, [dashboardStats]);

  const clientCount = useMemo(() => {
    const clientData = summaryData.find(d => d.type === 'Client');
    return clientData ? clientData.count.toLocaleString() : '0';
  }, [summaryData]);

  const prospectCount = useMemo(() => {
      const prospectData = summaryData.find(d => d.type === 'Prospect');
      return prospectData ? prospectData.count.toLocaleString() : '0';
  }, [summaryData]);

   useEffect(() => {
    const fetchDashboardStats = async () => {
        setIsStatsLoading(true);
        setStatsError(null);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    if (value.length > 0) {
                        params.append(key, value.join(','));
                    }
                } else if (value) {
                    params.append(key, value as string);
                }
            });

            const response = await fetch(`/api/contacts/summary?${params.toString()}`);
            if(!response.ok) throw new Error('Failed to fetch dashboard data.');
            const data: DashboardStats = await response.json();
            setDashboardStats(data);
        } catch (err) {
            setStatsError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsStatsLoading(false);
        }
    };
    
    fetchDashboardStats();
  }, [filters]);
  

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsContactsLoading(true);
      setContactsError(null);
      try {
        const params = new URLSearchParams({
            page: String(currentPage),
            limit: String(CONTACTS_PER_PAGE),
        });

        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    params.append(key, value.join(','));
                }
            } else if (value) {
                params.append(key, value as string);
            }
        });

        const response = await fetch(`/api/contacts?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contacts. Please check the API server.');
        }
        const data = await response.json();
        setContacts(data.contacts);
        setTotalPages(data.totalPages);
        setTotalContactsInTable(data.totalContacts);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setContactsError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsContactsLoading(false);
      }
    };

    fetchContacts();
  }, [currentPage, filters]);

  const handleTextFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMultiSelectChange = (name: 'type' | 'marketplace' | 'product', value: string[]) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.append(key, value.join(','));
        }
      } else if (value) {
        params.append(key, value as string);
      }
    });
    const url = `/api/contacts/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  const typeOptions = [
    { value: 'Client', label: 'Client' },
    { value: 'Prospect', label: 'Prospect' },
    { value: 'Lead', label: 'Lead' }
  ];

  const marketplaceOptions = useMemo(() => {
      const options = [{ value: '_NONE_', label: '[Not Specified]' }];
      if (dashboardStats?.allMarketplaces) {
          dashboardStats.allMarketplaces.forEach(m => options.push({ value: m, label: m }));
      }
      return options;
  }, [dashboardStats?.allMarketplaces]);

  const productOptions = useMemo(() => {
      const options = [{ value: '_NONE_', label: '[Not Specified]' }];
      if (dashboardStats?.allProducts) {
          dashboardStats.allProducts.forEach(p => options.push({ value: p, label: p }));
      }
      return options;
  }, [dashboardStats?.allProducts]);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-36"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="h-5 w-5 bg-gray-200 rounded"></div>
      </td>
    </tr>
  );
  
   const ChartSkeleton = () => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse w-full">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
        </div>
    </div>
  );

  const renderTableBody = () => {
    if (isContactsLoading) {
      return Array.from({ length: CONTACTS_PER_PAGE }).map((_, index) => <SkeletonRow key={index} />);
    }

    if (contactsError) {
      return (
        <tr>
          <td colSpan={6} className="text-center py-10">
            <div className="text-red-500 font-medium">Error: {contactsError}</div>
            <p className="text-gray-500 text-sm mt-2">Could not load contact data. Please make sure the API is running and the database connection is configured correctly.</p>
          </td>
        </tr>
      );
    }
    
    if (contacts.length === 0) {
        return (
          <tr>
            <td colSpan={6} className="text-center py-10">
              <div className="text-gray-500">No contacts found for the selected filters.</div>
            </td>
          </tr>
        );
    }

    return contacts.map((contact) => (
      <tr key={contact.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div>
            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
            <div className="text-sm text-gray-500">{contact.phone}</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyles[contact.type].badge}`}>
            {contact.type}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastMarketplace || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastPurchaseDate || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.lastPurchaseProduct || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button className="text-gray-400 hover:text-indigo-600">
            <DotsVerticalIcon className="w-5 h-5"/>
          </button>
        </td>
      </tr>
    ));
  };
  
  const Pagination = () => {
    const startItem = totalContactsInTable > 0 ? (currentPage - 1) * CONTACTS_PER_PAGE + 1 : 0;
    const endItem = Math.min(currentPage * CONTACTS_PER_PAGE, totalContactsInTable);

    return (
        <div className="py-3 px-4 flex items-center justify-between border-t border-gray-200">
            <div>
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalContactsInTable}</span> results
                </p>
            </div>
            <div className="flex-1 flex justify-end">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isContactsLoading}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || isContactsLoading}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
  };
  
  const renderCustomTooltip = (total: number) => ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data.count;
      const name = data.type || data.marketplace;
      const color = payload[0].color;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-50">
           <div className="flex items-center mb-2">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }}></span>
            <p className="font-bold text-gray-800 text-base">{name}</p>
        </div>
          <p className="text-sm text-gray-600 pl-5">
            Count: <span className="font-medium text-gray-700">{value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-gray-600 pl-5">
            Percentage: <span className="font-medium text-gray-700">{percentage}%</span>
          </p>
        </div>
      );
    }
  
    return null;
  };

  const handleSegmentLegendClick = (segmentType: ContactType) => {
    setActiveSegments(prev => {
        const newActiveSegments = new Set(prev);
        if (newActiveSegments.has(segmentType)) {
            newActiveSegments.delete(segmentType);
        } else {
            newActiveSegments.add(segmentType);
        }
        return newActiveSegments;
    });
  };

  const handleMarketplaceLegendClick = (marketplace: string) => {
      setActiveMarketplaces(prev => {
          const newActiveMarketplaces = new Set(prev);
          if (newActiveMarketplaces.has(marketplace)) {
              newActiveMarketplaces.delete(marketplace);
          } else {
              newActiveMarketplaces.add(marketplace);
          }
          return newActiveMarketplaces;
      });
  };

  const renderSegmentLegend = (
    data: TypeSummaryData[], 
    activeItems: Set<ContactType>, 
    clickHandler: (item: ContactType) => void
  ) => {
    if (!data.length) return null;
    return (
        <div className="flex justify-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs">
            {summaryData.map((entry, index) => {
                const isActive = activeItems.has(entry.type);
                return (
                    <div
                        key={`item-${index}`}
                        onClick={() => clickHandler(entry.type)}
                        className={`flex items-center cursor-pointer transition-all duration-200 rounded-full px-2 py-0.5 ${isActive ? 'opacity-100 bg-gray-50' : 'opacity-40'} ${isActive && 'hover:bg-gray-200'}`}
                    >
                        <span className="w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: typeStyles[entry.type].chart }}></span>
                        <span className="text-gray-700">{entry.type}</span>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderMarketplaceLegend = (
    data: MarketplaceSummaryData[], 
    activeItems: Set<string>, 
    clickHandler: (item: string) => void
  ) => {
    if (!data.length) return null;
    return (
        <div className="flex justify-center flex-wrap gap-x-2 gap-y-1 mt-2 text-xs">
            {marketplaceData.map((entry, index) => {
                const isActive = activeItems.has(entry.marketplace);
                const color = marketplaceColorMap.get(entry.marketplace) || '#CCC';
                return (
                    <div
                        key={`item-${index}`}
                        onClick={() => clickHandler(entry.marketplace)}
                        className={`flex items-center cursor-pointer transition-all duration-200 rounded-full px-2 py-0.5 ${isActive ? 'opacity-100 bg-gray-50' : 'opacity-40'} ${isActive && 'hover:bg-gray-200'}`}
                    >
                        <span className="w-2 h-2 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: color }}></span>
                        <span className="text-gray-700">{entry.marketplace}</span>
                    </div>
                );
            })}
        </div>
    );
  };


  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Contacts by Type</h3>
                {isStatsLoading ? (
                    <div className="h-72 flex items-center justify-center"><ChartSkeleton /></div>
                ) : statsError ? (
                    <div className="text-red-500 text-center py-10">{statsError}</div>
                ) : (
                    <>
                        <div className="relative w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        // FIX: The `recharts` library's data prop can have typing conflicts with
                                        // strictly-typed objects. Casting to `any` resolves this without affecting functionality.
                                        data={filteredSummaryData as any}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="type"
                                        cornerRadius={5}
                                    >
                                        {filteredSummaryData.map((entry) => (
                                            <Cell key={`cell-${entry.type}`} fill={typeStyles[entry.type].chart} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                      wrapperStyle={{ zIndex: 1000 }}
                                      content={renderCustomTooltip(totalContactsSummary)}
                                      cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend
                                      verticalAlign="bottom"
                                      content={() => renderSegmentLegend(summaryData, activeSegments, handleSegmentLegendClick)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">{totalContactsSummary.toLocaleString()}</span>
                                <p className="text-sm text-gray-500">Total Contacts</p>
                            </div>
                        </div>
                        {topSegments.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 pt-4 border-t border-gray-100">
                                {topSegments.map(item => (
                                    <div key={item.type} className="flex items-center text-sm">
                                        <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: typeStyles[item.type].chart }}></span>
                                        <div className="flex flex-col">
                                            <span className="text-gray-600">{item.type}</span>
                                            <span className="font-bold text-gray-800">
                                                {item.count.toLocaleString()}
                                                <span className="text-gray-500 font-normal ml-1">
                                                    ({totalContactsSummary > 0 ? ((item.count / totalContactsSummary) * 100).toFixed(1) : 0}%)
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">Contacts by Last Marketplace</h3>
                {isStatsLoading ? (
                    <div className="h-72 flex items-center justify-center"><ChartSkeleton /></div>
                ) : statsError ? (
                    <div className="text-red-500 text-center py-10">{statsError}</div>
                ) : (
                    <>
                        <div className="relative w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        // FIX: The `recharts` library's data prop can have typing conflicts with
                                        // strictly-typed objects. Casting to `any` resolves this without affecting functionality.
                                        data={filteredMarketplaceData as any}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="marketplace"
                                        cornerRadius={5}
                                    >
                                        {filteredMarketplaceData.map((entry) => (
                                            <Cell key={`cell-${entry.marketplace}`} fill={marketplaceColorMap.get(entry.marketplace)} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                      wrapperStyle={{ zIndex: 1000 }}
                                      content={renderCustomTooltip(totalMarketplaceContacts)}
                                      cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend
                                      verticalAlign="bottom"
                                      content={() => renderMarketplaceLegend(marketplaceData, activeMarketplaces, handleMarketplaceLegendClick)}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="text-3xl font-bold text-gray-800">{totalMarketplaceContacts.toLocaleString()}</span>
                                <p className="text-sm text-gray-500 leading-tight">Marketplace<br/>Contacts</p>
                            </div>
                        </div>
                        {topMarketplaces.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 pt-4 border-t border-gray-100">
                                {topMarketplaces.map((item) => (
                                    <div key={item.marketplace} className="flex items-center text-sm">
                                        <span className="w-3 h-3 rounded-full mr-2 shrink-0" style={{ backgroundColor: marketplaceColorMap.get(item.marketplace) }}></span>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-gray-600 truncate" title={item.marketplace}>{item.marketplace}</span>
                                            <span className="font-bold text-gray-800">
                                                {item.count.toLocaleString()}
                                                <span className="text-gray-500 font-normal ml-1">
                                                    ({totalMarketplaceContacts > 0 ? ((item.count / totalMarketplaceContacts) * 100).toFixed(1) : 0}%)
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>

        {(isContactsLoading || isStatsLoading) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>
        ) : !(contactsError || statsError) ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard title="Total Contacts" value={(dashboardStats?.totalContacts || 0).toLocaleString()} icon={UserGroupIcon} iconColor="bg-blue-500" />
                <KpiCard title="Clients" value={clientCount} icon={UserCheckIcon} iconColor="bg-green-500" />
                <KpiCard title="Prospects" value={prospectCount} icon={UserSearchIcon} iconColor="bg-yellow-500" />
            </div>
        ) : null}

        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">All Contacts ({totalContactsInTable})</h3>
                  <div className="flex space-x-2">
                      <button 
                        onClick={handleExport}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Export
                      </button>
                  </div>
              </div>
            </div>
             {/* Filter Section */}
            <div className="px-4 sm:px-6 py-4 border-t border-b border-gray-200 bg-gray-50/50">
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            name="name"
                            placeholder="Filter by Name..."
                            value={filters.name}
                            onChange={handleTextFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                        />
                         <MultiSelectDropdown
                            options={typeOptions}
                            selected={filters.type}
                            onChange={(selected) => handleMultiSelectChange('type', selected)}
                            placeholder="All Contact Types"
                        />
                        <MultiSelectDropdown
                            options={marketplaceOptions}
                            selected={filters.marketplace}
                            onChange={(selected) => handleMultiSelectChange('marketplace', selected)}
                            placeholder="All Last Marketplaces"
                            disabled={isStatsLoading}
                        />
                        <MultiSelectDropdown
                            options={productOptions}
                            selected={filters.product}
                            onChange={(selected) => handleMultiSelectChange('product', selected)}
                            placeholder="All Last Purchase Product"
                            disabled={isStatsLoading}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700">Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleTextFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            title="Start Date"
                        />
                         <span className="text-gray-500">-</span>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleTextFilterChange}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                            title="End Date"
                        />
                    </div>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Marketplace</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase Product</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {renderTableBody()}
                    </tbody>
                </table>
            </div>
             {!contactsError && totalPages > 0 && <Pagination />}
        </div>
    </div>
  );
};

export default CrmView;