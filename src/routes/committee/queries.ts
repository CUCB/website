import { PopulateHint, QueryOrder, type EntityField, type FilterQuery, type Loaded } from "@mikro-orm/core";
import { wrap } from "@mikro-orm/core";
import orm from "$lib/database";
import { Committee as DbCommittee } from "$lib/entities/Committee";
import type { CommitteeMember as DbCommitteeMember } from "$lib/entities/CommitteeMember";

interface Committee {
  members: {
    position: {
      id: string;
      name: string;
      position: string;
    };
    lookup_name: {
      id: string;
      name: string;
    };
    committee: {
      id: string;
      pic_folder?: string;
      started: Date;
    };
    name: string;
    casual_name: string;
    email_obfus?: string | null;
    comments?: string | null;
    april_fools_only: boolean;
    hidden: boolean;
    sub_position?: string | null;
  }[];
  started: Date;
}

const committeeMemberFields: EntityField<DbCommitteeMember, string>[] = [
  { position: ["id", "name", "position"] },
  { lookup_name: ["id", "name"] },
  { committee: ["id", "pic_folder", "started"] },
  "name",
  "casual_name",
  "email_obfus",
  "pic",
  "comments",
  "april_fools_only",
  "hidden",
  "sub_position",
];

// TODO get opts typechecking properly
export const fetchCommittees = (where: FilterQuery<DbCommittee>, opts: any = {}): Promise<Committee[]> =>
  orm()
    .then((orm) =>
      orm.em.fork().find(DbCommittee, where, {
        ...opts,
        orderBy: { started: QueryOrder.DESC, members: { position: { position: QueryOrder.ASC } } },
        fields: [
          {
            members: committeeMemberFields,
          },
          "started",
          "pic_folder",
        ],
        populateWhere: PopulateHint.INFER,
      }),
    )
    .then((res: Loaded<DbCommittee, string>[]) => res.map((committee) => wrap(committee).toPOJO()));

export const fetchLatestCommittee = () =>
  fetchCommittees({ started: { $lte: "now()" } }, { limit: 1 }).then((committees) => committees[0]);
