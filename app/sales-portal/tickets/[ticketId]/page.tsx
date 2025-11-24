'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TicketChat from '../../../../components/TicketChat';
import { isDeveloper } from '../../../../lib/auth-utils';
import type { Ticket, UpdateTicketRequest } from '../../../../types/tickets';

interface User {
    name: string;
    email: string;
    picture: string;
}

function TicketPageContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const ticketId = params?.ticketId as string;

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAdmin(isDeveloper(userData.email));
        }
    }, []);

    useEffect(() => {
        if (!user || !ticketId) return;

        const fetchTicket = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/tickets/list?userEmail=${encodeURIComponent(user.email)}`);
                const data = await response.json();

                if (data.success) {
                    const foundTicket = data.tickets.find((t: Ticket) => t.id === ticketId);
                    if (foundTicket) {
                        setTicket(foundTicket);
                    } else {
                        // Ticket not found or no access
                        router.push('/sales-portal?view=Support Tickets');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch ticket:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [user, ticketId, router]);

    const handleUpdateStatus = async (status: string) => {
        if (!user || !ticket) return;

        try {
            const requestData: UpdateTicketRequest & { userEmail: string } = {
                ticketId: ticket.id,
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
                setTicket({ ...ticket, status: status as any });
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

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to view tickets</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-gray-600 mt-4">Loading ticket...</p>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Ticket not found</p>
                    <Link href="/sales-portal?view=Support Tickets" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
                        ← Back to Tickets
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link 
                        href="/sales-portal?view=Support Tickets"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4 text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Tickets
                    </Link>
                    
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div className="flex-1">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                                        {ticket.priority.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {ticket.category.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                            <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">{ticket.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200 mb-4">
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {ticket.submitted_by_name}
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
                            <div className="pt-4 border-t border-gray-200">
                                <div className="flex flex-wrap items-center gap-3 mb-3">
                                    <span className="text-sm font-medium text-gray-700">Update Status:</span>
                                    {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(status)}
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
                                    <div className="p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Developer Notes:</p>
                                        <p className="text-sm text-gray-600">{ticket.developer_notes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <TicketChat
                        ticketId={ticket.id}
                        user={user}
                        ticketDescription={ticket.description}
                        ticketAuthorName={ticket.submitted_by_name}
                        ticketAuthorEmail={ticket.submitted_by_email}
                        ticketCreatedAt={ticket.created_at}
                    />
                </div>
            </div>
        </div>
    );
}

export default function TicketPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                    <p className="text-gray-600 mt-4">Loading...</p>
                </div>
            </div>
        }>
            <TicketPageContent />
        </Suspense>
    );
}

