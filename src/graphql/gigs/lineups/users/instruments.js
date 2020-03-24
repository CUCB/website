import gql from 'graphql-tag';

const UpdateInstrumentApproved = gql`
    mutation UpdateInstrumentApproved(
        $gig_id: bigint!
        $user_instrument_id: bigint!
        $set_approved: Boolean!
    ) {
        update_cucb_gigs_lineups_instruments(
            where: {
                gig_id: { _eq: $gig_id }
                user_instrument_id: { _eq: $user_instrument_id }
            }
            _set: { approved: $set_approved }
        ) {
            returning {
                approved
            }
        }
    }`;

export const LineupInstruments = gql`
    fragment LineupInstruments on cucb_gigs_lineups {
        user_instruments {
            approved
            user_instrument {
                id
                connections {
                    connection_type {
                        icon_name
                        name
                    }
                }
                deleted
                instrument {
                    name
                }
                nickname
            }
        }
    }
`;

export const setInstrumentApproved = async ({client, people, errors, gigId, userId}, user_instrument_id, set_approved) => {
    const graphql_res = await client.mutate({
        mutation: UpdateInstrumentApproved,
        variables: { set_approved, gig_id: gigId, user_instrument_id }
    });

    if (graphql_res.data.update_cucb_gigs_lineups_instruments.returning) {
        return {people: people.setIn(
            [userId, "user_instruments", user_instrument_id, "approved"],
            graphql_res.data.update_cucb_gigs_lineups_instruments.returning[0]
                .approved
        ), errors};
    } else {
        return {people, errors: errors.push(graphql_res)};
    }
}
