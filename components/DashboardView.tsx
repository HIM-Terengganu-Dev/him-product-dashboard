import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

// Mock Data
const salesData = [
  { name: 'Jan', sales: 4000, revenue: 2400 },
  { name: 'Feb', sales: 3000, revenue: 1398 },
  { name: 'Mar', sales: 2000, revenue: 9800 },
  { name: 'Apr', sales: 2780, revenue: 3908 },
  { name: 'May', sales: 1890, revenue: 4800 },
  { name: 'Jun', sales: 2390, revenue: 3800 },
  { name: 'Jul', sales: 3490, revenue: 4300 },
];

const leadsData = [
  { name: 'Organic', value: 400, color: '#4f46e5' },
  { name: 'Referral', value: 300, color: '#7c3aed' },
  { name: 'Paid Ads', value: 300, color: '#0ea5e9' },
  { name: 'Social', value: 200, color: '#10b981' },
];

interface KpiCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, isPositive }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-3xl font-bold mt-2 text-gray-800">{value}</p>
        <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
            <span>{change} vs last month</span>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Total Revenue" value="$45,231.89" change="+20.1%" isPositive={true} />
            <KpiCard title="New Leads" value="+1,230" change="+12.5%" isPositive={true} />
            <KpiCard title="Orders" value="3,450" change="-2.4%" isPositive={false} />
            {/* FIX: Added missing 'change' prop to satisfy the KpiCardProps interface. */}
            <KpiCard title="Conversion Rate" value="12.3%" change="+1.8%" isPositive={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Sales Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#4f46e5" name="Revenue" />
                        <Bar dataKey="sales" fill="#7c3aed" name="Sales Units" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Lead Sources</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={leadsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                            {leadsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Revenue Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}/>
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default DashboardView;