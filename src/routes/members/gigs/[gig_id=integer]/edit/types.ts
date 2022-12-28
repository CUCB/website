export interface Contact {
  id: string;
  name: string;
  caller: boolean;
  email?: string | null;
  organization?: string | null;
  notes?: string | null;
}

export interface GigContact {
  contact: Contact;
  client: boolean;
  calling: boolean;
}

export interface Gig {
  title: string;
  date?: string | null;
  time?: string | null;
  posting_time?: string;
  posting_user?: User;
  editing_time?: string;
  editing_user?: User;
  venue?: string;
  id: string;
  admins_only: boolean;
  advertise: boolean;
  allow_signups: boolean;
  food_provided: boolean;
  notes_admin?: string;
  notes_band?: string;
  summary?: string;
  contacts: GigContact[];
  arrive_time?: string | null;
  finish_time?: string | null;
  finance?: string | null;
  finance_deposit_received?: boolean;
  finance_payment_received?: boolean;
  finance_caller_paid?: boolean;
  quote_date?: string | null;
  type: string;
}

export interface Venue {
  id: string;
  name: string;
  subvenue?: string | null;
  map_link?: string | null;
  distance_miles?: string | null;
  notes_admin?: string | null;
  notes_band?: string | null;
  address?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface User {
  id: string;
  first: string;
  last: string;
}

export interface GigType {
  id: string;
  title: string;
  code: string;
}
