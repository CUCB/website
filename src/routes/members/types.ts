// TODO combine this and data.ts?
export interface SignupGig {
  id: string;
  lineup: SignupGigLineup[];
  finish_time?: Date | null;
  arrive_time?: Date | null;
  time?: string | null;
  date?: Date | null;
  title: string;
  venue?: SignupGigVenue | null;
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
  map_link?: string | null;
  subvenue?: string | null;
  address?: string | null;
  postcode?: string | null;
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
  title: string;
  time: string | null;
  arrive_time: Date | null;
  finish_time: Date | null;
  date: Date | null;
  summary: string;
  notes_band: string;
  notes_admin: string;
  contacts: SummaryContact[];
  lineup: SummaryLineupEntry[];
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
    name: string;
  };
  client?: boolean;
  calling: boolean;
}
