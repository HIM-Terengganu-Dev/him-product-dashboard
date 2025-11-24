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
                {/* Minimal Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Link 
                                href="/sales-portal?view=Support Tickets"
                                className="flex-shrink-0 text-indigo-600 hover:text-indigo-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <h1 className="text-lg font-semibold text-gray-900 truncate">{ticket.title}</h1>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority.toUpperCase()}
                            </span>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                {['open', 'in_progress', 'resolved', 'closed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleUpdateStatus(status)}
                                        disabled={ticket.status === status}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${ticket.status === status
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                            }`}
                                    >
                                        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </button>
                                ))}
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

