'use client';

import React, { useState, useEffect } from 'react';
import type { Ticket, ListTicketsResponse, SubmitTicketRequest, UpdateTicketRequest } from '../types/tickets';

interface User {
    name: string;
    email: string;
    picture: string;
}

interface TicketingViewProps {
    user: User;
}

const TicketingView: React.FC<TicketingViewProps> = ({ user }) => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'bug' | 'feature_request' | 'question' | 'improvement' | 'other'>('question');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const statusParam = filterStatus !== 'all' ? `&status=${filterStatus}` : '';
            const response = await fetch(`/api/tickets/list?userEmail=${encodeURIComponent(user.email)}${statusParam}`);
            const data: ListTicketsResponse = await response.json();

            if (data.success) {
                setTickets(data.tickets);
                setIsAdmin(data.isAdmin);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user.email, filterStatus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const requestData: SubmitTicketRequest & { userEmail: string; userName: string } = {
                title,
                description,
                category,
                priority,
                page_url: window.location.href,
                userEmail: user.email,
                userName: user.name,
            };

            const response = await fetch('/api/tickets/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                // Reset form
                setTitle('');
                setDescription('');
                setCategory('question');
                setPriority('medium');
                setShowForm(false);

                // Refresh tickets
                fetchTickets();
                alert('Ticket submitted successfully!');
            } else {
                alert('Failed to submit ticket');
            }
        } catch (error) {
            console.error('Failed to submit ticket:', error);
            alert('Error submitting ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string, status: string) => {
        try {
            const requestData: UpdateTicketRequest & { userEmail: string } = {
                ticketId,
                status: status as any,
                userEmail: user.email,
            };

            const response = await fetch('/api/tickets/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (result.success) {
                fetchTickets();
            } else {
                alert('Failed to update ticket status');
            }
        } catch (error) {
            console.error('Failed to update ticket:', error);
            alert('Error updating ticket');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-600';
            case 'medium': return 'bg-blue-100 text-blue-600';
            case 'high': return 'bg-orange-100 text-orange-600';
            case 'urgent': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Support Tickets</h2>
                    <p className="text-gray-600 mt-1">
                        {isAdmin ? 'Manage all support tickets' : 'View and submit support tickets'}
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                    {showForm ? 'Cancel' : '+ New Ticket'}
                </button>
            </div>

            {/* New Ticket Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit New Ticket</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Brief description of the issue"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Detailed description of the issue or request"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="bug">Bug Report</option>
                                    <option value="feature_request">Feature Request</option>
                                    <option value="question">Question</option>
                                    <option value="improvement">Improvement</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Filter by status:</span>
                    <div className="flex flex-wrap gap-2">
                        {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="text-gray-600 mt-4">Loading tickets...</p>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
                        <p className="text-gray-600">
                            {filterStatus === 'all' ? 'No tickets have been submitted yet.' : `No ${filterStatus.replace('_', ' ')} tickets found.`}
                        </p>
                    </div>
                ) : (
                    tickets.map((ticket) => (
                        <div key={ticket.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                            {ticket.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-line">{ticket.description}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {ticket.submitted_by_name}
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    {ticket.category.replace('_', ' ')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatDate(ticket.created_at)}
                                </span>
                                {isAdmin && (
                                    <span className="text-indigo-600 font-medium">
                                        {ticket.submitted_by_email}
                                    </span>
                                )}
                            </div>

                            {/* Admin Controls */}
                            {isAdmin && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">Update Status:</span>
                                        {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(ticket.id, status)}
                                                disabled={ticket.status === status}
                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${ticket.status === status
                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                                    }`}
                                            >
                                                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </button>
                                        ))}
                                    </div>
                                    {ticket.developer_notes && (
                                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Developer Notes:</p>
                                            <p className="text-sm text-gray-600">{ticket.developer_notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TicketingView;
