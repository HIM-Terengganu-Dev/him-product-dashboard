'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { TicketReply, GetRepliesResponse, PostReplyResponse } from '../types/tickets';
import { isDeveloper } from '../lib/auth-utils';

interface User {
    name: string;
    email: string;
    picture: string;
}

interface TicketChatProps {
    ticketId: string;
    user: User;
    ticketDescription: string;
    ticketAuthorName: string;
    ticketAuthorEmail: string;
    ticketAuthorPicture?: string;
    ticketCreatedAt: string;
}

const TicketChat: React.FC<TicketChatProps> = ({
    ticketId,
    user,
    ticketDescription,
    ticketAuthorName,
    ticketAuthorEmail,
    ticketAuthorPicture,
    ticketCreatedAt
}) => {
    const [replies, setReplies] = useState<TicketReply[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const isAdmin = isDeveloper(user.email);

    const fetchReplies = async (showLoading: boolean = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await fetch(`/api/tickets/replies/${ticketId}?userEmail=${encodeURIComponent(user.email)}`);
            const data: GetRepliesResponse = await response.json();

            if (data.success) {
                setReplies(data.replies);
            }
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchReplies(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, user.email]);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);

        // Optimistic update - add message immediately
        const optimisticReply: TicketReply = {
            id: `temp-${Date.now()}`,
            ticket_id: ticketId,
            author_email: user.email,
            author_name: user.name,
            author_picture: user.picture,
            message: messageText,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        setReplies(prev => [...prev, optimisticReply]);

        try {
            const response = await fetch('/api/tickets/replies/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId,
                    message: messageText,
                    userEmail: user.email,
                    userName: user.name,
                    userPicture: user.picture,
                }),
            });

            const result: PostReplyResponse = await response.json();

            if (result.success) {
                // Replace optimistic reply with real one from server
                // Refresh after successful send to get the real message from server
                // Use requestAnimationFrame to prevent scroll jump
                requestAnimationFrame(() => {
                    fetchReplies(false);
                });
            } else {
                // Remove optimistic reply on error
                setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
                setNewMessage(messageText); // Restore message
                alert('Failed to send reply');
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
            // Remove optimistic reply on error
            setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
            setNewMessage(messageText); // Restore message
            alert('Error sending reply');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 24) {
            return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleString('en-MY', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="border-t border-gray-200 mt-4 pt-4">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Conversation ({replies.length + 1})
                </h4>
                <button
                    onClick={() => fetchReplies(true)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                    disabled={loading}
                >
                    <svg className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Messages */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto space-y-3">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent"></div>
                        <p className="text-sm text-gray-600 mt-2">Loading messages...</p>
                    </div>
                ) : replies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <>
                        {/* Original Ticket Description as First Message */}
                        <div className="flex gap-3">
                            <img
                                src={ticketAuthorPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticketAuthorName)}&background=6366f1&color=fff`}
                                alt={ticketAuthorName}
                                className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 flex flex-col items-start">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-gray-700">{ticketAuthorName}</span>
                                    {isDeveloper(ticketAuthorEmail) && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">DEV</span>
                                    )}
                                    <span className="text-xs text-gray-500">{formatTime(ticketCreatedAt)}</span>
                                </div>
                                <div className="px-4 py-3 rounded-lg max-w-md bg-indigo-50 border border-indigo-100 text-gray-800 shadow-sm">
                                    <p className="text-xs font-semibold text-indigo-900 mb-1 uppercase tracking-wide">Description</p>
                                    <p className="text-sm whitespace-pre-wrap break-words">{ticketDescription}</p>
                                </div>
                            </div>
                        </div>

                        {/* Replies */}
                        {replies.map((reply) => {
                            const isOwnMessage = reply.author_email === user.email;
                            const isDevMessage = isDeveloper(reply.author_email);
                            const isOptimistic = reply.id.startsWith('temp-');

                            return (
                                <div key={reply.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                    <img
                                        src={reply.author_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author_name)}&background=6366f1&color=fff`}
                                        alt={reply.author_name}
                                        className="w-8 h-8 rounded-full flex-shrink-0"
                                    />
                                    <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-gray-700">{reply.author_name}</span>
                                            {isDevMessage && (
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">DEV</span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {isOptimistic ? 'Sending...' : formatTime(reply.created_at)}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg max-w-md ${isOwnMessage
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border border-gray-200 text-gray-800'
                                            } ${isOptimistic ? 'opacity-75' : ''}`}>
                                            <p className="text-sm whitespace-pre-wrap break-words">{reply.message}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {replies.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                No replies yet. Be the first to respond!
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="flex gap-2" onKeyDown={(e) => {
                // Prevent form submission from causing page scroll
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                }
            }}>
                <div className="flex-shrink-0">
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                    />
                </div>
                <div className="flex-1 flex gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={2}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketChat;
