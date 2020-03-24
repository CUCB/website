import gql from "graphql-tag";

const UpdateLineupUserRole = gql`
    mutation UpdateLineupUserRole(
        $gig_id: bigint!
        $user_id: bigint!
        $set_role: cucb_gigs_lineups_set_input
    ) {
        update_cucb_gigs_lineups(
            where: { gig_id: { _eq: $gig_id }, user_id: { _eq: $user_id } }
            _set: $set_role
        ) {
            returning {
                leader
                money_collector
                equipment
            }
        }
    }
`;

export const LineupRoles = gql`
    fragment LineupRoles on cucb_gigs_lineups {
        leader
        equipment
        money_collector
    }
`;

export const setRole = async (
    { client, gigId, userId, errors, people },
    role,
    value
) => {
    let set_role = {};
    set_role[role] = value;
    const graphql_res = await client.mutate({
        mutation: UpdateLineupUserRole,
        variables: { set_role, gig_id: gigId, user_id: userId }
    });

    if (graphql_res.data.update_cucb_gigs_lineups) {
        return {
            people: people.setIn(
                [userId, role],
                graphql_res.data.update_cucb_gigs_lineups.returning[0][role]
            ),
            errors
        };
    } else {
        return { people, errors: errors.push(graphql_res.message) };
    }
};
