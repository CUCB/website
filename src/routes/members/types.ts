export interface SignupGig {
  id: string;
  lineup: SignupGigLineup[];
  finish_time?: Date | null;
  arrive_time?: Date | null;
  time?: string | null;
  date?: Date | null;
  title: string;
  venue?: SignupGigVenue | null;
  allow_signups: boolean;
}

export interface SignupGigLineup {
  user_available?: boolean | null;
  user_only_if_necessary?: boolean | null;
  user_notes?: string | null;
  user_instruments: SignupUserInstrument[];
  user: { id: string; gig_notes: string };
}

export interface SignupUserInstrument {
  approved?: boolean | null;
  chosen?: boolean | null;
  user_instrument: AvailableUserInstrument;
}

export interface SignupGigVenue {
  id: string;
  name: string;
  map_link?: string | null | undefined;
  subvenue?: string | null | undefined;
  address?: string | null | undefined;
  postcode?: string | null | undefined;
}

export interface AvailableUserInstrument {
  id: string;
  nickname?: string | null;
  instrument: {
    id: string;
    name: string;
    novelty: boolean;
  };
}

export interface SignupSummaryEntry {
  user: {
    first: string;
    last: string;
  };
  user_available?: boolean | null;
  user_only_if_necessary?: boolean | null;
  gig: {
    id: string;
  };
}

export interface GigSummary {
  id: string;
  title: string;
  time?: string | null;
  arrive_time?: Date | null;
  finish_time?: Date | null;
  date?: Date | null;
  summary?: string;
  notes_band?: string;
  notes_admin?: string;
  contacts: SummaryContact[];
  lineup: SummaryLineupEntry[];
  allow_signups?: boolean;
  admins_only?: boolean;
  food_provided: boolean;
  type: {
    id: string;
    code: string;
    title: string;
  };
  venue?: SignupGigVenue | undefined;
  finance?: string | null;
  finance_deposit_received?: boolean;
  finance_payment_received?: boolean;
  finance_caller_paid?: boolean;
  advertise: boolean;
  quote_date?: Date | null;
  posting_time?: Date | null;
  posting_user?: {
    id: string;
    first: string;
    last: string;
  };
  editing_user?: {
    id: string;
    first: string;
    last: string;
  };
}

export interface SummaryLineupEntry {
  leader: boolean;
  user_instruments: SignupUserInstrument[];
  user: {
    first: string;
    last: string;
    email?: string;
  };
}

export interface SummaryContact {
  contact: {
    id: string;
    name: string;
    organization?: string | null;
  };
  client?: boolean;
  calling: boolean;
}
