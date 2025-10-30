import React, { useState, useMemo } from 'react';
import { UserCheckIcon, UserExclamationIcon, UserMinusIcon, DotsVerticalIcon, UserPlusIcon } from './Icons';

type Product = "HIM Coffee" | "HER Coffee" | "Spray Up" | "Vigomax";
type Status = "Active" | "Churning" | "Churned" | "New Client";

// Mock Data
const clientsData: { id: number; name: string; email: string; product: Product; status: Status; lastPurchase: string; }[] = [
  { id: 1, name: 'Carlos Rodriguez', email: 'carlos.r@example.com', product: 'HIM Coffee', status: 'Active', lastPurchase: '2023-10-28' },
  { id: 2, name: 'Sofia Gomez', email: 'sofia.g@example.com', product: 'HER Coffee', status: 'Active', lastPurchase: '2023-10-27' },
  { id: 3, name: 'Liam Johnson', email: 'liam.j@example.com', product: 'Spray Up', status: 'Churning', lastPurchase: '2023-08-15' },
  { id: 4, name: 'Olivia Brown', email: 'olivia.b@example.com', product: 'Vigomax', status: 'Active', lastPurchase: '2023-10-20' },
  { id: 5, name: 'Noah Williams', email: 'noah.w@example.com', product: 'HIM Coffee', status: 'Churned', lastPurchase: '2023-05-01' },
  { id: 6, name: 'Emma Garcia', email: 'emma.g@example.com', product: 'HER Coffee', status: 'Active', lastPurchase: '2023-10-29' },
  { id: 7, name: 'James Miller', email: 'james.m@example.com', product: 'Spray Up', status: 'Active', lastPurchase: '2023-10-15' },
  { id: 8, name: 'Isabella Davis', email: 'isabella.d@example.com', product: 'Vigomax', status: 'Churning', lastPurchase: '2023-09-02' },
  { id: 9, name: 'Ava Martinez', email: 'ava.m@example.com', product: 'HIM Coffee', status: 'New Client', lastPurchase: '2023-10-30' },
  { id: 10, name: 'Michael Lee', email: 'michael.l@example.com', product: 'Vigomax', status: 'New Client', lastPurchase: '2023-10-31' },
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

const statusStyles: { [key in Status]: string } = {
    'Active': 'bg-green-100 text-green-800',
    'Churning': 'bg-yellow-100 text-yellow-800',
    'Churned': 'bg-red-100 text-red-800',
    'New Client': 'bg-blue-100 text-blue-800',
};

const ClientStatusView: React.FC = () => {
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
      active: data.filter(c => c.status === 'Active').length,
      churning: data.filter(c => c.status === 'Churning').length,
      churned: data.filter(c => c.status === 'Churned').length,
      newClient: data.filter(c => c.status === 'New Client').length,
    }
  }, [activeFilter, filteredClients]);

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="New Client" value={kpiValues.newClient.toString()} icon={UserPlusIcon} iconColor="bg-blue-500" />
            <KpiCard title="Active Client" value={kpiValues.active.toString()} icon={UserCheckIcon} iconColor="bg-green-500" />
            <KpiCard title="Churning Client" value={kpiValues.churning.toString()} icon={UserExclamationIcon} iconColor="bg-yellow-500" />
            <KpiCard title="Churned Client" value={kpiValues.churned.toString()} icon={UserMinusIcon} iconColor="bg-red-500" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 sm:mb-0">Clients by Product</h3>
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Purchase</th>
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
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[client.status]}`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.lastPurchase}</td>
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

export default ClientStatusView;