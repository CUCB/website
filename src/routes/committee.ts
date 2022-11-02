import type { CommitteeMember } from "./layout.types";

export let fallbackPeople: CommitteeMember[] = [
  {
    name: "The President",
    casual_name: "The President",
    email_obfus: "p_r__esid_ent@cu_cb.co.uk",
    committee_key: {
      name: "president",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
  {
    name: "The Secretary",
    casual_name: "The Secretary",
    email_obfus: "se_cre_tar_y@cucb.co.uk",
    committee_key: {
      name: "secretary",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
  {
    name: "The Webmaster",
    casual_name: "The Webmaster",
    email_obfus: "we__bma_ster_@cucb._co.uk",
    committee_key: {
      name: "webmaster",
      __typename: "cucb_committee_keys",
    },
    __typename: "cucb_committee_members",
  },
];
