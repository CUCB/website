import { AttributePreferences, extractAttributes } from "../../graphql/gigs/lineups/users/attributes";
import { LineupInstruments, LineupUserInstrument } from "../../graphql/gigs/lineups/users/instruments";
import { LineupRoles } from "../../graphql/gigs/lineups/users/roles";
import gql from "graphql-tag";
import { Map } from "immutable";

const LineupAvailability = gql`
  fragment LineupAvailability on cucb_gigs_lineups {
    user_available
    user_only_if_necessary
  }
`;

export const FragmentGigLineup = gql`
  fragment GigLineup on cucb_gigs {
    lineup {
      approved
      ...LineupRoles
      user {
        first
        last
        id
        gig_notes
        ...AttributePreferences
        user_instruments {
          ...LineupUserInstrument
        }
      }
      ...LineupInstruments
      ...LineupAvailability
      user_notes
      admin_notes
    }
  }
  ${AttributePreferences}
  ${LineupInstruments}
  ${LineupUserInstrument}
  ${LineupRoles}
  ${LineupAvailability}
`;

export const QueryGigLineup = gql`
  query QueryGigLineup($gig_id: bigint!) {
    cucb_gigs_by_pk(id: $gig_id) {
      ...GigLineup
    }
  }
  ${FragmentGigLineup}
`;

const UpdateLineupUserApproved = gql`
  mutation UpdateLineupUserApproved($userId: bigint!, $gigId: bigint!, $approved: Boolean) {
    update_cucb_gigs_lineups_by_pk(pk_columns: { user_id: $userId, gig_id: $gigId }, _set: { approved: $approved }) {
      approved
    }
  }
`;

export const setApproved = async ({ client, gigId, userId, errors, people }, approved) => {
  const graphql_res = await client.mutate({
    mutation: UpdateLineupUserApproved,
    variables: { approved, userId, gigId },
  });

  if (graphql_res.data.update_cucb_gigs_lineups_by_pk) {
    return {
      people: people.setIn([userId, "approved"], graphql_res.data.update_cucb_gigs_lineups_by_pk.approved),
      errors,
    };
  } else {
    return { people, errors: errors.push(graphql_res.message) };
  }
};

const UpdateLineupUserAdminNotes = gql`
  mutation UpdateLineupUserApproved($userId: bigint!, $gigId: bigint!, $adminNotes: String) {
    update_cucb_gigs_lineups_by_pk(
      pk_columns: { user_id: $userId, gig_id: $gigId }
      _set: { admin_notes: $adminNotes }
    ) {
      admin_notes
    }
  }
`;

export const setAdminNotes = async ({ client, gigId, userId, errors, people }, adminNotes) => {
  const graphql_res = await client.mutate({
    mutation: UpdateLineupUserAdminNotes,
    variables: { adminNotes, userId, gigId },
  });

  if (graphql_res.data.update_cucb_gigs_lineups_by_pk) {
    return {
      people: people.setIn([userId, "admin_notes"], graphql_res.data.update_cucb_gigs_lineups_by_pk.admin_notes),
      errors,
    };
  } else {
    return { people, errors: errors.push(graphql_res.message) };
  }
};

export const AllUserNames = gql`
  query AllUserNames {
    cucb_users(where: { admin_type: { hasura_role: { _nilike: "music_only" } } }, order_by: { first: asc, last: asc }) {
      id
      first
      last
    }
  }
`;

export const AddUserToGig = gql`
  mutation AddUserToGig($userId: bigint!, $gigId: bigint!) {
    insert_cucb_gigs_lineups_one(object: { user_id: $userId, gig_id: $gigId }) {
      approved
      ...LineupRoles
      user {
        first
        last
        id
        gig_notes
        ...AttributePreferences
        user_instruments {
          ...LineupUserInstrument
        }
      }
      ...LineupInstruments
      ...LineupAvailability
      user_notes
      admin_notes
    }
  }
  ${AttributePreferences}
  ${LineupInstruments}
  ${LineupUserInstrument}
  ${LineupRoles}
  ${LineupAvailability}
`;

export const addUser = async ({ client, gigId, errors, people }, userId) => {
  const graphql_res = await client.mutate({
    mutation: AddUserToGig,
    variables: { userId, gigId },
  });

  if (graphql_res.data.insert_cucb_gigs_lineups_one) {
    let person = graphql_res.data.insert_cucb_gigs_lineups_one;
    person.user.attributes = extractAttributes(person.user);
    person.user.prefs = undefined;
    return {
      people: people.set("" + userId, person),
      errors,
    };
  } else {
    return { people, errors: errors.push(graphql_res.message) };
  }
};

export const DestroyLineup = gql`
  mutation DestroyLineup($gigId: bigint!) {
    delete_cucb_gigs_lineups_instruments(where: { gig_id: { _eq: $gigId } }) {
      affected_rows
    }
    delete_cucb_gigs_lineups(where: { gig_id: { _eq: $gigId } }) {
      affected_rows
    }
  }
`;

export const destroyLineupInformation = async ({ client, gigId, errors, people }) => {
  const graphql_res = await client.mutate({
    mutation: DestroyLineup,
    variables: { gigId },
  });

  if (graphql_res.data.delete_cucb_gigs_lineups) {
    return {
      people: new Map(),
      errors,
    };
  } else {
    return { people, errors: errors.push(graphql_res.message) };
  }
};
