// TypeScript types for the Developer Ticketing System

export type TicketCategory = 'bug' | 'feature_request' | 'question' | 'improvement' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    submitted_by_email: string;
    submitted_by_name: string;
    page_url?: string;
    browser_info?: string;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    developer_notes?: string;
    reply_count?: number;
}

export interface SubmitTicketRequest {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    page_url?: string;
}

export interface SubmitTicketResponse {
    success: boolean;
    ticketId?: string;
    message?: string;
}

export interface ListTicketsResponse {
    success: boolean;
    tickets: Ticket[];
    isAdmin: boolean;
}

export interface UpdateTicketRequest {
    ticketId: string;
    status?: TicketStatus;
    developer_notes?: string;
    resolved_at?: string;
}

export interface UpdateTicketResponse {
    success: boolean;
    message?: string;
}

// Ticket Reply types for chat functionality
export interface TicketReply {
    id: string;
    ticket_id: string;
    author_email: string;
    author_name: string;
    author_picture?: string;
    message: string;
    created_at: string;
    updated_at: string;
}

export interface PostReplyRequest {
    ticketId: string;
    message: string;
}

export interface PostReplyResponse {
    success: boolean;
    replyId?: string;
    message?: string;
}

export interface GetRepliesResponse {
    success: boolean;
    replies: TicketReply[];
}
