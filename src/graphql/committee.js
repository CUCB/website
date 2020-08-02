import gql from "graphql-tag";

export const currentCommittee = gql`
  query CurrentCommittee {
    cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
      committee_members {
        name
        casual_name
        email_obfus
        committee_key {
          name
        }
      }
    }
  }
`;

export const currentCommitteePictures = gql`
  query CurrentCommitteePictures {
    cucb_committees(limit: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
      committee_members(order_by: { committee_position: { position: asc }, name: asc }) {
        name
        pic
        sub_position
        comments
        email_obfus
        april_fools_dir
        april_fools_only
        committee_key {
          name
        }
        committee: committeeByCommittee {
          pic_folder
        }
        position: committee_position {
          name
        }
      }
    }
  }
`;

export const pastCommitteePictures = gql`
  query PastCommitteePictures {
    cucb_committees(offset: 1, order_by: { started: desc }, where: { started: { _lte: "now()" } }) {
      started
      committee_members(order_by: { committee_position: { position: asc }, name: asc }) {
        name
        pic
        sub_position
        comments
        email_obfus
        april_fools_dir
        april_fools_only
        committee_key {
          name
        }
        committee: committeeByCommittee {
          pic_folder
        }
        position: committee_position {
          name
        }
      }
    }
  }
`;
