import React from 'react';
import { TrendingUpIcon, UserGroupIcon, UserSearchIcon, PercentIcon, DotsVerticalIcon } from './Icons';


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

// Mock Data for Recent Activity
const recentActivity = [
  { id: 1, name: 'Eleanor Pena', type: 'Lead', status: 'New', date: '2023-11-01' },
  { id: 2, name: 'Cody Fisher', type: 'Prospect', status: 'Contacted', date: '2023-11-01' },
  { id: 3, name: 'Brooklyn Simmons', type: 'Lead', status: 'Qualified', date: '2023-10-31' },
  { id: 4, name: 'Esther Howard', type: 'Prospect', status: 'Proposal Sent', date: '2023-10-30' },
  { id: 5, name: 'Cameron Williamson', type: 'Lead', status: 'Nurturing', date: '2023-10-30' },
];

const statusStyles: { [key: string]: string } = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Qualified': 'bg-green-100 text-green-800',
  'Proposal Sent': 'bg-purple-100 text-purple-800',
  'Nurturing': 'bg-indigo-100 text-indigo-800',
};


const LeadsProspectsMainView: React.FC = () => {
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Leads" value="1,280" icon={UserSearchIcon} iconColor="bg-blue-500" />
            <KpiCard title="Total Prospects" value="450" icon={UserGroupIcon} iconColor="bg-yellow-500" />
            <KpiCard title="Conversion Rate" value="15.2%" icon={PercentIcon} iconColor="bg-green-500" />
            <KpiCard title="New Leads (Month)" value="+180" icon={TrendingUpIcon} iconColor="bg-purple-500" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recentActivity.map((activity) => (
                            <tr key={activity.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[activity.status] || 'bg-gray-100 text-gray-800'}`}>
                                        {activity.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.date}</td>
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

export default LeadsProspectsMainView;