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
}

export interface AvailableUserInstrument {
  id: string;
  nickname?: string | null;
  instrument: {
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

export interface GigSummary {}
