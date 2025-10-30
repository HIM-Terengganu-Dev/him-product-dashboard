import React, { useState, useMemo } from 'react';
import { StarIcon, CurrencyDollarIcon, RefreshIcon, UserIcon, DotsVerticalIcon } from './Icons';

type Product = "HIM Coffee" | "HER Coffee" | "Spray Up" | "Vigomax";
type Segment = "Loyal Client" | "High-Spender Client" | "Repeat Client" | "One-time Client";

// Mock Data
const clientsData: { id: number; name: string; email: string; product: Product; segment: Segment; totalSpent: number; aov: number; }[] = [
  { id: 1, name: 'Lucas Chen', email: 'lucas.c@example.com', product: 'HIM Coffee', segment: 'Loyal Client', totalSpent: 2500, aov: 125 },
  { id: 2, name: 'Mia Patel', email: 'mia.p@example.com', product: 'HER Coffee', segment: 'High-Spender Client', totalSpent: 5200, aov: 472 },
  { id: 3, name: 'Owen Kim', email: 'owen.k@example.com', product: 'Spray Up', segment: 'Repeat Client', totalSpent: 850, aov: 85 },
  { id: 4, name: 'Chloe Garcia', email: 'chloe.g@example.com', product: 'Vigomax', segment: 'Loyal Client', totalSpent: 3100, aov: 155 },
  { id: 5, name: 'Ethan Nguyen', email: 'ethan.n@example.com', product: 'HIM Coffee', segment: 'One-time Client', totalSpent: 120, aov: 120 },
  { id: 6, name: 'Zoe Singh', email: 'zoe.s@example.com', product: 'HER Coffee', segment: 'Repeat Client', totalSpent: 1100, aov: 110 },
  { id: 7, name: 'Leo Martinez', email: 'leo.m@example.com', product: 'Spray Up', segment: 'High-Spender Client', totalSpent: 4800, aov: 600 },
  { id: 8, name: 'Isla Brown', email: 'isla.b@example.com', product: 'Vigomax', segment: 'Repeat Client', totalSpent: 950, aov: 95 },
  { id: 9, name: 'Kai Wilson', email: 'kai.w@example.com', product: 'HIM Coffee', segment: 'Loyal Client', totalSpent: 2800, aov: 140 },
  { id: 10, name: 'Nora Jones', email: 'nora.j@example.com', product: 'HER Coffee', segment: 'One-time Client', totalSpent: 95, aov: 95 },
];

const products: Product[] = ["HIM Coffee", "HER Coffee", "Spray Up", "Vigomax"];

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

const segmentStyles: { [key in Segment]: string } = {
    'Loyal Client': 'bg-green-100 text-green-800',
    'High-Spender Client': 'bg-purple-100 text-purple-800',
    'Repeat Client': 'bg-blue-100 text-blue-800',
    'One-time Client': 'bg-gray-100 text-gray-800',
};

const ClientSegmentView: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<Product | 'All'>('All');

  const filteredClients = useMemo(() => {
    if (activeFilter === 'All') {
      return clientsData;
    }
    return clientsData.filter(client => client.product === activeFilter);
  }, [activeFilter]);
  
  const kpiValues = useMemo(() => {
    const data = activeFilter === 'All' ? clientsData : filteredClients;
    return {
      loyal: data.filter(c => c.segment === 'Loyal Client').length,
      highSpender: data.filter(c => c.segment === 'High-Spender Client').length,
      repeat: data.filter(c => c.segment === 'Repeat Client').length,
      oneTime: data.filter(c => c.segment === 'One-time Client').length,
    }
  }, [activeFilter, filteredClients]);

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Loyal Client" value={kpiValues.loyal.toString()} icon={StarIcon} iconColor="bg-yellow-500" />
            <KpiCard title="High-Spender Client" value={kpiValues.highSpender.toString()} icon={CurrencyDollarIcon} iconColor="bg-purple-500" />
            <KpiCard title="Repeat Client" value={kpiValues.repeat.toString()} icon={RefreshIcon} iconColor="bg-blue-500" />
            <KpiCard title="One-time Client" value={kpiValues.oneTime.toString()} icon={UserIcon} iconColor="bg-gray-500" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Client Segments by Product</h3>
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => setActiveFilter('All')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'All' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      All
                    </button>
                    {products.map(product => (
                      <button 
                        key={product}
                        onClick={() => setActiveFilter(product)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === product ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {product}
                      </button>
                    ))}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AOV</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.map((client) => (
                            <tr key={client.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                        <div className="text-sm text-gray-500">{client.email}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.product}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${segmentStyles[client.segment]}`}>
                                        {client.segment}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {`$${client.totalSpent.toLocaleString()}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {`$${client.aov.toLocaleString()}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-gray-400 hover:text-indigo-600">
                                        <DotsVerticalIcon className="w-5 h-5"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ClientSegmentView;