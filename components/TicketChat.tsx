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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef<boolean>(true);
    const isInitialLoadRef = useRef<boolean>(true);
    const isAdmin = isDeveloper(user.email);

    // Check if user is near bottom of scroll container
    const isNearBottom = (): boolean => {
        const container = messagesContainerRef.current;
        if (!container) return true;
        
        const threshold = 150; // pixels from bottom
        const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        return distanceFromBottom < threshold;
    };

    // Scroll to bottom smoothly
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Scroll to bottom instantly (for initial load)
    const scrollToBottomInstant = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    const fetchReplies = async (showLoading: boolean = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await fetch(`/api/tickets/replies/${ticketId}?userEmail=${encodeURIComponent(user.email)}`);
            const data: GetRepliesResponse = await response.json();

            if (data.success) {
                const wasNearBottom = isNearBottom();
                const previousLength = replies.length;
                
                setReplies(data.replies);
                
                // Auto-scroll logic
                if (isInitialLoadRef.current) {
                    // Initial load - scroll to bottom instantly
                    isInitialLoadRef.current = false;
                    setTimeout(() => scrollToBottomInstant(), 50);
                } else if (shouldAutoScrollRef.current || wasNearBottom) {
                    // User sent a message or is near bottom - scroll to show new messages
                    setTimeout(() => scrollToBottom(), 100);
                }
                // If user scrolled up, maintain their position (don't auto-scroll)
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
        isInitialLoadRef.current = true;
        fetchReplies(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketId, user.email]);

    // Track scroll position to determine if we should auto-scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            shouldAutoScrollRef.current = isNearBottom();
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!newMessage.trim()) return;

        const messageText = newMessage.trim();
        setNewMessage('');
        setSending(true);
        shouldAutoScrollRef.current = true; // User sent message, so auto-scroll

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
        
        // Scroll to show optimistic message
        setTimeout(() => scrollToBottom(), 50);

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
                // Refresh after successful send
                requestAnimationFrame(() => {
                    fetchReplies(false);
                });
            } else {
                // Remove optimistic reply on error
                setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
                setNewMessage(messageText); // Restore message
                alert('Failed to send reply');
                shouldAutoScrollRef.current = false;
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
            // Remove optimistic reply on error
            setReplies(prev => prev.filter(r => r.id !== optimisticReply.id));
            setNewMessage(messageText); // Restore message
            alert('Error sending reply');
            shouldAutoScrollRef.current = false;
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleString('en-MY', { 
            month: 'short', 
            day: 'numeric', 
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Conversation
                    <span className="text-sm font-normal text-gray-500">({replies.length + 1} messages)</span>
                </h4>
                <button
                    onClick={() => fetchReplies(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                    disabled={loading}
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {/* Messages Container */}
            <div 
                ref={messagesContainerRef}
                className="flex-1 bg-gray-50 rounded-lg p-4 mb-4 overflow-y-auto space-y-4 min-h-[400px] max-h-[600px]"
            >
                {loading && replies.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent mb-3"></div>
                            <p className="text-sm text-gray-600">Loading messages...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Original Ticket Description as First Message */}
                        <div className="flex gap-3">
                            <img
                                src={ticketAuthorPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticketAuthorName)}&background=6366f1&color=fff&size=128`}
                                alt={ticketAuthorName}
                                className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-indigo-200"
                            />
                            <div className="flex-1 flex flex-col items-start min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-sm font-semibold text-gray-900">{ticketAuthorName}</span>
                                    {isDeveloper(ticketAuthorEmail) && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">DEV</span>
                                    )}
                                    <span className="text-xs text-gray-500">{formatTime(ticketCreatedAt)}</span>
                                </div>
                                <div className="px-4 py-3 rounded-2xl max-w-[85%] bg-indigo-50 border border-indigo-100 text-gray-800 shadow-sm">
                                    <p className="text-xs font-semibold text-indigo-900 mb-1.5 uppercase tracking-wide">Ticket Description</p>
                                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{ticketDescription}</p>
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
                                        src={reply.author_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author_name)}&background=6366f1&color=fff&size=128`}
                                        alt={reply.author_name}
                                        className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-gray-200"
                                    />
                                    <div className={`flex-1 flex flex-col min-w-0 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-center gap-2 mb-1.5 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                                            <span className="text-sm font-semibold text-gray-900">{reply.author_name}</span>
                                            {isDevMessage && (
                                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">DEV</span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                                {isOptimistic ? (
                                                    <span className="italic text-indigo-600">Sending...</span>
                                                ) : (
                                                    formatTime(reply.created_at)
                                                )}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-3 rounded-2xl max-w-[85%] shadow-sm ${
                                            isOwnMessage
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border border-gray-200 text-gray-800'
                                        } ${isOptimistic ? 'opacity-70' : ''}`}>
                                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{reply.message}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Scroll anchor */}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="flex gap-3 items-end">
                <div className="flex-shrink-0">
                    <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border-2 border-indigo-200"
                    />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(e);
                            }
                        }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Press Enter to send, Shift+Enter for new line</span>
                        <span className="text-indigo-600 font-medium">{newMessage.length} characters</span>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="flex-shrink-0 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-xl"
                >
                    {sending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            <span>Send</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TicketChat;
