export interface User {
  id: number;
  first: string;
  last: string;
  gig_notes: string | null;
}
export interface LineupEntry {
  approved: boolean | null;
  user: User;
  user_available: boolean | null;
  user_only_if_necessary: boolean | null;
  user_notes: string | null;
}
export interface Gig {
  id: number;
  date: string;
  sort_date: string;
  lineup: LineupEntry[];
  title: string;
}
