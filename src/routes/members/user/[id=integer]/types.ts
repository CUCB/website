export interface AdminStatus {
  id: string;
  title: string;
}

export interface Instrument {
  id: string;
  name: string;
  novelty: boolean;
  parent_only: boolean;
}

export interface AggregateInstrument {
  id: string;
  name: string;
  novelty: boolean;
  parent_only: boolean;
  parent_id: string | null;
  count: string;
}

export interface UserInstrument {
  instrument: Instrument;
  deleted: boolean;
  nickname?: string;
  id: string;
}

export interface User {
  id: string;
  adminType: {
    id: string;
    title: string;
  };
  first: string;
  last: string;
  bio?: string;
  bioChangedDate?: Date;
  lastLoginDate?: Date;
  joinDate?: Date;
  mobileContactInfo?: string;
  locationInfo?: string;
  email?: string;
  dietaries?: string;
  prefs: {
    pref_type: {
      id: string;
      name: string;
    };
    value: boolean;
  }[];
  gig_lineups: {
    gig: {
      id: string;
      title: string;
      date?: string;
      venue?: {
        name: string;
        subvenue?: string;
      };
    };
    user_instruments: {
      user_instrument: {
        instrument: Instrument;
      };
    }[];
  }[];
  instruments: UserInstrument[];
}

export interface Pref {
  id: string;
  name: string;
  default: boolean;
}

export interface AuthUserType {
  id: string;
  title: string;
}

export interface LoadOutput {
  user: User;
  canEdit: boolean;
  canEditInstruments: boolean;
  allInstruments: AggregateInstrument[];
  currentUser: boolean;
  allPrefs: Pref[];
  profilePictureUpdated: string;
  canEditAdminStatus: boolean;
  allAdminStatuses: AuthUserType[];
}
