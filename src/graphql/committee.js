import gql from "graphql-tag";

export const currentCommittee = gql`
    query CurrentCommittee($current_date: timestamptz!) {
        cucb_committees(limit: 1, order_by: {started: desc}, where: {started: {_lte: $current_date}}) {
            committee_members {
                name
                casual_name
                email_obfus
                committee_key {
                    name
                }
            }
        }
    }`;
