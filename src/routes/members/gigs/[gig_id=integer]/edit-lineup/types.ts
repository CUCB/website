import type { UserInstrument } from "../../../users/[id=integer]/types";

export interface UserName {
  id: string;
  first: string;
  last: string;
  gig_notes: string;
}
export interface Person {
  user: {
    first: string;
    last: string;
    id: string;
    attributes: string[];
    gig_notes: string;
  };
  user_available?: boolean;
  user_only_if_necessary?: boolean;
  approved?: boolean | null;
  user_instruments: Record<string, LineupInstrument>;
  leader: boolean;
  equipment: boolean;
  money_collector: boolean;
  money_collector_notified: boolean;
}

export interface LineupInstrument {
  user_instrument: UserInstrument;
  approved?: boolean | null;
  deleted?: boolean;
}
