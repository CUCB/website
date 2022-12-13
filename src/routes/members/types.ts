// TODO combine this and data.ts?
export interface SignupGig {
  id: string;
  lineup: SignupGigLineup[];
  finish_time?: Date;
  arrive_time?: Date;
  time?: string;
  date?: Date;
  title: string;
  venue?: SignupGigVenue;
}

export interface SignupGigLineup {
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  user_notes?: string;
  user_instruments: SignupUserInstrument[];
  user: { id: string; gig_notes: string };
}

export interface SignupUserInstrument {
  approved?: boolean;
  chosen?: boolean;
  user_instrument: AvailableUserInstrument;
}

export interface SignupGigVenue {
  id: string;
  name: string;
  map_link?: string;
  subvenue?: string;
}

export interface AvailableUserInstrument {
  id: string;
  nickname?: string;
  instrument: {
    name: string;
    novelty: boolean;
  };
}
