export interface Contact {
  id: number;
  name: string;
  caller: boolean;
  email: string;
  organization: string;
  notes: string;
}

export interface GigContact {
  id: number;
  contact: Contact;
  client: boolean;
  calling: boolean;
}

export interface Gig {
  title: string;
  date: string;
  time: string;
  posting_time: string;
  posting_user: User;
  editing_time: string;
  editing_user: User;
  venue_id: number;
  venue: Venue;
  type_id: number;
  id: number;
  admins_only: boolean;
  advertise: boolean;
  allow_signups: boolean;
  food_provided: boolean;
  notes_admin: string;
  notes_band: string;
  summary: string;
  contacts: GigContact[];
  arrive_time: string;
  finish_time: string;
  finance: string;
  finance_deposit_received: boolean;
  finance_payment_received: boolean;
  finance_caller_paid: boolean;
  quote_date: string;
}

export interface Venue {
  id: number;
  name: string;
  subvenue: string;
}

export interface User {
  id: string;
  first: string;
  last: string;
}

export interface GigType {
  id: number;
  title: string;
  code: string;
}
