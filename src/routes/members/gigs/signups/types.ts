export interface User {
  id: string;
  first: string;
  last: string;
  gig_notes: string;
}
export interface LineupEntry {
  approved?: boolean | null;
  user: User;
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  user_notes?: string;
}
export interface Gig {
  id: string;
  date?: string | null;
  sort_date: Date;
  lineup: LineupEntry[];
  title: string;
}
