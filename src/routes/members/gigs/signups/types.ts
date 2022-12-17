import type { DateTime } from "luxon";

export interface User {
  id: string;
  first: string;
  last: string;
  gig_notes: string;
}
export interface LineupEntry {
  approved?: boolean;
  user: User;
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  user_notes?: string;
}
export interface Gig {
  id: string;
  date?: string;
  sort_date: Date;
  lineup: LineupEntry[];
  title: string;
}
