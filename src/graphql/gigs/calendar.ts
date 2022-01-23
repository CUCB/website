import gql from "graphql-tag";

export const CalendarGig = gql`
  fragment CalendarGig on cucb_gigs {
    id
    title
    date
    time
    summary
    arrive_time
    finish_time
    notes_band
    contacts {
      calling
      contact {
        name
      }
    }
    lineup(where: { approved: { _eq: true } }) {
      leader
      user {
        first
        last
      }
      user_instruments(where: { approved: { _eq: true } }) {
        user_instrument {
          instrument {
            id
            name
          }
        }
      }
    }
  }
`;

export const AdminCalendarGig = gql`
  fragment AdminCalendarGig on cucb_gigs {
    id
    title
    date
    time
    summary
    arrive_time
    finish_time
    notes_band
    notes_admin
    contacts {
      client
      calling
      contact {
        name
      }
    }
    lineup(where: { approved: { _eq: true } }) {
      leader
      user {
        first
        last
        email
      }
      user_instruments(where: { approved: { _eq: true } }) {
        user_instrument {
          instrument {
            id
            name
          }
        }
      }
    }
  }
`;

export const AllGigsFrom = gql`
  query AllGigsFrom($user_id: bigint!, $startDate: date!, $startTime: timestamptz!) {
    cucb_gigs(
      where: {
        gig_type: { code: { _neq: "gig_cancelled" } }
        _or: [{ date: { _gte: $startDate } }, { arrive_time: { _gte: $startTime } }]
      }
      order_by: { sort_date: asc }
    ) {
      ...CalendarGig
    }
    cucb_users_by_pk(id: $user_id) {
      id
      first
      last
    }
  }
  ${CalendarGig}
`;

export const AdminAllGigsFrom = gql`
  query AdminAllGigsFrom($user_id: bigint!, $startDate: date!, $startTime: timestamptz!) {
    cucb_gigs(
      where: {
        gig_type: { code: { _neq: "gig_cancelled" } }
        _or: [{ date: { _gte: $startDate } }, { arrive_time: { _gte: $startTime } }]
      }
      order_by: { sort_date: asc }
    ) {
      ...AdminCalendarGig
    }
    cucb_users_by_pk(id: $user_id) {
      id
      first
      last
    }
  }
  ${AdminCalendarGig}
`;

export const MyGigsFrom = gql`
  query MyGigsFrom($user_id: bigint!, $startDate: date!, $startTime: timestamptz!) {
    cucb_users_by_pk(id: $user_id) {
      first
      last
      gig_lineups(
        where: {
          gig: {
            gig_type: { code: { _neq: "gig_cancelled" } }
            _or: [{ date: { _gte: $startDate } }, { arrive_time: { _gte: $startTime } }]
          }
        }
        order_by: { gig: { sort_date: asc } }
      ) {
        id
        gig {
          ...CalendarGig
        }
      }
    }
  }
  ${CalendarGig}
`;

export const AdminMyGigsFrom = gql`
  query AdminMyGigsFrom($user_id: bigint!, $startDate: date!, $startTime: timestamptz!) {
    cucb_users_by_pk(id: $user_id) {
      first
      last
      gig_lineups(
        where: {
          gig: {
            gig_type: { code: { _neq: "gig_cancelled" } }
            _or: [{ date: { _gte: $startDate } }, { arrive_time: { _gte: $startTime } }]
          }
        }
        order_by: { gig: { sort_date: asc } }
      ) {
        id
        gig {
          ...AdminCalendarGig
        }
      }
    }
  }
  ${AdminCalendarGig}
`;

export const AdminSingleGig = gql`
  query AdminSingleGig($id: bigint!) {
    cucb_gigs_by_pk(id: $id) {
      ...AdminCalendarGig
    }
  }
  ${AdminCalendarGig}
`;
export const SingleGig = gql`
  query SingleGig($id: bigint!) {
    cucb_gigs_by_pk(id: $id) {
      ...CalendarGig
    }
  }
  ${CalendarGig}
`;

export const UpdateLastCalendarAccess = gql`
  mutation UpdateLastCalendarAccess(
    $user_id: bigint!
    $calendar_type: cucb_calendar_subscriptions_types_enum!
    $ip_address: String!
  ) {
    insert_cucb_calendar_subscriptions_one(
      object: { calendar_type: $calendar_type, ip_address: $ip_address, user_id: $user_id, last_accessed: "now()" }
      on_conflict: { constraint: calendar_subscriptions_pkey, update_columns: [last_accessed, ip_address] }
    ) {
      user_id
      last_accessed
      ip_address
      calendar_type
    }
  }
`;

export const gigAdminGuard = gql`
  query GigAdminGuard {
    cucb_gigs(where: { id: { _is_null: true } }) {
      notes_admin
    }
  }
`;
