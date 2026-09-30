export type AppRole = "user" | "admin";
export type AccountStatus = "pending" | "active" | "suspended" | "deactivated";

export type NeedStatus =
  | "submitted"
  | "under_review"
  | "needs_clarification"
  | "looking_for_match"
  | "match_suggested"
  | "connection_proposed"
  | "connected"
  | "conversation_active"
  | "resolved"
  | "rejected"
  | "archived";

export type OfferStatus =
  | "submitted"
  | "under_review"
  | "needs_clarification"
  | "active"
  | "matched"
  | "paused"
  | "rejected"
  | "archived";

export type Priority = "low" | "normal" | "high" | "urgent";

export type ConnectionStatus =
  | "proposed"
  | "partially_accepted"
  | "connected"
  | "declined"
  | "cancelled"
  | "completed";

export type PartyResponse = "pending" | "accepted" | "declined";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  phone_verified: boolean;
  avatar_url: string | null;
  country: string | null;
  address: string | null;
  bio: string | null;
  languages: string[];
  skills: string[];
  interests: string[];
  what_they_need: string | null;
  what_they_offer: string | null;
  role: AppRole;
  account_status: AccountStatus;
  onboarding_done: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Need {
  id: string;
  user_id: string;
  category: string;
  not_sure: boolean;
  title: string;
  description: string;
  goal: string | null;
  help_type: string | null;
  location: string | null;
  availability: string | null;
  preferences: string | null;
  status: NeedStatus;
  priority: Priority;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  skills: string[];
  experience: string | null;
  availability: string | null;
  preferred_help: string | null;
  location: string | null;
  timezone: string | null;
  status: OfferStatus;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface StatusEvent {
  id: string;
  entity_type: "need" | "offer" | "connection";
  entity_id: string;
  owner_id: string | null;
  status: string;
  message: string | null;
  actor_id: string | null;
  is_internal: boolean;
  created_at: string;
}

export interface AdminNote {
  id: string;
  entity_type: "need" | "offer" | "profile" | "connection";
  entity_id: string;
  author_id: string | null;
  body: string;
  created_at: string;
}

export interface Connection {
  id: string;
  need_id: string | null;
  offer_id: string | null;
  requester_id: string;
  helper_id: string;
  proposed_by: string | null;
  status: ConnectionStatus;
  requester_response: PartyResponse;
  helper_response: PartyResponse;
  requester_note: string | null;
  helper_note: string | null;
  admin_message: string | null;
  cancel_reason: string | null;
  connected_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  connection_id: string;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/** Shape every server action returns, so forms can render errors uniformly. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
