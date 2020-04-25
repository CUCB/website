import gql from "graphql-tag";

export const FragmentGigDetails = gql`
    fragment GigDetails on cucb_gigs {
        title
    }`;

export const QueryGigDetails = gql`
    query QueryGigDetails($gig_id: bigint!) {
        cucb_gigs_by_pk(id: $gig_id) {
            ...GigDetails
        }
    }
    ${FragmentGigDetails}
`;
