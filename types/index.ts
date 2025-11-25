// Shared TypeScript types and interfaces

// ==================== Common Types ====================
export type ContactType = 'Client' | 'Prospect' | 'Lead';

export type ViewType =
  | "Dashboard"
  | "Orders"
  | "CRM"
  | "Client Status"
  | "Client Segment"
  | "Prospect Status"
  | "Sales"
  | "Sales BI All"
  | "Sales BI TikTok"
  | "Sales BI Shopee"
  | "Sales BI WhatsApp"
  | "Sales BI Lazada"
  | "Sales Data Management"
  | "Sales Data TikTok"
  | "Sales Data Shopee"
  | "Sales Data WhatsApp"
  | "Sales Data Lazada"
  | "Products"
  | "Messages"
  | "Settings"
  | "Support Tickets";

// ==================== Contact Types ====================
export interface Contact {
  id: string;
  name: string;
  phone: string;
  type: ContactType;
  lastPurchaseDate: string | null;
  lastPurchaseProduct: string | null;
  lastMarketplace: string | null;
}

export interface TypeSummaryData {
  type: ContactType;
  count: number;
}

export interface MarketplaceSummaryData {
  marketplace: string;
  count: number;
}

export interface SummaryData {
  typeSummary: TypeSummaryData[];
  marketplaceSummary: MarketplaceSummaryData[];
  totalContacts: number;
}

export interface FilterOptions {
  allMarketplaces: string[];
  allProducts: string[];
}

export interface UnifiedResponse {
  contacts: Contact[];
  totalContactsInTable: number;
  totalPages: number;
  summary: SummaryData;
  filterOptions: FilterOptions;
}

// ==================== Client Types ====================
export type ClientStatus = "New Client" | "Active" | "Churning" | "Churned";

export type ClientSegment =
  | "Loyal Client"
  | "High-Spender Client"
  | "Repeat Client"
  | "One-time Client";

export interface Client {
  id: string;
  name: string;
  phone: string;
  status?: ClientStatus;
  segment?: ClientSegment;
  totalSpent?: number;
  aov?: number;
  totalOrders?: number;
  lastPurchaseDate?: string | null;
  lastOrderProduct?: string | null;
}

export interface ClientStatusSummary {
  'New Client': number;
  'Active': number;
  'Churning': number;
  'Churned': number;
}

export interface ClientSegmentSummary {
  'Loyal Client': number;
  'High-Spender Client': number;
  'Repeat Client': number;
  'One-time Client': number;
}

export interface ClientStatusResponse {
  clients: Client[];
  summary: ClientStatusSummary;
  totalClients: number;
  totalPages: number;
  allProducts: string[];
  allMarketplaces: string[];
}

export interface ClientSegmentResponse {
  clients: Client[];
  summary: ClientSegmentSummary;
  totalClients: number;
  totalPages: number;
  allMarketplaces: string[];
}

// ==================== Prospect Types ====================
export type ProspectStatus = "Active" | "Inactive";

export interface Prospect {
  id: string;
  name: string;
  phone: string;
  status: ProspectStatus;
  lastContactDate: string | null;
}

export interface ProspectStatusSummary {
  'Active': number;
  'Inactive': number;
}

export interface ProspectStatusResponse {
  prospects: Prospect[];
  summary: ProspectStatusSummary;
  totalProspects: number;
  totalPages: number;
  allMarketplaces: string[];
}

// ==================== API Request Types ====================
import type { NextApiRequest } from 'next';

export interface ApiRequest extends NextApiRequest {
  method?: string;
  query: { [key: string]: string | string[] | undefined };
  body: any;
}

// ==================== User Types ====================
export interface User {
  name: string;
  email: string;
  picture: string;
}

