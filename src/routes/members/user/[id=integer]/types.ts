export interface AdminStatus {
  id: number;
  title: string;
}

export interface Instrument {
  id: number;
  name: string;
  novelty: boolean;
  parent_id: number | null;
  parent_only: boolean;
  users_instruments_aggregate: {
    aggregate: {
      count: number;
    };
  };
}

export interface UserInstrument {
  instrument: Instrument;
  deleted: boolean;
  nickname: string | null;
  id: number;
}

export interface User {
  id: number;
  admin_type?: {
    id: number;
    title: string;
  };
  first: string;
  last: string;
  bio: string | null;
  bio_changed_date: string | null;
  last_login_date: string | null;
  join_date: string | null;
  mobile_contact_info?: string | null;
  location_info?: string | null;
  email: string | null;
  dietaries: string | null;
  prefs: [
    {
      pref_type: {
        id: number;
        name: string;
      };
      value: boolean;
    },
  ];
  user_prefs: [
    {
      pref_id: number;
    },
  ];
  gig_lineups: [
    {
      gig: {
        id: number;
        title: string;
        date: string | null;
        venue: {
          name: string;
          subvenue: string | null;
        };
      };
      user_instruments: [
        {
          user_instrument: {
            instrument: Instrument;
          };
        },
      ];
    },
  ];
  user_instruments: UserInstrument[];
}

export interface Pref {
  id: number;
  name: string;
  default: boolean;
}
